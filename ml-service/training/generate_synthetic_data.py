import os
import numpy as np
import pandas as pd

def generate_synthetic_telemetry(n_normal=8000, n_anomaly=400, random_state=42) -> pd.DataFrame:
    """
    Generates synthetic voting session telemetry combining legitimate human voter behaviors
    and malicious automated/bot threat vectors.
    """
    np.random.seed(random_state)

    # 1. Normal Authentic Voter Behavior
    # - login_frequency_24h: ~ Poisson(1.5), min 1
    norm_login_freq = np.clip(np.random.poisson(lam=1.5, size=n_normal), 1, 6)
    # - ip_change_count: ~ 90% same IP, 10% mobile handoff (1-2 changes)
    norm_ip_changes = np.random.choice([0, 1, 2], size=n_normal, p=[0.85, 0.12, 0.03])
    # - time_to_vote_seconds: ~ Normal(38s, 12s), min 8s, max 180s (reading candidates, taking selfie)
    norm_time_to_vote = np.clip(np.random.normal(loc=38.0, scale=12.0, size=n_normal), 8.0, 180.0)
    # - failed_attempts_ratio: ~ Beta(1, 30), usually 0 or small
    norm_failed_ratio = np.clip(np.random.beta(a=1, b=30, size=n_normal), 0.0, 0.25)
    # - hour_of_day: ~ peak daytime hours (8am - 10pm)
    norm_hour = np.clip(np.random.normal(loc=14.0, scale=4.0, size=n_normal), 6.0, 23.0)

    df_normal = pd.DataFrame({
        "login_frequency_24h": norm_login_freq,
        "ip_change_count": norm_ip_changes,
        "time_to_vote_seconds": norm_time_to_vote,
        "failed_attempts_ratio": norm_failed_ratio,
        "hour_of_day": norm_hour,
        "is_anomaly": 0 # Ground truth label for evaluation
    })

    # 2. Anomalous / Malicious Threat Behaviors
    # Sub-category A: Fast Bot Scripts (Sub-second ballot submission)
    n_bots = n_anomaly // 2
    bot_login_freq = np.random.randint(1, 4, size=n_bots)
    bot_ip_changes = np.random.choice([0, 1], size=n_bots)
    bot_time_to_vote = np.random.uniform(0.1, 1.8, size=n_bots) # Under 2 seconds!
    bot_failed_ratio = np.zeros(n_bots)
    bot_hour = np.random.uniform(0, 24, size=n_bots)

    # Sub-category B: Credential Stuffing / Sybil Attack (High failed logins, multiple IPs, off-hours)
    n_sybil = n_anomaly - n_bots
    sybil_login_freq = np.random.randint(8, 25, size=n_sybil)
    sybil_ip_changes = np.random.randint(3, 10, size=n_sybil)
    sybil_time_to_vote = np.random.uniform(4.0, 15.0, size=n_sybil)
    sybil_failed_ratio = np.random.uniform(0.45, 0.95, size=n_sybil)
    sybil_hour = np.random.choice([1, 2, 3, 4, 23], size=n_sybil)

    df_anom_a = pd.DataFrame({
        "login_frequency_24h": bot_login_freq,
        "ip_change_count": bot_ip_changes,
        "time_to_vote_seconds": bot_time_to_vote,
        "failed_attempts_ratio": bot_failed_ratio,
        "hour_of_day": bot_hour,
        "is_anomaly": 1
    })

    df_anom_b = pd.DataFrame({
        "login_frequency_24h": sybil_login_freq,
        "ip_change_count": sybil_ip_changes,
        "time_to_vote_seconds": sybil_time_to_vote,
        "failed_attempts_ratio": sybil_failed_ratio,
        "hour_of_day": sybil_hour,
        "is_anomaly": 1
    })

    df = pd.concat([df_normal, df_anom_a, df_anom_b], ignore_index=True)
    df = df.sample(frac=1.0, random_state=random_state).reset_index(drop=True)
    return df

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    out_csv = os.path.join(out_dir, "synthetic_voting_telemetry.csv")
    df = generate_synthetic_telemetry()
    df.to_csv(out_csv, index=False)
    print(f"[Dataset] Generated {len(df)} samples ({df['is_anomaly'].sum()} anomalies). Saved to {out_csv}")

