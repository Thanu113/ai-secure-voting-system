# AI-Based Secure Online Voting System Using MERN Stack and Machine Learning

**Authors:**  
**K. Durga Charan, Pagadala Thanuja, Dhandu Shivani, Pandrati Umesh, and Paturu Vardhan Reddy**  
*Department of Computer Science and Technology (CSD)*  
*Madanapalle Institute of Technology and Science, Madanapalle, Andhra Pradesh, India*  
Emails: `durgacharankondabathula@gmail.com`, `pagadalathanujaa@gmail.com`, `shivanidhandu999@gmail.com`, `umesh63055@gmail.com`, `vardhan4036@gmail.com`  

---

### Abstract
Remote electronic voting systems face a critical trilemma: ensuring voter privacy (the secret ballot), enforcing strict eligibility without voter impersonation, and providing end-to-end auditability without introducing centralized points of compromise. In this paper, we design, implement, and evaluate an AI-augmented secure online voting architecture combining the MERN (MongoDB, Express.js, React, Node.js) web framework with a dedicated Python FastAPI machine learning microservice. 

Our system introduces a dual-tier security mechanism: 
1. A multi-frame facial biometric authentication engine utilizing 128-dimensional illumination-invariant Discrete Cosine Transform (DCT) and spatial Sobel gradient descriptors paired with an eyeglass-resilient upper-face and Eye Aspect Ratio (EAR) liveness detector to prevent static spoofing; and 
2. An unsupervised Isolation Forest classifier analyzing five-dimensional session telemetry features to flag automated bot attacks, credential stuffing, and proxy anomalies in real time without disenfranchising voters. 

Cast ballots are recorded onto a linked SHA-256 cryptographic hash-chain ledger that guarantees append-only immutability and instant detection of database-level tampering, while identity-to-ballot decoupling preserves voter anonymity. Empirical evaluation on a held-out test distribution of 2,650 sessions demonstrates that the Isolation Forest achieves an overall accuracy of **97.06%**, an **ROC-AUC of 0.9885**, and an anomaly recall of **73.33%** with a low false positive rate of **1.52%**.

**Keywords:** Electronic Voting, Biometric Authentication, Isolation Forest, Anomaly Detection, Cryptographic Hash-Chain Ledger, Anti-Spoofing, Liveness Detection, MERN Stack.

---

## 1. Introduction

Remote electronic voting (e-voting) has long been proposed to increase democratic participation, reduce administrative overhead, and deliver rapid election certification [1]. However, transitioning from physical polling stations to distributed web environments exposes the electoral process to severe attack vectors, including credential theft, automated ballot stuffing, session hijacking, presentation attacks using synthetic or printed media, and insider database manipulation [2].

Conventional web-based voting portals traditionally rely on single-factor or two-factor authentication (e.g., username/password paired with SMS or email One-Time Passwords). While One-Time Passwords (OTPs) mitigate basic credential reuse, they fail to defend against identity lending, credential selling, or coercion, as the physical identity of the individual operating the voting terminal remains unverified at the exact moment of ballot submission [3]. Conversely, while biometric systems provide physical identity binding, naive implementations introduce significant usability hurdles (e.g., sensitivity to ambient lighting and failure on voters wearing spectacles) and vulnerability to presentation attacks (e.g., holding high-resolution photographs or digital displays to the camera) [4]. Furthermore, modern electoral threats increasingly employ automated bot scripts and proxy-hopping networks that mimic legitimate interactions at superhuman speeds, bypassing static access rules [5].

To address these vulnerabilities simultaneously without sacrificing voter privacy or usability, we propose an integrated end-to-end architecture that combines web engineering with applied machine learning and cryptographic ledger verification. The core thesis of this work is that physical biometric verification and behavioral telemetry analysis must operate symbiotically: biometrics bind the voter’s physical presence, while behavioral anomaly detection identifies automated orchestrations and illicit session anomalies.

### Key Contributions
* **Dual-Tier AI Security Architecture:** We design and deploy a microservice-based architecture that decouples frontend user interactions (React 18) from core business logic (Express.js) and machine learning inference (FastAPI, scikit-learn, OpenCV), ensuring that resource-heavy biometric and telemetry calculations do not degrade portal availability.
* **Lighting-Invariant Biometrics with Eyeglass-Resilient Liveness:** We implement a 128-dimensional facial embedding engine combining 2D Discrete Cosine Transform (DCT) frequency coefficients and spatial Sobel gradient pooling. By zeroing the DC frequency component, the descriptor eliminates ambient lighting bias. We complement this with an anatomical upper-face band variance analysis that ensures robust liveness verification for voters wearing eyeglasses.
* **Unsupervised Behavioral Anomaly Detection:** We develop an Isolation Forest classifier trained on voter session telemetry (login frequency, IP volatility, voting duration, authentication failure ratios, and submission hour). Operating under a non-blocking administrative triage model, the classifier flags malicious bots (achieving an ROC-AUC of 0.9885) while ensuring that legitimate voters are not disenfranchised by false positives.
* **Cryptographic Hash-Chained Ledger with Identity Decoupling:** We enforce the secret ballot principle through a mathematical decoupling of voter eligibility records (`VoteRecord`) from anonymized ballots (`Ballot`). Every ballot is sealed onto a sequence-linked SHA-256 hash-chain ledger that allows independent Command Line Interface (CLI) verification of ledger continuity and immediate detection of database tampering.
* **Empirical Validation:** We report comprehensive experimental benchmarks on biometric inter/intra-class distance distributions, anti-spoofing performance, and session anomaly detection using reproducible metrics and confusion matrices.

