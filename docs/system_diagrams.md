# System Diagrams: AI-Based Secure Online Voting Platform

This document presents the complete architectural, structural, and behavioral modeling diagrams for the voting platform using Mermaid syntax.

---

## 1. High-Level System Architecture Diagram

```mermaid
flowchart TB
    subgraph ClientLayer ["Client Layer (React 18 + Vite + Tailwind CSS)"]
        VoterUI["Voter Portal (Dashboard, Ballot Booth, Live Webcam Biometrics, Receipt Audit)"]
        AdminUI["Admin Portal (KYC Approvals, Election Management, Fraud Alerts, Ledger Audit)"]
    end

    subgraph Gateway ["Reverse Proxy & Security Boundary"]
        CORS["CORS & Helmet Policy"]
        RateLimiter["express-rate-limit (Global & Auth Limiter)"]
        JWTAuth["JWT Verification & RBAC Middleware"]
    end

    subgraph BackendCore ["Backend Microservice (Node.js + Express.js)"]
        AuthController["Auth Controller (OTP & JWT Rotation)"]
        ElectionController["Election & Candidate Controller"]
        VoteController["Vote Controller & Ballot Cast Engine"]
        AdminController["Admin Operations & Audit Controller"]
        LedgerService["Hash-Chained Blockchain Ledger Engine"]
        MLClient["ML Microservice Client (Axios + Service Token)"]
    end

    subgraph MLService ["AI / ML Microservice (FastAPI + Python 3.11)"]
        FaceEngine["Face Biometric Engine (Haar Cascades + DCT/Sobel 128-d Embeddings)"]
        LivenessEngine["Liveness Anti-Spoofing (Eye Aspect Ratio EAR & Blink Detection)"]
        AnomalyEngine["Behavioral Fraud Engine (Isolation Forest Anomaly Classifier)"]
    end

    subgraph DatabaseLayer ["Data Persistence Layer (MongoDB 8.3)"]
        UserCol[("Users Collection (Roles, Passwords, KYC, Embeddings)")]
        ElectionCol[("Elections Collection (Genesis Hash, Candidates, Status)")]
        BallotCol[("Ballots Collection (SHA-256 Hash Chain Ledger)")]
        VoteRecordCol[("VoteRecords Collection (One-Person-One-Vote Constraint)")]
        FraudCol[("FraudAlerts Collection (Flagged Telemetry)")]
        AuditCol[("AuditLogs Collection (Immutable Action Log)")]
    end

    ClientLayer --> Gateway
    Gateway --> BackendCore
    BackendCore --> DatabaseLayer
    BackendCore -->|HTTP Internal JSON REST| MLService
```

---

