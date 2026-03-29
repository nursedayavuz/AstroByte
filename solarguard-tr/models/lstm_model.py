"""
SolarGuard-TR — Multi-Output Bidirectional LSTM (Primary Forecaster)
=====================================================================
Architecture:
  Input(72h, ~80 features)
   → BiLSTM(64) + BN
   → BiLSTM(32) + BN
   → Dense(64) → Dense(32)        ← shared representation
   ├─ 3 × Binary heads  (sigmoid)  → prob M+/X event in 24/48/72h
   └─ 3 × Regression heads (linear) → max Kp in 24/48/72h

Loss weights prioritise 24h predictions (most actionable).
"""

from pathlib import Path
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import (
    Input, LSTM, Dense, Dropout, BatchNormalization, Bidirectional,
)
from tensorflow.keras.optimizers import Adam

MODELS_DIR = Path(__file__).resolve().parent
CHECKPOINT_PATH = str(MODELS_DIR / "best_lstm.keras")


def build_solar_lstm(
    look_back: int = 72,
    n_features: int = 80,
):
    """
    Build and compile the multi-output LSTM.
    Returns a compiled tf.keras.Model.
    """
    inputs = Input(shape=(look_back, n_features), name="temporal_input")

    # Encoder
    x = Bidirectional(
        LSTM(64, return_sequences=True, dropout=0.2, recurrent_dropout=0.1),
        name="bilstm_1",
    )(inputs)
    x = BatchNormalization(name="bn_1")(x)
    x = Bidirectional(
        LSTM(32, return_sequences=False, dropout=0.2, recurrent_dropout=0.1),
        name="bilstm_2",
    )(x)
    x = BatchNormalization(name="bn_2")(x)

    # Shared representation
    shared = Dense(64, activation="relu", name="shared_1")(x)
    shared = Dropout(0.3)(shared)
    shared = Dense(32, activation="relu", name="shared_2")(shared)

    # Binary classification heads (M+/X event probability)
    binary_outputs = []
    for h in [24, 48, 72]:
        head = Dense(16, activation="relu", name=f"bin_head_{h}h")(shared)
        out  = Dense(1, activation="sigmoid", name=f"prob_mx_{h}h")(head)
        binary_outputs.append(out)

    # Regression heads (max Kp forecast)
    regression_outputs = []
    for h in [24, 48, 72]:
        head = Dense(16, activation="relu", name=f"reg_head_{h}h")(shared)
        out  = Dense(1, activation="linear", name=f"kp_forecast_{h}h")(head)
        regression_outputs.append(out)

    all_outputs = binary_outputs + regression_outputs

    model = Model(inputs=inputs, outputs=all_outputs, name="SolarGuard_TR_LSTM")

    losses = {f"prob_mx_{h}h": "binary_crossentropy" for h in [24, 48, 72]}
    losses.update({f"kp_forecast_{h}h": "mse" for h in [24, 48, 72]})

    loss_weights = {
        "prob_mx_24h": 2.0, "prob_mx_48h": 1.5, "prob_mx_72h": 1.0,
        "kp_forecast_24h": 2.0, "kp_forecast_48h": 1.5, "kp_forecast_72h": 1.0,
    }

    model.compile(
        optimizer=Adam(learning_rate=1e-3),
        loss=losses,
        loss_weights=loss_weights,
        metrics={f"prob_mx_{h}h": ["accuracy", "AUC"] for h in [24, 48, 72]},
    )
    return model


def get_training_callbacks():
    """EarlyStopping + ReduceLR + ModelCheckpoint."""
    return [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss", patience=10, restore_best_weights=True, verbose=1,
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=5, min_lr=1e-6, verbose=1,
        ),
        tf.keras.callbacks.ModelCheckpoint(
            filepath=CHECKPOINT_PATH, monitor="val_loss",
            save_best_only=True, verbose=1,
        ),
    ]


def train_lstm(
    X_train_seq, y_train_dict,
    X_val_seq, y_val_dict,
    look_back: int = 72,
    n_features: int = 80,
    epochs: int = 100,
    batch_size: int = 256,
):
    """
    Build, compile, train the LSTM.
    y_*_dict keys: "prob_mx_24h", "prob_mx_48h", "prob_mx_72h",
                   "kp_forecast_24h", "kp_forecast_48h", "kp_forecast_72h"
    Returns (model, history).
    """
    model = build_solar_lstm(look_back=look_back, n_features=n_features)
    model.summary()

    history = model.fit(
        X_train_seq,
        y_train_dict,
        validation_data=(X_val_seq, y_val_dict),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=get_training_callbacks(),
        verbose=1,
    )
    print(f"\n  💾 Best model saved → {CHECKPOINT_PATH}")
    return model, history