---

## 2. Related Work

### 2.1 Remote E-Voting Protocols and Security Properties
Academic literature identifies several fundamental security properties required for any legally binding electoral system: *eligibility* (only authorized voters can cast a vote), *unreusability* (one-person-one-vote), *ballot secrecy* (no entity can link a voter to their candidate choice), *receipt-freeness* (voters cannot prove their choice to a third party for vote-buying or coercion), and *individual and universal verifiability* (voters can verify their ballot was counted, and observers can verify the total tally) [6, 7]. 

Early systems like Helios [8] pioneered verifiable internet voting using homomorphic encryption and mix-nets. However, homomorphic schemes incur heavy computational overhead in distributed web clients and rely entirely on voter-side cryptographic key stewardship. When keys or credentials are compromised, homomorphic systems cannot determine whether the legitimate citizen or an unauthorized adversary cast the encrypted ballot.

### 2.2 Biometric Authentication and Anti-Spoofing
Facial recognition provides a non-invasive biometric modality for remote identity verification [9]. Traditional deep convolutional neural networks (e.g., FaceNet [10]) achieve high verification rates under controlled lighting but require significant server-side GPU resources and often overfit to specific demographics and illumination angles. To maintain low-latency inference on commodity hardware, spatial-frequency descriptors utilizing Discrete Cosine Transform (DCT) and gradient histograms have emerged as computationally efficient alternatives [11].

To prevent presentation attacks (holding photographs or recorded videos to the webcam), Presentation Attack Detection (PAD) methods analyze micro-textures, temporal motion, or physiological signals such as eye blinks [12]. Soukupová and Čech [13] formalized the Eye Aspect Ratio (EAR) metric based on facial landmarks to monitor blink patterns. However, standard facial landmark and Haar cascade detectors suffer high failure rates when users wear spectacles due to glare and lens rim occlusion [14]. Our work addresses this limitation by supplementing EAR with an anatomical upper-face band variance metric.

### 2.3 Behavioral Anomaly Detection for Fraud Prevention
Electoral platforms face automated botnets, credential stuffing, and coordinated Sybil attacks [15]. Traditional intrusion detection systems (IDS) rely on signature-based matching, which fails against novel attack patterns or slow-rate distributed botnets [16]. Machine learning approaches model normal user behavior and detect deviations. 

Liu et al. [17, 18] introduced the Isolation Forest algorithm, demonstrating that anomalies can be isolated using fewer random recursive axis-aligned splits than nominal data points. Unlike distance-based or density-based clustering algorithms that scale quadratically with dataset size, Isolation Forest exhibits linear time complexity and low memory requirements, making it ideal for real-time web telemetry inspection.

### 2.4 Blockchain and Hash-Chained Ledgers in E-Voting
Distributed Ledger Technology (DLT) and blockchain architectures have been widely investigated for auditable voting [19, 20]. While public proof-of-work (PoW) or proof-of-stake (PoS) blockchains guarantee decentralization, they introduce scalability bottlenecks, transaction fees, high latency, and the risk that public transaction ledgers leak voter participation timestamps [21]. 

Consequently, several researchers propose permissioned, lightweight append-only cryptographic ledgers using backward hash chaining (similar to certificate transparency logs) [22]. Each ballot block references the cryptographic hash of its predecessor, creating a tamper-evident sequence that detects retroactive record insertion, modification, or deletion while avoiding the computational overhead of decentralized consensus networks.

---

## 3. System Architecture

The proposed platform adopts a decoupled multi-tier microservice architecture designed to isolate heavy computational workloads (computer vision and machine learning inference) from transaction processing and user interface rendering.

### 3.1 Microservice Separation & Inter-Service Security
The system is partitioned into two distinct backend services:
1. **Core Application Server (Node.js/Express.js):** Manages user registration, session management, relational integrity between voter eligibility and cryptographic ledgers, and electoral governance rules.
2. **Machine Learning Microservice (Python 3.11/FastAPI):** Exposes stateless endpoints for biometric feature extraction (`/api/ml/extract-embedding`), face verification (`/api/ml/verify-face`), liveness verification (`/api/ml/liveness-check`), and session fraud detection (`/api/ml/detect-fraud`).

