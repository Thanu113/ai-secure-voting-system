import os
import sys

# Ensure training directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import joblib
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from generate_synthetic_data import generate_synthetic_telemetry

def train_and_save_model():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    csv_path = os.path.join(base_dir, "synthetic_voting_telemetry.csv")
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
    else:
        print("[Training] Generating synthetic voting data on-the-fly...")
        df = generate_synthetic_telemetry()
        df.to_csv(csv_path, index=False)

    feature_cols = [
        "login_frequency_24h",
        "ip_change_count",
        "time_to_vote_seconds",
        "failed_attempts_ratio",
        "hour_of_day"
    ]

    X = df[feature_cols].values
    contamination_rate = float(df["is_anomaly"].sum() / len(df))
    print(f"[Training] Contamination rate: {contamination_rate:.4f} ({df['is_anomaly'].sum()} / {len(df)})")

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(
        n_estimators=100,
        contamination=contamination_rate,
        random_state=42,
        n_jobs=1
    )
    model.fit(X_scaled)

    # Save artifacts
    model_file = os.path.join(models_dir, "isolation_forest.joblib")
    scaler_file = os.path.join(models_dir, "scaler.joblib")

    joblib.dump(model, model_file)
    joblib.dump(scaler, scaler_file)

    print(f"[Training] Model successfully serialized to: {model_file}")
    print(f"[Training] Scaler successfully serialized to: {scaler_file}")

    return model, scaler

if __name__ == "__main__":
    train_and_save_model()
