"""
SolarGuard-TR — XGBoost Binary Classifier (Secondary Model)
============================================================
Operates on FLAT feature vectors (no sequence dimension).
Handles extreme class imbalance via scale_pos_weight (NOT SMOTE,
because synthetic oversampling violates temporal ordering).
"""

import numpy as np
import xgboost as xgb
from sklearn.metrics import roc_auc_score, classification_report
from pathlib import Path
import pickle

MODELS_DIR = Path(__file__).resolve().parent
XGB_MODEL_DIR = MODELS_DIR


def build_and_train_xgb(
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
    horizon_label: str = "24h",
    save: bool = True,
) -> tuple:
    """
    Train binary XGBoost for M+/X class event prediction.
    Returns (model, y_pred_proba_test).
    """
    n_pos = int(y_train.sum())
    n_neg = len(y_train) - n_pos
    scale_weight = n_neg / max(n_pos, 1)
    print(f"  XGB {horizon_label}  pos={n_pos}  neg={n_neg}  "
          f"scale_pos_weight={scale_weight:.2f}")

    model = xgb.XGBClassifier(
        n_estimators=500,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_weight,
        eval_metric="auc",
        early_stopping_rounds=30,
        random_state=42,
        n_jobs=-1,
        use_label_encoder=False,
        verbosity=0,
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=50,
    )

    y_proba = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, y_proba) if y_test.sum() > 0 else 0.0
    print(f"  XGB AUC ({horizon_label}): {auc:.4f}")

    if save:
        path = XGB_MODEL_DIR / f"xgb_{horizon_label}.pkl"
        with open(path, "wb") as f:
            pickle.dump(model, f)
        print(f"  💾 Saved → {path}")

    return model, y_proba


def train_all_horizons(
    X_train: np.ndarray,
    y_train_dict: dict[str, np.ndarray],
    X_test: np.ndarray,
    y_test_dict: dict[str, np.ndarray],
) -> dict:
    """Train XGBoost for all horizons (24h, 48h, 72h)."""
    results = {}
    for h in ["24h", "48h", "72h"]:
        print(f"\n{'─'*50}")
        print(f"  Training XGBoost — {h}")
        print(f"{'─'*50}")
        model, proba = build_and_train_xgb(
            X_train, y_train_dict[h],
            X_test,  y_test_dict[h],
            horizon_label=h,
        )
        results[h] = {"model": model, "y_pred_proba": proba}
    return results