To secure service-to-service communication across the internal network, all calls from the Node.js core to the FastAPI service require a shared internal service secret (`INTERNAL_SERVICE_KEY`) passed in the HTTP request header. Direct public requests to the ML microservice are dropped by firewall rules, mitigating external denial-of-service and model manipulation attacks.

### 3.2 Operational Lifecycle Pipeline
The operational lifecycle encompasses four sequential stages:
1. **Voter Registration and KYC:** The user submits legal identity attributes, establishes a password, and captures an enrollment facial photograph via the live webcam. The backend delegates the image to the ML service, which extracts a canonical 128-dimensional biometric embedding. An email OTP is dispatched via SMTP. Upon OTP verification, the voter account enters a `pending` state awaiting administrative KYC authorization.
2. **Administrative Identity Verification:** An election official reviews the citizen’s government voter ID and webcam photograph in the administrative dashboard, updating the voter’s status to `approved` or `rejected`.
3. **Ballot Access and Biometric Challenge:** When an approved voter initiates ballot submission, the client interface activates a multi-frame burst capture (4 frames over 1.2 seconds). The ML service verifies both physical liveness (anti-spoofing) and biometric matching against the registered embedding ($d \le 0.76$). Concurrently, client-side session telemetry is harvested.
4. **Cryptographic Ledger Sealing:** If biometric verification succeeds, the core server executes an atomic database operation: (i) it verifies and writes a `VoteRecord` enforcing the one-person-one-vote constraint; (ii) it queries the latest block of the election’s ledger; (iii) it computes the SHA-256 hash chaining to the previous block; (iv) it persists the anonymized `Ballot`; and (v) it runs the telemetry vector through the Isolation Forest, logging a `FraudAlert` if anomalous behavior is identified.

---

## 4. Methodology & Technical Formulation

### 4.1 Tier-1 Access Control: Multi-Factor Authentication
Authentication relies on a defense-in-depth scheme:
* **Password Hashing:** Passwords are salted and hashed using bcrypt with an adaptive work factor of 12 iterations:
  $$\text{Hash} = \text{bcrypt}(\text{Password}, \text{Salt}_{12})$$
* **Email Verification via Salted OTP:** Registration triggers the generation of a cryptographically secure 6-digit pseudo-random integer $R \in [100000, 999999]$. Rather than persisting the plaintext OTP, the database stores an expiration timestamp $T_{\text{exp}} = T_{\text{current}} + 10\text{ min}$ and an HMAC-SHA-256 hash digest:
  $$H_{\text{OTP}} = \text{HMAC-SHA256}(R, K_{\text{jwt\_secret}})$$
* **Dual-Token Session Architecture:** Upon authentication, the client receives a short-lived Access Token (15 minutes) and a long-lived Refresh Token (7 days) submitted to obtain new session tokens without re-entering credentials.

### 4.2 Biometric Feature Representation: 128-d DCT/Sobel Spatial-Frequency Descriptors
To extract a facial biometric representation that is invariant to illumination while maintaining fast CPU-only inference, we formulate a 128-dimensional hybrid frequency-spatial descriptor:
1. **Face Normalization:** The input frame is converted to grayscale, equalized via Contrast Limited Adaptive Histogram Equalization (CLAHE, clip limit = 2.0, grid = $8 \times 8$), and processed by a Haar cascade detector to isolate the primary face bounding box. The cropped face region is normalized to a fixed resolution of $128 \times 128$ pixels.
2. **Frequency Domain Transformation (DCT):** A 2D Discrete Cosine Transform (DCT-II) is applied to the normalized floating-point grayscale image $I(x, y)$:
   $$D(u, v) = \alpha(u)\alpha(v) \sum_{x=0}^{N-1}\sum_{y=0}^{N-1} I(x, y) \cos\left[\frac{\pi(2x+1)u}{2N}\right] \cos\left[\frac{\pi(2y+1)v}{2N}\right]$$
   where $N=128$, and the orthonormal scaling factor $\alpha(u)$ is defined as:
   $$\alpha(u) = \begin{cases} \sqrt{\frac{1}{N}}, & u = 0 \\ \sqrt{\frac{2}{N}}, & u \ge 1 \end{cases}$$
3. **Lighting Invariance via DC Zeroing:** The top-left $8 \times 8$ low-to-mid frequency coefficients capturing fundamental structural facial topology are extracted. Crucially, the direct current coefficient $D(0, 0)$—which represents average global surface luminance—is set to zero:
   $$\mathbf{f}_{\text{DCT}} = [0.0, D(0, 1), D(0, 2), \dots, D(7, 7)]^T \in \mathbb{R}^{64}$$
   The vector is unit-normalized: $\hat{\mathbf{f}}_{\text{DCT}} = \mathbf{f}_{\text{DCT}} / \|\mathbf{f}_{\text{DCT}}\|_2$.
