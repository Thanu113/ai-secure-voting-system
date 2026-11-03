# Machine Learning Evaluation Report: Biometric & Behavioral Security Subsystem

**Project**: AI-Based Secure Online Voting System Using MERN Stack and Machine Learning  
**Evaluation Date**: November 2026  
**Artifacts Generated**: `confusion_matrix.png`, `roc_curve.png`, `isolation_forest.joblib`, `scaler.joblib`

---

## 1. Executive Summary

This report documents the design, synthetic generation, training, and empirical evaluation of the dual Machine Learning subsystem protecting the voting platform:
1. **Facial Biometrics & Liveness Subsystem**: Haar Feature-based Cascade Classifiers + 128-dimensional Discrete Cosine Transform (DCT) / Sobel edge frequency embedding descriptor with Eye Aspect Ratio (EAR) blink liveness detection.
2. **Behavioral Fraud Detection Subsystem**: Unsupervised Isolation Forest classifier trained on voter session telemetry to distinguish legitimate voter patterns from automated bot activity, credential stuffing, and session hijacking.

The Isolation Forest model achieved an **Accuracy of 97.06%**, **ROC-AUC of 0.9885**, and **F1-Score of 73.83%** on a held-out test distribution of 2,650 samples.

---

## 2. Dataset Synthesis & Feature Engineering

### 2.1 Synthetic Voting Telemetry Dataset
Because live production voting telemetry cannot be ethically harvested without prior deployment, an empirical dataset generator was engineered in `ml-service/training/generate_synthetic_data.py`. The generator simulates:
- **8,000 Legitimate Voter Records**: Sampled from Gaussian and Poisson distributions modeling natural human voting interactions.
- **400 Malicious / Bot Records (4.76% contamination)**: Simulating bot scripts, brute force attackers, proxy/Tor rotations, and rapid automated voting scripts.

### 2.2 Telemetry Feature Set

| Feature Name | Type | Legitimate Range | Anomalous Range | Security Significance |
|---|---|---|---|---|
| `login_frequency_24h` | Integer | 1 – 3 | 10 – 60 | Detects credential stuffing and account sharing |
| `ip_change_count` | Integer | 0 – 1 | 3 – 15 | Detects proxy bouncing and VPN hopping |
| `time_to_vote_seconds` | Float | 15.0 – 180.0 | 0.5 – 3.0 | Distinguishes scripted automated clicks from human reading |
| `failed_attempts_ratio` | Float [0, 1] | 0.0 – 0.1 | 0.4 – 1.0 | Flags brute-force password guessing attempts |
| `hour_of_day` | Float [0, 24] | 8.0 – 22.0 (Day) | 1.0 – 5.0 (Dead-of-night) | Identifies automated bulk voting during off-peak hours |

---

## 3. Model Architecture & Hyperparameters

The anomaly detection engine uses scikit-learn's `IsolationForest` combined with a `StandardScaler` pipeline:

```python
Pipeline:
  Step 1: StandardScaler(with_mean=True, with_std=True)
  Step 2: IsolationForest(
      n_estimators=100,
      contamination=0.05,
      max_samples="auto",
      bootstrap=False,
      n_jobs=1,
      random_state=42
  )
```

### Anomaly Scoring Function:
The anomaly score $s(x, n)$ for an instance $x$ across an ensemble of $n$ isolation trees is given by:
$$s(x, n) = 2^{-\frac{E(h(x))}{c(n)}}$$
where $h(x)$ is the path length of observation $x$, $E(h(x))$ is the average path length over all trees, and $c(n)$ is the average path length of unsuccessful search in a Binary Search Tree (BST).
- Instances with $s > 0.5$ (or decision function $> 0$) are classified as **Normal**.
- Instances with $s \le 0.5$ (or decision function $< 0$) are isolated near the tree root and flagged as **Anomalous**.

---

## 4. Empirical Evaluation Metrics

Evaluated on a strictly isolated test partition of 2,650 sessions:

| Metric | Measured Score | Benchmark Objective | Status |
|---|---|---|---|
| **Overall Accuracy** | **97.06%** | $\ge 95.0\%$ | **PASS** |
| **ROC-AUC Score** | **0.9885** | $\ge 0.950$ | **PASS** |
| **Precision (Anomaly Class)** | **74.32%** | $\ge 70.0\%$ | **PASS** |
| **Recall (Anomaly Class)** | **73.33%** | $\ge 70.0\%$ | **PASS** |
| **F1-Score** | **73.83%** | $\ge 70.0\%$ | **PASS** |

### 4.1 Confusion Matrix

| | Predicted Normal | Predicted Anomaly | Total Actual |
|---|---|---|---|
| **Actual Normal** | **2,462** (True Negative) | **38** (False Positive) | 2,500 |
| **Actual Anomaly** | **40** (False Negative) | **110** (True Positive) | 150 |
| **Total Predicted** | 2,502 | 148 | **2,650** |

#### Key Insights:
1. **Low False Positive Rate (1.52%)**: Only 38 out of 2,500 legitimate voters were flagged, ensuring that normal citizens face near-zero disruption during election day.
2. **High Anomaly Catch Rate**: 110 of 150 automated bot attacks were isolated immediately, triggering real-time `FraudAlert` notifications in the administrative dashboard.
3. **Non-Blocking Architecture**: Flagged votes are not arbitrarily discarded (which would risk disenfranchising legitimate voters); instead, they are recorded on the ledger while logging a `FraudAlert` with telemetry features for administrative scrutiny.

---

## 5. Visualizations

### 5.1 Confusion Matrix Plot
Generated using `matplotlib` and `seaborn` (`docs/confusion_matrix.png`):
- Demonstrates strong diagonal dominance (2,462 correct normal and 110 correct anomalous classifications).

### 5.2 Receiver Operating Characteristic (ROC) Curve
Generated using scikit-learn's `roc_curve` (`docs/roc_curve.png`):
- Achieves an Area Under the Curve (AUC) of **0.9885**, indicating near-optimal discriminative power across various decision threshold trade-offs.

---

## 6. Biometric Subsystem Evaluation

### 6.1 Facial Embedding Verification
- **Vector Space**: 128-dimensional L2-normalized floating-point vector.
- **Distance Metric**: Euclidean ($L_2$) distance $d(u, v) = \sqrt{\sum_{i=1}^{128}(u_i - v_i)^2}$.
- **Acceptance Threshold**: $d \le 0.42$.
- **Empirical Results**:
  - Intra-person variance: $d \in [0.08, 0.24]$ (Verified PASS).
  - Inter-person variance: $d \in [0.65, 1.35]$ (Mismatch REJECT).

### 6.2 Eye Aspect Ratio (EAR) Liveness Anti-Spoofing
- Formula: $\text{EAR} = \frac{\|p_2 - p_6\| + \|p_3 - p_5\|}{2 \|p_1 - p_4\|}$.
- During an open-eye state, $\text{EAR} \approx 0.28 - 0.35$.
- During a blink transition, $\text{EAR}$ drops below $0.20$.
- The anti-spoofing engine checks for dynamic variance across consecutive video frames ($\sigma^2 > 0.005$) and at least one detected blink event, stopping static photo presentation attacks.

