"""
SolarGuard-TR — Sequence Builder for LSTM
==========================================
Converts tabular time-series (n_timesteps, n_features)
into 3D LSTM sequences (n_samples, look_back, n_features).

Leakage check: sequence[i] uses rows [i .. i+look_back-1],
target is row [i+look_back]. Strictly backward-looking. SAFE.
"""

from typing import Tuple
import numpy as np


def build_sequences(
    X: np.ndarray,
    y: np.ndarray,
    look_back: int = 72,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Parameters
    ----------
    X : (n_timesteps, n_features)
    y : (n_timesteps, n_targets)
    look_back : number of historical hours the LSTM sees

    Returns
    -------
    X_seq : (n_samples, look_back, n_features)
    y_seq : (n_samples, n_targets)
    """
    X_seq, y_seq = [], []
    for i in range(len(X) - look_back):
        X_seq.append(X[i : i + look_back])
        y_seq.append(y[i + look_back])
    return np.array(X_seq, dtype=np.float32), np.array(y_seq, dtype=np.float32)