4. **Spatial Gradient Pooling:** In parallel, horizontal ($G_x$) and vertical ($G_y$) Sobel gradient operators are convolved with the equalized image to compute the edge magnitude map:
   $$M(x, y) = \sqrt{G_x(x, y)^2 + G_y(x, y)^2}$$
   The magnitude map is partitioned into an $8 \times 8$ regular grid (cell size $16 \times 16$ pixels). The mean gradient intensity of each cell is computed and normalized:
   $$\hat{\mathbf{f}}_{\text{Sobel}} = \frac{\mathbf{f}_{\text{Sobel}}}{\|\mathbf{f}_{\text{Sobel}}\|_2} \in \mathbb{R}^{64}$$
5. **Canonical 128-d Vector Concatenation:** The composite embedding $\mathbf{v} \in \mathbb{R}^{128}$ is formed by concatenating both 64-dimensional feature representations and applying global $L_2$-normalization:
   $$\mathbf{v} = \frac{[\hat{\mathbf{f}}_{\text{DCT}}^T, \; \hat{\mathbf{f}}_{\text{Sobel}}^T]^T}{\|[\hat{\mathbf{f}}_{\text{DCT}}^T, \; \hat{\mathbf{f}}_{\text{Sobel}}^T]^T\|_2} \in \mathbb{R}^{128}$$
6. **Biometric Distance Formulation:** Verification compares a live query embedding $\mathbf{u}$ against the registered KYC template $\mathbf{v}$ using Euclidean distance:
   $$d(\mathbf{u}, \mathbf{v}) = \|\mathbf{u} - \mathbf{v}\|_2 = \sqrt{\sum_{i=1}^{128}(u_i - v_i)^2}$$
   A candidate identity is verified if and only if $d(\mathbf{u}, \mathbf{v}) \le \tau_{\text{match}}$, where $\tau_{\text{match}} = 0.76$.

### 4.3 Presentation Attack Detection (Liveness Analysis)
To defeat presentation attacks using static physical paper cutouts, smartphone displays, or photographs, the system captures a temporal burst of $K=4$ frames at 300 ms intervals ($t \in [0.0, 1.2\text{ s}]$). The verification pipeline evaluates two physiological properties:
1. **Temporal Optical Micro-Motion:** For consecutive normalized face crops $C_0$ and $C_{K-1}$, the mean absolute pixel difference across all color channels is evaluated:
   $$\Delta_{\text{motion}} = \frac{1}{W \cdot H \cdot C} \sum_{x=1}^{W}\sum_{y=1}^{H}\sum_{c=1}^{C} |C_0(x, y, c) - C_{K-1}(x, y, c)|$$
   While static photographs yield $\Delta_{\text{motion}} < 0.35$ due to absence of biological motion, genuine human presence generates micro-movements, breathing variance, and optical sensor fluctuations ($\Delta_{\text{motion}} \ge 0.60$).
2. **Anatomical Upper-Face Band Variance (Eyeglass-Resilient Liveness):** Standard Eye Aspect Ratio (EAR) algorithms fail when voters wear spectacles due to reflections and frame occlusion. Our system defines an anatomical upper-face sub-region spanning vertical interval $y \in [0.20 H_f, 0.52 H_f]$ and horizontal interval $x \in [0.15 W_f, 0.85 W_f]$ of the detected face bounding box. When cascade eye detection succeeds, the Eye Aspect Ratio (EAR) is computed from the vertical-to-horizontal gradient ratio:
   $$\text{EAR} \approx 0.25 \times \frac{\mu(|G_y|)}{\mu(|G_x|) + \epsilon}$$
   When cascade eye detection fails due to spectacles, the system evaluates the temporal texture difference across the anatomical eye band: $\Delta_{\text{band}} = \mu(|B_0 - B_{K-1}|)$. Liveness is confirmed if any of the following conditions hold: (i) at least one distinct blink event is observed; (ii) $\Delta_{\text{band}} \ge 0.55$; (iii) $\Delta_{\text{motion}} \ge 0.60$; or (iv) EAR temporal variance $\sigma^2_{\text{EAR}} \ge 0.00003$.

### 4.4 Behavioral Anomaly Detection: Unsupervised Isolation Forest
Automated voting scripts, credential-stuffing tools, and coordinated botnets exhibit distinct statistical signatures in their session interaction telemetry. We model this behavior using an unsupervised Isolation Forest ensemble [17].

Each voting transaction collects a 5-dimensional telemetry vector $\mathbf{x} = [x_1, x_2, x_3, x_4, x_5]^T$:
* $x_1$: `login_frequency_24h` (Integer) — Total logins recorded in past 24 hours.
* $x_2$: `ip_change_count` (Integer) — Number of unique IP addresses associated with session token.
* $x_3$: `time_to_vote_seconds` (Float) — Time elapsed between ballot booth rendering and final submission.
* $x_4$: `failed_attempts_ratio` (Float $\in [0, 1]$) — Ratio of prior invalid authentication attempts to total attempts.
* $x_5$: `hour_of_day` (Float $\in [0, 24]$) — Local diurnal time of ballot casting.

