"""
SolarGuard-TR — Evaluation Metrics
====================================
Comprehensive evaluation report for jüri Q&A readiness.
AUC-ROC, AUC-PR, F1, Precision, Recall, Brier Score.
"""

import numpy as np
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    f1_score,
    precision_score,
    recall_score,
    confusion_matrix,
    brier_score_loss,
)


def full_evaluation_report(
    y_true: np.ndarray,
    y_pred_proba: np.ndarray,
    threshold: float = 0.5,
    model_name: str = "LSTM",
) -> dict:
    """Print and return a comprehensive evaluation report."""
    y_bin = (y_pred_proba >= threshold).astype(int)

    has_pos = y_true.sum() > 0 and (1 - y_true).sum() > 0
    auc_roc = roc_auc_score(y_true, y_pred_proba) if has_pos else 0.0
    auc_pr  = average_precision_score(y_true, y_pred_proba) if has_pos else 0.0
    f1      = f1_score(y_true, y_bin, zero_division=0)
    prec    = precision_score(y_true, y_bin, zero_division=0)
    rec     = recall_score(y_true, y_bin, zero_division=0)
    brier   = brier_score_loss(y_true, y_pred_proba)
    cm      = confusion_matrix(y_true, y_bin)

    print(f"\n{'='*50}")
    print(f"  {model_name} EVALUATION REPORT")
    print(f"{'='*50}")
    print(f"  AUC-ROC   : {auc_roc:.4f}  (primary metric)")
    print(f"  AUC-PR    : {auc_pr:.4f}  (key for imbalanced data)")
    print(f"  F1-Score  : {f1:.4f}")
    print(f"  Precision : {prec:.4f}  (false alarm rate)")
    print(f"  Recall    : {rec:.4f}  (miss rate)")
    print(f"  Brier     : {brier:.4f}  (calibration, lower = better)")
    print(f"  Confusion Matrix:\n{cm}")

    return {
        "auc_roc": round(auc_roc, 4),
        "auc_pr": round(auc_pr, 4),
        "f1": round(f1, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "brier": round(brier, 4),
    }
