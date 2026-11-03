# AI-Based Secure Online Voting System — API Specification

**Base URLs**:
- **Backend Core API (Node.js/Express)**: `http://localhost:5000/api/v1`
- **Machine Learning Microservice (FastAPI)**: `http://localhost:8000/api/ml`

---

## 1. Authentication Endpoints (`/api/v1/auth`)

### 1.1 Register Voter
* **Method**: `POST`
* **Path**: `/auth/register`
* **Access**: Public
* **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "voterId": "VTR-123456",
  "password": "SecurePassword@123",
  "faceImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Registration successful. Please verify the 6-digit OTP sent to your email.",
  "data": {
    "userId": "673f456789abcdef01234567",
    "email": "jane@example.com",
    "status": "pending",
    "devOtp": "489210"
  }
}
```

### 1.2 Verify Email OTP
* **Method**: `POST`
* **Path**: `/auth/verify-otp`
* **Access**: Public
* **Request Body**:
```json
{
  "email": "jane@example.com",
  "otp": "489210"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Email verified successfully. Awaiting administrative KYC approval.",
  "data": {
    "verified": true,
    "status": "pending"
  }
}
```

### 1.3 Login
* **Method**: `POST`
* **Path**: `/auth/login`
* **Access**: Public
* **Request Body**:
```json
{
  "identifier": "admin@securevote.org",
  "password": "Admin@12345"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Authentication successful.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "673f123456789abcdef01234",
      "name": "Dr. Evelyn Reed (Chief Electoral Officer)",
      "email": "admin@securevote.org",
      "role": "admin",
      "status": "approved"
    }
  }
}
```

### 1.4 Get Current User Profile
* **Method**: `GET`
* **Path**: `/auth/me`
* **Headers**: `Authorization: Bearer <accessToken>`
* **Success Response (200 OK)**: User profile object with role and KYC status.

### 1.5 Refresh Access Token
* **Method**: `POST`
* **Path**: `/auth/refresh-token`
* **Request Body**: `{ "refreshToken": "..." }`
* **Success Response (200 OK)**: New 15-minute access token.

---

## 2. Elections Endpoints (`/api/v1/elections`)

### 2.1 List Elections
* **Method**: `GET`
* **Path**: `/elections`
* **Query Params**: `status` (optional: `active`, `upcoming`, `closed`)
* **Success Response (200 OK)**: Array of election summaries including candidate rosters.

### 2.2 Get Election by ID
* **Method**: `GET`
* **Path**: `/elections/:id`
* **Success Response (200 OK)**: Complete election details, candidate profiles, timestamps.

### 2.3 Get Final Results
* **Method**: `GET`
* **Path**: `/elections/:id/results`
* **Access**: Public for `closed` elections.
* **Success Response (200 OK)**: Candidate vote counts, percentages, and certified winner.

---

## 3. Voting & Ledger Endpoints (`/api/v1/votes`)

### 3.1 Biometric Pre-Verification
* **Method**: `POST`
* **Path**: `/votes/verify-biometrics`
* **Headers**: `Authorization: Bearer <voterToken>`
* **Request Body**:
```json
{
  "liveImage": "data:image/jpeg;base64,...",
  "frames": ["data:image/jpeg;base64...", "data:image/jpeg;base64..."]
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Biometric identity verified successfully.",
  "data": {
    "verified": true,
    "matchScore": 0.942
  }
}
```

### 3.2 Cast Secret Ballot
* **Method**: `POST`
* **Path**: `/votes/cast`
* **Headers**: `Authorization: Bearer <voterToken>`
* **Request Body**:
```json
{
  "electionId": "6ae81eb02f0e68330e6f95ad",
  "candidateId": "cand_alice_chen",
  "liveImage": "data:image/jpeg;base64...",
  "telemetry": {
    "loginFrequency24h": 1,
    "ipChangeCount": 0,
    "timeToVoteSeconds": 24.5,
    "failedAttemptsRatio": 0.0
  }
}
```
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Ballot sealed on blockchain ledger successfully.",
  "data": {
    "receiptHash": "REC-7B8A91C3E20F45DA",
    "sequenceNumber": 3,
    "blockHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "timestamp": "2026-11-02T05:30:00.000Z"
  }
}
```

### 3.3 Public Receipt Verification
* **Method**: `GET`
* **Path**: `/votes/verify-receipt/:receiptHash`
* **Access**: Completely Public (no credentials required)
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Receipt verified on immutable ledger.",
  "data": {
    "verified": true,
    "receiptHash": "REC-AA11BB22CC33DD44",
    "electionTitle": "2026 University Student Union Presidential Election",
    "electionStatus": "active",
    "sequenceNumber": 1,
    "blockHash": "9ba3a700487d9d278bedf42ad0874eb628e9cce550391dc87eb811e657e5f05f",
    "prevHash": "9b021040e6ee2234eb0fa49607200aa79f3952206400309eb15ed0eabda4ce7d",
    "timestamp": "2026-11-01T07:25:04.359Z"
  }
}
```

---

## 4. Admin Management Endpoints (`/api/v1/admin`)

*All admin endpoints require `Authorization: Bearer <adminToken>`.*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/dashboard-stats` | Aggregated turnout, active counts, voter KYC breakdown |
| `GET` | `/admin/voters` | Paginated voter registry with query filters (`pending`, `approved`) |
| `PATCH` | `/admin/voters/:id/status` | Approve or reject a voter KYC application |
| `POST` | `/admin/elections` | Launch a new election with candidates |
| `PATCH` | `/admin/elections/:id/status` | Change election status (`active` / `closed`) |
| `GET` | `/admin/elections/:id/audit-ledger` | Cryptographically verify SHA-256 chain integrity |
| `GET` | `/admin/fraud-alerts` | Retrieve ML Isolation Forest flagged voting sessions |
| `GET` | `/admin/audit-logs` | Retrieve tamper-evident administrative action log |

---

## 5. Python FastAPI ML Microservice (`/api/ml`)

### 5.1 Extract Face Embedding
* **Endpoint**: `POST /api/ml/extract-embedding`
* **Payload**: `{ "image": "data:image/jpeg;base64,..." }`
* **Response**: `{ "success": true, "embedding": [128 floats], "dimensions": 128 }`

### 5.2 Compare Face Embeddings
* **Endpoint**: `POST /api/ml/verify-face`
* **Payload**: `{ "live_image": "...", "registered_embedding": [128 floats] }`
* **Response**: `{ "verified": true, "distance": 0.18, "threshold": 0.42 }`

### 5.3 Liveness Anti-Spoofing Challenge
* **Endpoint**: `POST /api/ml/liveness-check`
* **Payload**: `{ "frames": ["base64_frame_1", "base64_frame_2", ...] }`
* **Response**: `{ "liveness_passed": true, "blinks_detected": 1, "ear_scores": [...] }`

### 5.4 Behavioral Anomaly Detection
* **Endpoint**: `POST /api/ml/detect-fraud`
* **Payload**:
```json
{
  "login_frequency_24h": 1.0,
  "ip_change_count": 0.0,
  "time_to_vote_seconds": 30.0,
  "failed_attempts_ratio": 0.0,
  "hour_of_day": 14.0
}
```
* **Response**:
```json
{
  "is_anomaly": false,
  "anomaly_score": 0.1876,
  "decision": "NORMAL_VOTING_BEHAVIOR",
  "features_evaluated": { ... }
}
```

### 5.5 Model Performance Metrics
* **Endpoint**: `GET /api/ml/metrics`
* **Response**: Returns accuracy, precision, recall, F1-score, and confusion matrix.