The feature vector is normalized using standard score scaling: $z_j = (x_j - \mu_j) / \sigma_j$. The anomaly score $s(\mathbf{z}, \psi)$ across an ensemble of $n_{\text{tree}} = 100$ isolation trees is formulated as:
$$s(\mathbf{z}, \psi) = 2^{-\frac{\mathbb{E}(h(\mathbf{z}))}{c(\psi)}}$$
where $h(\mathbf{z})$ denotes the path length (number of edges traversed from root to terminating leaf node in a given tree), $\mathbb{E}(h(\mathbf{z}))$ is the expectation of $h(\mathbf{z})$ across all 100 trees, and $c(\psi)$ is the average path length of unsuccessful searches in a Binary Search Tree (BST) given subsample size $\psi = 256$:
$$c(\psi) = 2\left(\ln(\psi - 1) + \gamma\right) - \frac{2(\psi - 1)}{\psi}$$
where $\gamma \approx 0.5772156649$ is the Euler-Mascheroni constant. Anomalies are flagged whenever the decision function evaluates to negative: $f(\mathbf{z}) = -s(\mathbf{z}, \psi) - \text{offset} < 0$.

### 4.5 Cryptographic Hash-Chained Ledger & Strict Decoupling

#### Identity-to-Ballot Decoupling (Secret Ballot Principle)
To guarantee ballot privacy, the system strictly separates voter identity tracking from the recorded ballot across two collections:
* `VoteRecord`: Contains `{voterId, electionId, receiptHash, timestamp}`. A compound unique index on `{voterId: 1, electionId: 1}` guarantees that any attempt by a voter to cast more than one ballot in the same election triggers a database-level duplicate key exception (HTTP 409), enforcing the one-person-one-vote rule.
* `Ballot`: Contains `{electionId, candidateId, receiptHash, sequenceNumber, previousHash, blockHash, timestamp}`. No user identifier, IP address, or session identifier is stored. The only shared attribute is `receiptHash`:
  $$\text{Receipt} = \text{"REC-"} \,\|\, \text{SHA256}(\text{voterId} \,\|\, \text{electionId} \,\|\, \text{salt})[:12]$$
  The receipt confirms ballot inclusion on the public ledger without disclosing the candidate selected, fulfilling receipt-freeness.

#### Linked SHA-256 Ledger Chaining
Each election maintains an independent append-only cryptographic ledger initialized with a Genesis block:
$$\text{Hash}_0 = \text{SHA256}(\text{"GENESIS\_BLOCK\_"} \,\|\, \text{electionId} \,\|\, t_0)$$
For every subsequent ballot $k \ge 1$, the block hash is computed strictly over the canonical concatenation:
$$\text{Hash}_k = \text{SHA256}\left(\text{Hash}_{k-1} \,\|\, \text{electionId} \,\|\, \text{candidateId} \,\|\, t_k \,\|\, \text{Receipt}_k\right), \quad \forall k \ge 1$$
where $\text{Hash}_{k-1}$ is the exact `blockHash` of sequence block $k-1$. If an insider with administrative database access modifies candidate $c_k$ or timestamp $t_k$ in Block $k$, then $\text{SHA256}(\text{Block}_k) \neq \text{Block}_{k+1}.\text{previousHash}$, permanently breaking backward continuity from block $k+1$ through the tip of the chain.

---

## 5. Implementation Details

* **Client Frontend:** Built on React 18, Vite, and Tailwind CSS. Biometric capture utilizes `react-webcam` capturing high-definition frames rendered onto a real-time HTML5 canvas with dynamic oval guides.
* **Core Application Server:** Express.js on Node.js v20.18.0. Includes Mongoose ODM, Helmet HTTP headers, CORS whitelisting, and JSON Web Token verification.
* **ML Service:** FastAPI on Python 3.11.9, utilizing OpenCV 4.10, NumPy, scikit-learn 1.5, and `joblib`.
* **Database:** MongoDB 8.3 Enterprise server configured with write concerns and compound indices on electoral keys.

### 5.1 Administrative Real-Time Fraud Triage
When the Isolation Forest or biometric engine identifies an anomaly, the transaction is handled under a **non-blocking policy**:
* The ballot is successfully chained to the ledger so that legitimate citizens are not disenfranchised by occasional algorithmic false alarms.
* Simultaneously, a `FraudAlert` document is persisted with status `FLAGGED`, storing the anomaly score, Euclidean biometric distance, and exact session telemetry features.
* The Administrative Dashboard displays live flagged alerts with visual badges, permitting election officials to review anomalous voting sessions, cross-reference IP rotation patterns, and conduct post-election forensic audits.

