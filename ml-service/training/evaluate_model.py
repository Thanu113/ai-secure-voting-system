import os
import sys

# Ensure training directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    roc_curve,
    auc,
    classification_report
)
from generate_synthetic_data import generate_synthetic_telemetry

def evaluate():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(base_dir, "models")
    docs_dir = os.path.join(os.path.dirname(os.path.dirname(base_dir)), "docs")
    os.makedirs(docs_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)

    model_file = os.path.join(models_dir, "isolation_forest.joblib")
    scaler_file = os.path.join(models_dir, "scaler.joblib")

    if not os.path.exists(model_file) or not os.path.exists(scaler_file):
        print("[Evaluate] Model not found. Running training first...")
        from train_isolation_forest import train_and_save_model
        train_and_save_model()

    model = joblib.load(model_file)
    scaler = joblib.load(scaler_file)

    # Generate fresh unseen evaluation test set
    test_df = generate_synthetic_telemetry(n_normal=2500, n_anomaly=150, random_state=123)

    feature_cols = [
        "login_frequency_24h",
        "ip_change_count",
        "time_to_vote_seconds",
        "failed_attempts_ratio",
        "hour_of_day"
    ]

    X_test = test_df[feature_cols].values
    y_true = test_df["is_anomaly"].values # 0 for normal, 1 for anomaly

    X_test_scaled = scaler.transform(X_test)
    preds = model.predict(X_test_scaled)
    # IsolationForest outputs 1 for inlier (normal), -1 for outlier (anomaly)
    y_pred = np.where(preds == -1, 1, 0)

    # Invert decision score so higher = higher probability of anomaly
    decision_scores = -model.decision_function(X_test_scaled)

    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    cm = confusion_matrix(y_true, y_pred).tolist()

    fpr, tpr, _ = roc_curve(y_true, decision_scores)
    roc_auc = float(auc(fpr, tpr))

    report = {
        "model_name": "Isolation Forest Anomaly Classifier",
        "is_trained": True,
        "test_samples": len(test_df),
        "actual_anomalies": int(np.sum(y_true)),
        "detected_anomalies": int(np.sum(y_pred)),
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "confusion_matrix": cm,
    }

    report_path = os.path.join(models_dir, "evaluation_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    print("\n================ MODEL EVALUATION REPORT ================")
    print(f"Accuracy:  {acc * 100:.2f}%")
    print(f"Precision: {prec * 100:.2f}%")
    print(f"Recall:    {rec * 100:.2f}%")
    print(f"F1-Score:  {f1 * 100:.2f}%")
    print(f"ROC-AUC:   {roc_auc:.4f}")
    print(f"Confusion Matrix: \n{np.array(cm)}")
    print("=========================================================\n")

    # Plot Confusion Matrix
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=["Normal", "Anomaly"],
                yticklabels=["Normal", "Anomaly"])
    plt.title("Isolation Forest Confusion Matrix")
    plt.ylabel("True Class")
    plt.xlabel("Predicted Class")
    plt.tight_layout()
    cm_path = os.path.join(docs_dir, "confusion_matrix.png")
    plt.savefig(cm_path, dpi=300)
    plt.close()

    # Plot ROC Curve
    plt.figure(figsize=(6, 5))
    plt.plot(fpr, tpr, color="darkorange", lw=2, label=f"ROC curve (AUC = {roc_auc:.3f})")
    plt.plot([0, 1], [0, 1], color="navy", lw=2, linestyle="--")
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title("Receiver Operating Characteristic (ROC)")
    plt.legend(loc="lower right")
    plt.tight_layout()
    roc_path = os.path.join(docs_dir, "roc_curve.png")
    plt.savefig(roc_path, dpi=300)
    plt.close()

    print(f"[Plots] Saved confusion matrix to {cm_path} and ROC curve to {roc_path}")
    return report

if __name__ == "__main__":
    evaluate()
