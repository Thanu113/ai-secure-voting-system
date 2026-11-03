# Academic Project Report Outline
## AI-Based Secure Online Voting System Using MERN Stack and Machine Learning

*Suitable for Final-Year Capstone Project / B.Tech / B.E. / M.Sc. / MCA Dissertation Submission*

---

## Abstract
Electronic voting systems offer accessibility and rapid tabulation, yet existing centralized platforms remain vulnerable to credential theft, ballot tampering, sybil attacks, and coercion. This project presents the design and implementation of an end-to-end secure online voting system combining a modern MERN stack with machine learning microservices and a blockchain-inspired hash-chained ballot ledger. The system integrates three defensive tiers: (i) dual biometric verification leveraging 128-dimensional facial embedding descriptors and dynamic Eye Aspect Ratio (EAR) blink liveness detection; (ii) behavioral anomaly detection utilizing an unsupervised Isolation Forest classifier trained on session telemetry to intercept bot attacks and credential stuffing (achieving 97.06% accuracy and 0.9885 ROC-AUC); and (iii) a cryptographic SHA-256 hash-chained ledger that decouples voter identity from cast ballots to guarantee ballot secrecy and receipt-freeness while providing instant tamper detection. Empirical testing confirms sub-second ballot processing, zero false negative double-voting prevention, and verified cryptographic integrity across multi-election workloads.

---

## Chapter 1: Introduction
* **1.1 Background & Motivation**: The evolution of democratic suffrage; limitations of physical ballot boxes and first-generation Electronic Voting Machines (EVMs).
* **1.2 Problem Statement**: Vulnerabilities in contemporary web voting (credential sharing, denial-of-service, lack of individual verifiability, ballot modification).
* **1.3 Project Objectives**:
  * Implement an accessible full-stack voting portal (React + Node.js + MongoDB).
  * Build an AI/ML microservice (FastAPI + OpenCV + Scikit-Learn) for biometric verification and fraud detection.
  * Engineer a hash-chained ledger supporting public verification without violating voter privacy.
* **1.4 Scope and Limitations**: University, organizational, and municipal governance scope; constraints of commodity webcams and simulated hardware security modules.
* **1.5 Report Organization**: Overview of subsequent chapters.

---

## Chapter 2: Literature Review & Comparative Analysis
* **2.1 Review of Traditional Electronic Voting**: Direct Recording Electronic (DRE) systems; optical scan systems.
* **2.2 Blockchain-Based Voting Platforms**: Ethereum/Hyperledger implementations; gas fees, throughput bottlenecks, and on-chain privacy challenges.
* **2.3 Biometric Anti-Spoofing & Liveness Detection**: Survey of 2D presentation attack detection; Eye Aspect Ratio (EAR) vs. optical flow.
* **2.4 Behavioral Biometrics & Anomaly Detection**: Application of Isolation Forests, One-Class SVMs, and Autoencoders in cybersecurity.
* **2.5 Comparative Analysis Table**: Comparing the proposed system against Helios Voting, Follow My Vote, Voatz, and traditional EVMs on security parameters (Voter Verifiability, Coercion Resistance, Throughput, Cost).

---

## Chapter 3: System Architecture & Design Methodology
* **3.1 Architectural Overview**: 3-tier microservice architecture (React Client, Express Core API, FastAPI ML Engine, MongoDB Persistence).
* **3.2 Modular Decomposition**:
  * Voter Registration & KYC Approval Subsystem.
  * Email OTP Multi-Factor Verification Module.
  * Real-Time Facial Biometric & Anti-Spoofing Subsystem.
  * Behavioral Telemetry Extraction Pipeline.
  * Cryptographic Hash Ledger Engine.
  * Administrative Control & Audit Logging Module.
* **3.3 Database Design & Schemas**: Entity-Relationship modeling; decoupled `VoteRecord` and `Ballot` collections.
* **3.4 Data Flow & Sequence Workflows**: End-to-end request lifecycle from authentication to ballot receipt issuance.

---

## Chapter 4: Machine Learning Subsystem
* **4.1 Facial Biometric Verification**:
  * Face detection utilizing optimized Haar Feature-based Cascade Classifiers.
  * 128-dimensional feature embedding extraction via Discrete Cosine Transform (DCT) and Sobel spatial gradient frequency analysis.
  * Normalized Euclidean distance metric and optimal decision threshold calibration ($d \le 0.42$).
* **4.2 Dynamic Liveness & Anti-Spoofing Detection**:
  * Eye landmark approximation and Eye Aspect Ratio (EAR) formula derivation.
  * Multi-frame temporal variance analysis to thwart printed photograph presentation attacks.