### 5.2 Self-Service Account Erasure & Administrative Removal
To satisfy modern data privacy frameworks (e.g., GDPR Right to Erasure / Article 17) [23], the system implements authenticated voter account deletion via `DELETE /api/v1/auth/me` and administrative deletion via `DELETE /api/v1/admin/voters/:id`. Previously cast anonymized ballots remain permanently anchored on the immutable hash-chain ledger without orphaning blocks, preserving election tally integrity while honoring voter privacy.

---

## 6. Experimental Setup and Results

### 6.1 Dataset Synthesis & Telemetry Distributions
Because live production telemetry containing confirmed malicious electoral attacks cannot be ethically harvested without prior deployment, an empirical dataset generator was engineered in `ml-service/training/generate_synthetic_data.py`. The generator models $N_{\text{normal}} = 8,000$ legitimate voter records and $N_{\text{anomaly}} = 400$ malicious/bot records (4.76% contamination). Table 1 details the parameter ranges across both distributions.

#### Table 1: Telemetry Feature Definitions and Empirical Parameter Ranges
| Index | Telemetry Feature | Human Range | Malicious / Bot Range |
| :---: | :--- | :---: | :---: |
| $x_1$ | `login_freq_24h` | $[1, 3]$ ($\lambda=1.2$) | $[10, 60]$ ($\lambda=25.0$) |
| $x_2$ | `ip_change_count` | $[0, 1]$ ($\lambda=0.1$) | $[3, 15]$ ($\lambda=6.0$) |
| $x_3$ | `time_to_vote_seconds` | $[15.0, 180.0]$ ($\mu=45.0\text{ s}$) | $[0.5, 3.0]$ ($\mu=1.2\text{ s}$) |
| $x_4$ | `failed_attempts_ratio` | $[0.0, 0.1]$ ($\mu=0.02$) | $[0.4, 1.0]$ ($\mu=0.75$) |
| $x_5$ | `hour_of_day` | $[8.0, 22.0]$ (Diurnal) | $[1.0, 5.0]$ (Nocturnal Burst) |

### 6.2 Anomaly Detection Performance
The Isolation Forest model was evaluated on a strictly isolated test partition of 2,650 sessions (2,500 normal samples, 150 anomalous samples). Table 2 presents the resulting confusion matrix.

#### Table 2: Isolation Forest Confusion Matrix on Test Partition ($N = 2,650$)
| Ground Truth | Predicted Normal | Predicted Anomaly | Class Total |
| :--- | :---: | :---: | :---: |
| **Actual Normal** | **2,462** ($TN$) | **38** ($FP$) | 2,500 |
| **Actual Anomaly** | **40** ($FN$) | **110** ($TP$) | 150 |
| **Total Predicted** | **2,502** | **148** | **2,650** |

#### Table 3: Anomaly Detection Empirical Performance Metrics
| Evaluation Metric | Mathematical Definition | Measured Score | Design Target |
| :--- | :---: | :---: | :---: |
| **Classification Accuracy** | $(TP + TN) / (P + N)$ | **97.06%** | $\ge 95.0\%$ |
| **ROC-AUC Score** | $\int_0^1 \text{TPR}(\text{FPR}^{-1}(t))\,dt$ | **0.9885** | $\ge 0.950$ |
| **Precision (Anomaly Class)** | $TP / (TP + FP)$ | **74.32%** | $\ge 70.0\%$ |
| **Recall (Anomaly Class)** | $TP / (TP + FN)$ | **73.33%** | $\ge 70.0\%$ |
| **$F_1$-Score** | $2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$ | **73.83%** | $\ge 70.0\%$ |
| **False Positive Rate ($FPR$)** | $FP / (FP + TN)$ | **1.52%** | $\le 3.0\%$ |

As shown in Table 3, the Isolation Forest achieves 97.06% overall accuracy and an ROC-AUC of 0.9885. The low false positive rate of 1.52% guarantees that legitimate voters experience negligible disruption.

### 6.3 Biometric Verification Sensitivity
Table 4 summarizes pairwise Euclidean distances across live sessions. Setting $\tau_{\text{match}} = 0.76$ provides clean separation between genuine voters ($d \le 0.725$) and unauthorized imposters ($d \ge 0.819$).

#### Table 4: Pairwise Biometric Distance Calibration Across Camera Sessions
| Comparison Pairing Type | Distance Range ($d$) | Classification | Empirical Decision |
| :--- | :---: | :---: | :---: |
| **Intra-Person (Identical session)** | $[0.000, 0.240]$ | Genuine | Verified ($\tau \le 0.76$) |
| **Intra-Person (Lighting / Glasses)** | $[0.462, 0.725]$ | Genuine | Verified ($\tau \le 0.76$) |
| **Inter-Person (Similar room / scene)** | $[0.819, 1.010]$ | Imposter | Rejected / Flagged ($d > 0.76$) |
| **Inter-Person (Distinct subjects)** | $[1.292, 1.447]$ | Imposter | Rejected / Blocked ($d > 0.76$) |

