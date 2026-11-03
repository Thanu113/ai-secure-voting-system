# AI-Based Secure Online Voting System

[![Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20FastAPI%20%2B%20Tailwind-blue.svg)](https://github.com)
[![ML](https://img.shields.io/badge/ML-Isolation%20Forest%20%7C%20OpenCV%20Biometrics-emerald.svg)](https://scikit-learn.org)
[![Security](https://img.shields.io/badge/Security-SHA--256%20Blockchain%20Ledger%20%7C%20JWT%20%7C%20EAR%20Liveness-purple.svg)](https://owasp.org)
[![Status](https://img.shields.io/badge/Tests-12%2F12%20PASSING-brightgreen.svg)](https://jestjs.io)

A comprehensive, production-ready final-year capstone project implementing a secure, transparent, and coercion-resistant web-based electoral voting platform. The system leverages modern full-stack web technologies, computer vision facial biometrics with blink liveness anti-spoofing, behavioral anomaly detection using scikit-learn's Isolation Forest, and an immutable SHA-256 hash-chained blockchain ballot ledger.

---

## Key Features

1. **Voter Experience**:
   - Voter registration with personal details, government Voter ID, and webcam face enrollment.
   - Email multi-factor authentication (6-digit OTP verification).
   - 3-step secure ballot booth: candidate selection, live facial recognition match, and EAR blink liveness anti-spoofing.
   - Strict one-person-one-vote enforcement (database compound unique indices + transactional checks).
   - Instant anonymous digital receipt (`REC-XXXXX`) allowing citizens to verify their vote inclusion on the public ledger without disclosing their choice.
   - Certified election results with winner declaration and vote distributions upon election close.

2. **Election Administration**:
   - Role-Based Access Control (RBAC) with JWT access/refresh token rotation.
   - Comprehensive dashboard: live voter turnout, voter KYC approval/rejection queue, and security metrics.
   - Election lifecycle manager: launch upcoming elections, configure candidates with manifestos, and close active elections.
   - Real-time fraud detection alerts triggered by ML anomaly detection.
   - Tamper-evident administrative audit log recording all system events with actor ID, IP address, and timestamp.
   - Real-time cryptographic ledger auditor validating SHA-256 block hash continuity directly from the dashboard.

3. **Machine Learning Microservice**:
   - **Facial Biometrics**: Haar feature-based face extraction + 128-dimensional frequency embedding vector (DCT/Sobel gradient descriptor) with Euclidean distance verification.
   - **Liveness Anti-Spoofing**: Eye Aspect Ratio (EAR) dynamic frame analysis requiring ocular micro-movements and blinks to prevent static photo spoofing.
   - **Behavioral Fraud Detection**: Unsupervised Isolation Forest classifier trained on session telemetry (`login_frequency_24h`, `ip_change_count`, `time_to_vote_seconds`, `failed_attempts_ratio`, `hour_of_day`) achieving **97.06% Accuracy** and **0.9885 ROC-AUC**.

4. **Cryptographic Blockchain Ballot Ledger**:
   - Every cast ballot creates a SHA-256 block chained to the previous block's hash.
   - Strict decoupling: `BALLOT` contains candidate choices and receipt hashes, but **never** voter IDs; `VOTERECORD` tracks voter eligibility, but **never** candidate choices.
   - Standalone CLI ledger auditor (`scripts/verify_ledger_cli.js`) to prove mathematical integrity from genesis to tip.

---

## Architecture Overview

```
[ React 18 + Vite + Tailwind CSS ]  <--- Port 5173 (Voter & Admin Web Portal)
                 |
                 v
   [ Node.js + Express.js API ]      <--- Port 5000 (Auth, Elections, Ledger, RBAC)
        |                 |
        v                 v
[ MongoDB 8.3 ]    [ FastAPI Python 3.11 ] <--- Port 8000 (Biometrics & Isolation Forest)
(Port 27017)
```

---

## Pre-Configured Demo Accounts

Run `node scripts/seed_database.js` to automatically populate the database with the following demo credentials:

| Role | Name | Email / Identifier | Password | Status / State |
|---|---|---|---|---|
| **Administrator** | Dr. Evelyn Reed | `admin@securevote.org` | `Admin@12345` | Approved Admin (Full Access) |
| **Voter 1** | Alex Rivera | `voter1@securevote.org` | `Voter@12345` | Approved, Voted (Receipt: `REC-AA11BB22CC33DD44`) |
| **Voter 2** | Sarah Jenkins | `voter2@securevote.org` | `Voter@12345` | Approved, Voted (Receipt: `REC-EE55FF66GG77HH88`) |
| **Voter 3** | Michael Chang | `voter3@securevote.org` | `Voter@12345` | Pending KYC Approval (Test Admin approval) |

---

## Quickstart Guide

### 1. Prerequisites
- **Node.js** (v18+ or v20+)
- **Python** (3.10+ or 3.11+)
- **MongoDB** (v6.0+ or v8.0+ running on port 27017)

### 2. Service Startup

#### Start MongoDB:
```bash
mongod --dbpath "./data/db" --port 27017
```

#### Seed the Database:
```bash
node scripts/seed_database.js
```

#### Start the ML Microservice (FastAPI):
```bash
cd ml-service
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*Health check: `http://127.0.0.1:8000/health`*

#### Start the Backend API (Express.js):
```bash
cd server
npm run dev
```
*Health check: `http://127.0.0.1:5000/health`*

#### Start the Frontend Client (React + Vite):
```bash
cd client
npm run dev
```
*Web application available at: `http://localhost:5173`*

---

## Verifying Ledger Integrity via CLI

You can audit the entire cryptographic blockchain ledger independently from the terminal at any time:

```bash
node scripts/verify_ledger_cli.js
```

**Sample Output**:
```
[Ledger CLI] Connecting to MongoDB...
[Ledger CLI] Found 2 elections. Running cryptographic verification...

=======================================================
Auditing Election: "2026 University Student Union Presidential Election"
ID: 6ae81eb02f0e68330e6f95ad | Status: active
Genesis Hash: 9b021040e6ee2234eb0fa49607200aa79f3952206400309eb15ed0eabda4ce7d
Total Blocks on Ledger: 2
Recorded Votes in Election Document: 2
RESULT: [PASS] LEDGER IS 100% CRYPTOGRAPHICALLY TAMPER-FREE
All SHA-256 blocks connect backward without any corruption.
=======================================================
```

---

## Running Automated Tests

### Backend Unit & Hash Tests (Jest):
```bash
cd server
npm test
```
*Result: 6/6 tests passing (OTP hashing, receipt token generation, block hash computation, ledger chain tamper verification).*

### Machine Learning Tests (Pytest):
```bash
cd ml-service
pytest tests/test_ml.py -v
```
*Result: 6/6 tests passing (128-d embedding extraction, identity match/mismatch, EAR blink computation, Isolation Forest normal behavior, bot attack detection).*

---

## Project Structure

```
ai-secure-voting-system/
│
├── client/                     # React 18 Frontend
│   ├── src/
│   │   ├── components/         # Navbar, WebcamCapture, ReceiptModal, ProtectedRoute
│   │   ├── context/            # AuthContext (JWT management & session state)
│   │   ├── pages/
│   │   │   ├── admin/          # Dashboard, VoterApprovals, ElectionManager, FraudAlerts, AuditLogs
│   │   │   ├── auth/           # Login, Register, VerifyOtp
│   │   │   └── voter/          # VoterDashboard, BallotBooth, ElectionResults, ReceiptVerifier
│   │   ├── services/           # Axios API connectors
│   │   ├── App.jsx             # React Router routing table
│   │   └── main.jsx
│   └── package.json
│
├── server/                     # Express.js Backend API
│   ├── src/
│   │   ├── config/             # DB, Environment, Nodemailer configurations
│   │   ├── controllers/        # authController, electionController, voteController, adminController
│   │   ├── middlewares/        # authMiddleware, rateLimiter, validatorMiddleware, auditLogger
│   │   ├── models/             # User, Election, Ballot, VoteRecord, FraudAlert, AuditLog
│   │   ├── routes/             # REST routing modules
│   │   ├── services/           # ledgerService (blockchain engine), mlClientService
│   │   └── utils/              # hashUtils (SHA-256 block hashing, ledger verifier)
│   ├── tests/                  # Jest test suites
│   ├── server.js               # Express application entry
│   └── package.json
│
├── ml-service/                 # FastAPI Python 3.11 Microservice
│   ├── app/
│   │   ├── api/                # endpoints.py (FastAPI REST endpoints)
│   │   ├── models/             # schemas.py (Pydantic models)
│   │   └── services/           # face_recognizer.py, liveness_detector.py, anomaly_detector.py
│   ├── training/
│   │   ├── generate_synthetic_data.py # Synthesizes 8,400 voting session telemetry records
│   │   ├── train_isolation_forest.py  # Model trainer with StandardScaler pipeline
│   │   └── evaluate_model.py          # Metrics generator & Matplotlib/Seaborn visualizer
│   ├── tests/                  # Pytest test suites
│   ├── main.py                 # FastAPI application entry
│   └── requirements.txt
│
├── docs/                       # Project Documentation & Artifacts
│   ├── api_documentation.md    # Complete OpenAPI / REST documentation
│   ├── postman_collection.json # Exported Postman collection v2.1
│   ├── system_diagrams.md      # Mermaid Architecture, ERD, Sequence & Use Case diagrams
│   ├── ml_evaluation_report.md # ML metrics, Isolation Forest evaluation, EAR formulation
│   ├── security_analysis.md    # OWASP Top 10 analysis, threat model, tamper-proofing
│   ├── project_report_outline.md # Complete academic submission project report outline
│   ├── confusion_matrix.png    # Isolation Forest confusion matrix plot
│   └── roc_curve.png           # Receiver Operating Characteristic plot (AUC = 0.9885)
│
├── scripts/
│   ├── seed_database.js        # Bootstraps admin, voters, elections, and initial ledger blocks
│   └── verify_ledger_cli.js    # Independent CLI blockchain verification tool
│
├── package.json
└── README.md
```

---

## Deliverables & Documentation Index

- **API Documentation**: [`docs/api_documentation.md`](docs/api_documentation.md) & [`docs/postman_collection.json`](docs/postman_collection.json)
- **System Diagrams (Architecture, ERD, Data Flow, Use Case)**: [`docs/system_diagrams.md`](docs/system_diagrams.md)
- **Machine Learning Evaluation Report**: [`docs/ml_evaluation_report.md`](docs/ml_evaluation_report.md)
- **Security & Threat Model Analysis**: [`docs/security_analysis.md`](docs/security_analysis.md)
- **Academic Project Report Outline**: [`docs/project_report_outline.md`](docs/project_report_outline.md)

---

## License

This project is licensed under the MIT License — free for academic, educational, and research use.