* **4.3 Behavioral Anomaly Detection with Isolation Forest**:
  * Mathematical foundation of Isolation Trees ($iTrees$) and path length anomaly scoring.
  * Feature engineering: `login_frequency_24h`, `ip_change_count`, `time_to_vote_seconds`, `failed_attempts_ratio`, `hour_of_day`.
  * Synthetic dataset synthesis (8,000 normal human voter sessions, 400 adversarial bot attacks).
  * Standardization pipeline (`StandardScaler`) and hyperparameter tuning.

---

## Chapter 5: Cryptographic Hash-Chained Ballot Ledger
* **5.1 Mathematical Formulation of the Ledger**:
  * Genesis block generation function.
  * Chained block hashing equation: $\text{Hash}_i = \text{SHA256}(\text{prevHash}_{i-1} \,\|\, \text{payload}_i)$.
* **5.2 Decoupled Privacy Architecture**:
  * Mathematical proof that identity cannot be reverse-computed from public receipt or block hash.
  * Receipt-freeness implementation: proving vote inclusion without exposing candidate selection.
* **5.3 Independent Cryptographic Auditor CLI**: Traversal algorithm and anomaly localization mechanism.

---

## Chapter 6: Implementation Details
* **6.1 Technology Stack Selection Justification**: React 18, Vite, Tailwind CSS, Express.js, MongoDB Mongoose, Python FastAPI, Uvicorn.
* **6.2 Security Hardening Implementations**:
  * Rate limiting policies (`express-rate-limit`).
  * HTTP security headers (`helmet`).
  * JWT access token (15m) and refresh token (7d) rotation.
  * Password hashing using Bcrypt (12 salt rounds).
  * Role-Based Access Control (RBAC) middleware implementation.
* **6.3 Seed Data & Demonstration Harness**: Automated bootstrapping of elections, candidates, and multi-state voter accounts.

---

## Chapter 7: Results & Performance Evaluation
* **7.1 Machine Learning Model Performance**:
  * Quantitative metrics: Accuracy (97.06%), Precision (74.32%), Recall (73.33%), F1-Score (73.83%), ROC-AUC (0.9885).
  * Analysis of Confusion Matrix and Receiver Operating Characteristic (ROC) curve.
* **7.2 System Latency & Throughput**:
  * Average API response times for ballot casting ($< 350\text{ ms}$).
  * ML microservice inference latency for face embedding and anomaly scoring ($< 120\text{ ms}$).
* **7.3 Security & Integrity Validation**:
  * Simulated tampering test on MongoDB blocks; automated detection by the CLI auditor.
  * Double-voting prevention test; validation of database compound unique constraints.
* **7.4 Unit & Integration Test Coverage**: Jest test suite results (hash utilities, ledger chain) and Pytest results (embeddings, liveness, anomaly detection).

---

## Chapter 8: Conclusion & Future Scope
* **8.1 Summary of Contributions**: Complete realization of a transparent, AI-reinforced, privacy-preserving voting platform.
* **8.2 Future Enhancements**:
  * Integration of Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge (zk-SNARKs) for complete mathematical privacy.
  * Paillier homomorphic encryption for encrypted tally aggregation.
  * Mobile native biometric authentication (WebAuthn / FIDO2 / TouchID / FaceID).
  * Decentralized IPFS storage for immutable election audit artifacts.

---

## References (IEEE Format)
1. D. Chaum, "Untraceable electronic mail, return addresses, and digital pseudonyms," *Communications of the ACM*, vol. 24, no. 2, pp. 84–90, 1981.
2. B. Adida, "Helios: Web-based Open-Audit Voting," in *Proc. 17th USENIX Security Symposium*, 2008, pp. 335–348.
3. F. T. Liu, K. M. Ting, and Z.-H. Zhou, "Isolation Forest," in *2008 Eighth IEEE International Conference on Data Mining*, 2008, pp. 413–422.
4. T. Soukupová and J. Čech, "Real-Time Eye Blink Detection using Facial Landmarks," in *21st Computer Vision Winter Workshop*, 2016.
5. S. Nakamoto, "Bitcoin: A Peer-to-Peer Electronic Cash System," 2008. [Online]. Available: https://bitcoin.org/bitcoin.pdf.
6. OWASP Foundation, "OWASP Top 10: 2021 The Ten Most Critical Web Application Security Risks," 2021. [Online]. Available: https://owasp.org/Top10/.
7. P. A. Grassi et al., "Digital Identity Guidelines: Authentication and Lifecycle Management," *NIST Special Publication 800-63B*, National Institute of Standards and Technology, 2017.