### 6.4 Ledger Verification Latency
Integrity verification using `scripts/verify_ledger_cli.js` verified 1,000 sequential ballots in $42.5\text{ ms}$. Tamper injection tests confirmed that altering a single recorded vote broke chaining within $1.1\text{ ms}$, reliably identifying the corrupted block index.

---

## 7. Security Analysis & Threat Model

Table 5 summarizes the platform’s defense coverage evaluated against Microsoft’s STRIDE framework [24].

#### Table 5: STRIDE Threat Model Evaluation and Security Countermeasures
| Category | STRIDE Threat | System Architectural Defense & Mitigation |
| :---: | :--- | :--- |
| **S** | **Spoofing** | 128-d DCT/Sobel face verification ($d \le 0.76$) paired with temporal multi-frame liveness and HMAC-salted email OTP. |
| **T** | **Tampering** | Backward-linked SHA-256 cryptographic hash chaining; standalone CLI auditor verifies block integrity in $<45\text{ ms}$. |
| **R** | **Repudiation** | Deterministic cryptographic receipt tokens (`REC-...`) and immutable append-only audit trail logs. |
| **I** | **Information Disclosure** | Strict schema decoupling: `VoteRecord` (eligibility) is mathematically isolated from anonymized `Ballot`. |
| **D** | **Denial of Service** | Layered token-bucket rate limiting ($200\text{ req}/15\text{ min}$) and real-time Isolation Forest bot-burst mitigation. |
| **E** | **Elevation of Privilege** | Role-Based Access Control (RBAC) enforced via cryptographically signed stateless JWT claims at API gateway. |

---

## 8. Discussion, Limitations, and Ethics

### 8.1 Biometric Privacy and Right to Erasure
Storing raw facial photographs on centralized servers creates an attractive target for adversaries [25]. Our architecture mitigates this by converting images to 128-dimensional frequency representations with the DC coefficient removed ($D(0, 0) = 0.0$), rendering inverse facial reconstruction ill-posed. Furthermore, compliance with GDPR Article 17 [23] is implemented through the self-service endpoint `DELETE /api/v1/auth/me`, permanently erasing biometric embeddings while preserving anonymized hash-chain ballots.

### 8.2 Non-Blocking Triage vs. Disenfranchisement
Rejecting votes automatically on algorithmic anomaly signals introduces the risk of algorithmic disenfranchisement [26]. Our asymmetric non-blocking triage ensures that flagged ballots are sealed to the ledger and included in provisional counts, while `FraudAlert` records are archived for post-election administrative review.

### 8.3 System Limitations
The platform assumes client browser sandbox integrity and cannot detect kernel-level virtual camera drivers injecting synthetic video streams [27]. Remote voting also remains susceptible to physical terminal coercion [28], which polling stations prevent.

---

## 9. Conclusion and Future Work

In this paper, we presented an AI-augmented secure online voting architecture combining the MERN web stack with an applied machine learning microservice and a cryptographic hash-chained ballot ledger. By unifying 128-dimensional facial biometrics, eyeglass-resilient liveness detection, and an unsupervised Isolation Forest anomaly detector, the platform mitigates automated bot attacks, presentation attacks, and database tampering while preserving secret ballot anonymity. Experimental evaluation confirmed 97.06% classification accuracy and an ROC-AUC of 0.9885 with a 1.52% false positive rate.

Future extensions will incorporate Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge (zk-SNARKs) [29] for client-side biometric matching, secure Multi-Party Computation (MPC) [30] for distributed ballot tallying, and hardware-bound FIDO2/WebAuthn credentials.

---

## 10. References

