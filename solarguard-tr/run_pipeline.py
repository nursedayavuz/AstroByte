"""
SolarGuard-TR — Master Pipeline Runner
========================================
Run end-to-end:
  1. Fetch DONKI data  (or use cached)
  2. Preprocess & feature-engineer
  3. Train baselines
  4. Train XGBoost
  5. Train LSTM
  6. Evaluate all models
  7. Print final report

Usage:
  python run_pipeline.py                  # full pipeline
  python run_pipeline.py --skip-fetch     # use cached DONKI data
  python run_pipeline.py --skip-lstm      # skip LSTM (use XGB only)
"""

import sys
import argparse
import numpy as np
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))


def main():
    parser = argparse.ArgumentParser(description="SolarGuard-TR Pipeline")
    parser.add_argument("--skip-fetch", action="store_true",
                        help="Skip DONKI fetch (use cached JSON)")
    parser.add_argument("--skip-lstm", action="store_true",
                        help="Skip LSTM training (XGBoost + baselines only)")
    parser.add_argument("--epochs", type=int, default=100,
                        help="LSTM training epochs (default 100)")
    parser.add_argument("--look-back", type=int, default=72,
                        help="LSTM look-back window in hours (default 72)")
    args = parser.parse_args()

    # ──────────────────────────────────────────────────────────────────────
    # 1. FETCH
    # ──────────────────────────────────────────────────────────────────────
    from data.donki_fetcher import fetch_all_endpoints
    from data.preprocessor import (
        run_preprocessing_pipeline,
        get_feature_and_target_cols,
    )

    print("╔══════════════════════════════════════════════╗")
    print("║   SolarGuard-TR  —  Full Pipeline            ║")
    print("╚══════════════════════════════════════════════╝\n")

    if not args.skip_fetch:
        print("🌐 STEP 1/6  Fetching DONKI data …")
        datasets = fetch_all_endpoints()
    else:
        print("📂 STEP 1/6  Loading cached DONKI data …")
        import json, pandas as pd
        raw_dir = PROJECT_ROOT / "data" / "raw"
        datasets = {}
        for ep in ["FLR", "CME", "GST", "SEP", "HSS"]:
            files = sorted(raw_dir.glob(f"{ep}_*.json"))
            all_rec = []
            for f in files:
                with open(f, encoding="utf-8") as fh:
                    all_rec.extend(json.load(fh))
            datasets[ep] = pd.DataFrame(all_rec) if all_rec else pd.DataFrame()
            print(f"  {ep:4s} → {len(datasets[ep]):>6,} records from {len(files)} cache files")

    # ──────────────────────────────────────────────────────────────────────
    # 2. PREPROCESS
    # ──────────────────────────────────────────────────────────────────────
    print("\n🔧 STEP 2/6  Preprocessing …")
    train, test, scaler, feature_cols, target_cols = run_preprocessing_pipeline(datasets)

    # Separate targets
    binary_targets = [c for c in target_cols if c.startswith("target_mx_event")]
    kp_targets     = [c for c in target_cols if c.startswith("target_max_kp")]

    X_train = train[feature_cols].values
    X_test  = test[feature_cols].values

    # ──────────────────────────────────────────────────────────────────────
    # 3. BASELINES
    # ──────────────────────────────────────────────────────────────────────
    print("\n📏 STEP 3/6  Baseline models …")
    from models.baselines import evaluate_all_baselines

    baseline_results = evaluate_all_baselines(
        y_train_24=train["target_mx_event_24h"].values,
        y_test_24=test["target_mx_event_24h"].values,
        y_test_48=test["target_mx_event_48h"].values,
        y_test_72=test["target_mx_event_72h"].values,
    )

    # ──────────────────────────────────────────────────────────────────────
    # 4. XGBOOST
    # ──────────────────────────────────────────────────────────────────────
    print("\n🌲 STEP 4/6  XGBoost training …")
    from models.xgb_model import train_all_horizons as xgb_train

    y_train_dict_xgb = {f"{h}h": train[f"target_mx_event_{h}h"].values for h in [24, 48, 72]}
    y_test_dict_xgb  = {f"{h}h": test[f"target_mx_event_{h}h"].values  for h in [24, 48, 72]}

    xgb_results = xgb_train(X_train, y_train_dict_xgb, X_test, y_test_dict_xgb)

    # ──────────────────────────────────────────────────────────────────────
    # 5. LSTM
    # ──────────────────────────────────────────────────────────────────────
    if not args.skip_lstm:
        print("\n🧠 STEP 5/6  LSTM training …")
        from models.sequence_builder import build_sequences
        from models.lstm_model import train_lstm

        # Build sequences
        y_cols_for_seq = (
            [f"target_mx_event_{h}h" for h in [24, 48, 72]]
            + [f"target_max_kp_{h}h" for h in [24, 48, 72]]
        )

        X_train_seq, y_train_seq = build_sequences(
            X_train,
            train[y_cols_for_seq].values,
            look_back=args.look_back,
        )
        X_test_seq, y_test_seq = build_sequences(
            X_test,
            test[y_cols_for_seq].values,
            look_back=args.look_back,
        )

        print(f"  Sequences: train={X_train_seq.shape}, test={X_test_seq.shape}")

        # Build target dicts for Keras multi-output
        y_train_keras = {
            f"prob_mx_{h}h": y_train_seq[:, i] for i, h in enumerate([24, 48, 72])
        }
        y_train_keras.update({
            f"kp_forecast_{h}h": y_train_seq[:, 3 + i] for i, h in enumerate([24, 48, 72])
        })

        y_test_keras = {
            f"prob_mx_{h}h": y_test_seq[:, i] for i, h in enumerate([24, 48, 72])
        }
        y_test_keras.update({
            f"kp_forecast_{h}h": y_test_seq[:, 3 + i] for i, h in enumerate([24, 48, 72])
        })

        model, history = train_lstm(
            X_train_seq, y_train_keras,
            X_test_seq, y_test_keras,
            look_back=args.look_back,
            n_features=len(feature_cols),
            epochs=args.epochs,
        )
    else:
        print("\n⏭️  STEP 5/6  LSTM skipped (--skip-lstm)")

    # ──────────────────────────────────────────────────────────────────────
    # 6. EVALUATE
    # ──────────────────────────────────────────────────────────────────────
    print("\n📊 STEP 6/6  Evaluation …")
    from evaluation.metrics import full_evaluation_report

    for h in ["24h", "48h", "72h"]:
        if h in xgb_results:
            full_evaluation_report(
                y_test_dict_xgb[h],
                xgb_results[h]["y_pred_proba"],
                model_name=f"XGBoost-{h}",
            )

    # ──────────────────────────────────────────────────────────────────────
    print("\n╔══════════════════════════════════════════════╗")
    print("║   ✅  Pipeline Complete!                      ║")
    print("║   Run:  uvicorn api.main:app --reload         ║")
    print("╚══════════════════════════════════════════════╝")


if __name__ == "__main__":
    main()