## 2. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o{ VOTE_RECORD : casts
    USER ||--o{ AUDIT_LOG : triggers
    USER ||--o{ FRAUD_ALERT : associated_with
    ELECTION ||--|{ CANDIDATE : contains
    ELECTION ||--o{ BALLOT : records_in_chain
    ELECTION ||--o{ VOTE_RECORD : tracks_voter_eligibility
    ELECTION ||--o{ FRAUD_ALERT : flagged_under

    USER {
        ObjectId _id PK
        string name
        string email UK
        string voterId UK
        string password "bcrypt hash"
        string role "voter | admin"
        string status "pending | approved | rejected"
        boolean isEmailVerified
        string otpHash
        date otpExpires
        array faceEmbedding "128-dimensional float vector"
        date createdAt
    }

    ELECTION {
        ObjectId _id PK
        string title
        string description
        date startDate
        date endDate
        string status "upcoming | active | closed"
        string genesisHash "SHA-256 seed block"
        ObjectId createdBy FK
        int totalVotesCast
        date createdAt
    }

    CANDIDATE {
        string candidateId UK
        string name
        string party
        string manifesto
        string photoUrl
        int voteCount
    }

    BALLOT {
        ObjectId _id PK
        ObjectId electionId FK
        int sequenceNumber
        string candidateId
        string receiptHash UK
        string prevHash
        string hash "SHA-256(prevHash+electionId+candId+time+receipt)"
        date timestamp
    }

    VOTE_RECORD {
        ObjectId _id PK
        ObjectId voterId FK
        ObjectId electionId FK
        string receiptHash
        date votedAt
    }

    FRAUD_ALERT {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId electionId FK
        float anomalyScore
        boolean isAnomaly
        json features
        string status "pending_review | reviewed | dismissed"
        date createdAt
    }

    AUDIT_LOG {
        ObjectId _id PK
        string action
        ObjectId actorId FK
        string actorRole
        string ipAddress
        string userAgent
        string status "SUCCESS | WARNING | FAILED"
        json details
        date createdAt
    }
```

> **Security Note on Anonymity**: Notice that `BALLOT` contains `candidateId`, `prevHash`, `hash`, and `receiptHash`, but **never** stores `voterId`. `VOTE_RECORD` stores `voterId`, `electionId`, and `receiptHash`, but **never** stores `candidateId`. Thus, the ballot is strictly decoupled from voter identity, guaranteeing secret balloting while still maintaining a verifiable receipt!

---

## 3. Data Flow & Sequence Diagram: Secure Ballot Casting

```mermaid
sequenceDiagram
    autonumber
    actor Voter as Verified Voter
    participant Browser as React Frontend
    participant API as Express Backend
    participant ML as FastAPI ML Service
    participant DB as MongoDB

    Voter->>Browser: Selects candidate & clicks "Proceed to Verification"
    Browser->>Browser: Captures live webcam frame & blink frames
    Browser->>API: POST /api/v1/votes/cast (liveImage, frames, telemetry, candidateId)
    
    API->>DB: Check VoteRecord(voterId, electionId)
    alt Already Voted
        DB-->>API: Record Exists
        API-->>Browser: 403 Forbidden (VOTE_ALREADY_CAST)
    else First-Time Ballot
        DB-->>API: No Prior Record
        
        API->>ML: POST /api/ml/liveness-check (frames)
        ML-->>API: { liveness_passed: true, blinks: 1, ears: [...] }
        
        API->>ML: POST /api/ml/verify-face (liveImage, user.faceEmbedding)
        ML-->>API: { verified: true, distance: 0.18, threshold: 0.42 }
        
        API->>ML: POST /api/ml/detect-fraud (telemetry features)
        ML-->>API: { is_anomaly: false, anomaly_score: 0.187 }
        
        API->>DB: Retrieve last block on Ballot chain for election
        DB-->>API: Last block { hash: "9ba3a7..." }
        
        API->>API: Generate anonymous receipt REC-XXXX
        API->>API: Compute SHA-256 block hash linked to prevHash
        
        API->>DB: Insert new Ballot block into chain
        API->>DB: Insert VoteRecord(voterId, electionId, receiptHash)
        API->>DB: Increment Election candidate voteCount
        
        API-->>Browser: 201 Created { receiptHash, sequenceNumber, blockHash }
        Browser-->>Voter: Displays Certified Digital Receipt Modal
    end
```

---

## 4. Use Case Diagram

```mermaid
flowchart LR
    subgraph Actors
        Voter(("Voter (Citizen)"))
        Admin(("Electoral Admin"))
        MLEngine(("ML Engine Microservice"))
        PublicVerifier(("Public Auditor / Citizen"))
    end

    subgraph VoterUseCases ["Voter Use Cases"]
        UC1["Register Account & Capture Face"]
        UC2["Verify OTP via Email"]
        UC3["Login with Password / Voter ID"]
        UC4["View Active Elections & Manifestos"]
        UC5["Perform Live Face & Liveness Check"]
        UC6["Cast Secret Ballot Exactly Once"]
        UC7["Receive Anonymous Ballot Receipt"]
        UC8["View Final Election Results"]
    end

    subgraph AdminUseCases ["Administrator Use Cases"]
        UC9["Review & Approve Voter KYC"]
        UC10["Create & Launch New Elections"]
        UC11["Manage Candidate Profiles"]
        UC12["Close Election & Certify Results"]
        UC13["Monitor Real-time Turnout Metrics"]
        UC14["Audit Ledger Cryptographic Integrity"]
        UC15["Review ML Fraud Alerts"]
        UC16["Inspect System Audit Logs"]
    end

    subgraph MLUseCases ["ML Subsystem Use Cases"]
        UC17["Compute 128-d DCT/Sobel Embeddings"]
        UC18["Compute EAR Blink Liveness Score"]
        UC19["Evaluate Isolation Forest Anomaly Score"]
        UC20["Train & Evaluate Anomaly Classifier"]
    end

    subgraph AuditorUseCases ["Audit Use Cases"]
        UC21["Verify Anonymous Receipt on Hash Chain"]
        UC22["Validate Whole Chain Continuity via CLI"]
    end

    Voter --> UC1
    Voter --> UC2
    Voter --> UC3
    Voter --> UC4
    Voter --> UC5
    Voter --> UC6
    Voter --> UC7
    Voter --> UC8

    Admin --> UC9
    Admin --> UC10
    Admin --> UC11
    Admin --> UC12
    Admin --> UC13
    Admin --> UC14
    Admin --> UC15
    Admin --> UC16

    MLEngine --> UC17
    MLEngine --> UC18
    MLEngine --> UC19
    MLEngine --> UC20

    PublicVerifier --> UC21
    PublicVerifier --> UC22
```