1. R. Mercuri, "A better ballot box?" *IEEE Spectrum*, vol. 39, no. 10, pp. 46–50, 2002.
2. D. Springall, T. Finkenauer, Z. Durumeric, J. Kitcat, H. Hursti, M. MacAlpine, and J. A. Halderman, "Security analysis of the Estonian Internet voting system," in *Proc. ACM SIGSAC Conference on Computer and Communications Security (CCS)*, 2014, pp. 703–715.
3. P. A. Grassi, M. E. Garcia, and J. L. Fenton, "Digital identity guidelines: Authentication and lifecycle management," National Institute of Standards and Technology (NIST), Special Publication 800-63B, 2017.
4. S. Marcel, M. S. Nixon, and S. Z. Li, *Handbook of Biometric Anti-Spoofing: Presentation Attack Detection*. London, UK: Springer-Verlag, 2014.
5. M. Antonakakis, T. April, M. Bailey, M. Bernhard, E. Bursztein, J. Cochran, Z. Durumeric, J. A. Halderman, L. Invernizzi, M. Kallitsis *et al.*, "Understanding the Mirai botnet," in *Proc. 26th USENIX Security Symposium*, 2017, pp. 1093–1110.
6. V. Cortier, D. Galindo, S. Glondu, and M. Izabachène, "Election verifiability for all: ballot secrecy and verifiability requirements," in *Proc. IEEE 29th Computer Security Foundations Symposium (CSF)*, 2016, pp. 642–659.
7. J. Benaloh, "Verifiable secret-ballot elections," Ph.D. dissertation, Department of Computer Science, Yale University, New Haven, CT, 1987.
8. B. Adida, "Helios: Web-based open-audit voting," in *Proc. 17th USENIX Security Symposium*, 2008, pp. 335–348.
9. A. K. Jain, P. Flynn, and A. A. Ross, *Handbook of Biometrics*. New York, NY: Springer Science & Business Media, 2007.
10. F. Schroff, D. Kalenichenko, and J. Philbin, "FaceNet: A unified embedding for face recognition and clustering," in *Proc. IEEE Conference on Computer Vision and Pattern Recognition (CVPR)*, 2015, pp. 815–823.
11. Z. Hafed and M. D. Levine, "Face recognition using the discrete cosine transform," *International Journal of Computer Vision*, vol. 43, no. 3, pp. 167–188, 2001.
12. K. A. Patel, H. Han, and A. K. Jain, "Live face video vs. spoof face video: Use of surface texture and dynamics," in *Proc. IEEE International Conference on Biometrics (ICB)*, 2015, pp. 343–350.
13. T. Soukupová and J. Čech, "Real-time eye blink detection using facial landmarks," in *Proc. 21st Computer Vision Winter Workshop (CVWW)*, 2016, pp. 1–8.
14. P. Viola and M. J. Jones, "Robust real-time face detection," *International Journal of Computer Vision*, vol. 57, no. 2, pp. 137–154, 2004.
15. J. R. Douceur, "The Sybil attack," in *Peer-to-Peer Systems (IPTPS)*, ser. Lecture Notes in Computer Science, vol. 2429. Springer, 2002, pp. 251–260.
16. H. Debar, M. Dacier, and A. Wespi, "Towards a taxonomy of intrusion-detection systems," *Computer Networks*, vol. 31, no. 8, pp. 805–822, 1999.
17. F. T. Liu, K. M. Ting, and Z.-H. Zhou, "Isolation forest," in *Proc. 8th IEEE International Conference on Data Mining (ICDM)*, 2008, pp. 413–422.
18. F. T. Liu, K. M. Ting, and Z.-H. Zhou, "Isolation-based anomaly detection," *ACM Transactions on Knowledge Discovery from Data (TKDD)*, vol. 6, no. 1, pp. 1–39, 2012.
19. N. Kshetri and J. Voas, "Blockchain-enabled e-voting," *IEEE Software*, vol. 35, no. 4, pp. 95–99, 2018.
20. M. Crosby, P. Pattanayak, S. Verma, and V. Kalyanaraman, "Blockchain technology: Beyond bitcoin," *Applied Innovation Review*, vol. 2, pp. 6–10, 2016.
21. S. Park, M. Specter, N. Narula, and R. L. Rivest, "Going from bad to worse: from Internet voting to blockchain voting," in *Proc. Workshop on Usable Security and Privacy (USEC)*, 2021.
22. B. Laurie, "Certificate transparency," *ACM Queue*, vol. 12, no. 8, pp. 10–19, 2014.
23. European Parliament and Council of the European Union, "Regulation (EU) 2016/679 (General Data Protection Regulation)," *Official Journal of the European Union*, vol. L119, pp. 1–88, 2016.
24. S. Hernan, S. Lambert, T. Ostwald, and A. Shostack, "Threat modeling: Uncover security design flaws using the STRIDE approach," *MSDN Magazine*, 2006.
25. N. K. Ratha, J. H. Connell, and R. M. Bolle, "Enhancing security and privacy in biometrics-based authentication systems," *IBM Systems Journal*, vol. 40, no. 3, pp. 614–634, 2001.
26. V. Eubanks, *Automating Inequality: How High-Tech Tools Profile, Police, and Punish the Poor*. New York, NY: St. Martin's Press, 2018.
27. Y. Mirsky and W. Lee, "The creation and detection of deepfakes: A survey," *ACM Computing Surveys (CSUR)*, vol. 54, no. 1, pp. 1–41, 2021.
28. D. Chaum, "Secret-ballot recipes," *IEEE Security & Privacy*, vol. 2, no. 1, pp. 38–47, 2004.
29. E. Ben-Sasson, A. Chiesa, E. Tromer, and M. Virza, "Succinct non-interactive zero knowledge for a von Neumann architecture," in *Proc. 23rd USENIX Security Symposium*, 2014, pp. 781–796.
30. R. Cramer, I. Damgård, and J. B. Nielsen, *Secure Multiparty Computation and Secret Sharing*. Cambridge, UK: Cambridge University Press, 2015.
