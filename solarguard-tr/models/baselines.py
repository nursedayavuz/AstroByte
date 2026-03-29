"""
SolarGuard-TR — Baseline Models
================================
Mandatory for jüri Q&A:
  "Our LSTM achieves X% higher AUC than the persistence baseline."

Two baselines:
  1. Persistence — predicts tomorrow = today
  2. Climatological — always predicts training-set mean probability
"""

import numpy as np
from sklearn.metrics import roc_auc_score, mean_squared_error


def persistence_baseline_binary(
    y_series: np.ndarray,
    forecast_horizon_hours: int = 24,
) -> float:
    """
    Shift the label by ``forecast_horizon_hours`` timesteps.
    Whatever happened N hours ago is the prediction for now.
    """
    y = np.asarray(y_series, dtype=float)
    y_pred = np.zeros_like(y)
    y_pred[forecast_horizon_hours:] = y[:-forecast_horizon_hours]
    valid = forecast_horizon_hours  # skip first N rows
    if len(y) <= valid or y[valid:].sum() == 0:
        return 0.5  # degenerate — no events
    return roc_auc_score(y[valid:], y_pred[valid:])


def climatological_baseline_binary(
    y_train: np.ndarray,
    y_test: np.ndarray,
) -> float:
    """Always predict the training-set event rate."""
    mean_prob = float(np.mean(y_train))
    y_pred = np.full(len(y_test), mean_prob)
    if y_test.sum() == 0:
        return 0.5
    return roc_auc_score(y_test, y_pred)


def evaluate_all_baselines(
    y_train_24: np.ndarray,
    y_test_24: np.ndarray,
    y_test_48: np.ndarray,
    y_test_72: np.ndarray,
) -> dict:
    """Run all baselines and return results dict."""
    results = {}
    for label, y_test, h in [
        ("24h", y_test_24, 24),
        ("48h", y_test_48, 48),
        ("72h", y_test_72, 72),
    ]:
        p_auc = persistence_baseline_binary(y_test, h)
        c_auc = climatological_baseline_binary(y_train_24, y_test)
        results[label] = {"persistence_auc": p_auc, "climatological_auc": c_auc}
        print(f"  BASELINE {label}:  persistence AUC = {p_auc:.4f}  |  "
              f"climatological AUC = {c_auc:.4f}")
    return results
