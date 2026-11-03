# Security Analysis & Threat Model: AI-Based Secure Online Voting System

**System Version**: 1.0.0  
**Security Standard Reference**: OWASP Top 10 (2021), NIST SP 800-63B (Digital Identity Guidelines), cryptographic hash ledger integrity principles.

---

## 1. Threat Model & Security Objectives

An online electoral system faces adversarial threats ranging from nation-state coercion and insider database administrators to automated voting bots and identity impersonators. The system enforces the following core security objectives:

```
+--------------------------------------------------------------------------+
|                        Core Electoral Guarantees                         |
+--------------------------+-----------------------+-----------------------+
| 1. Ballot Secrecy        | 2. Vote Integrity     | 3. Eligibility        |
| Nobody can determine how | Nobody can alter or   | Only approved voters  |
| a specific voter voted.  | drop cast ballots.    | can vote, once each.  |
+--------------------------+-----------------------+-----------------------+
| 4. Receipt Freeness      | 5. Public Audit       | 6. Anti-Coercion      |
| Voter receipt cannot be  | Anyone can verify     | Live biometrics stop  |
| sold as proof of choice. | ledger continuity.    | credential sharing.   |
+--------------------------+-----------------------+-----------------------+
```

---

## 2. Cryptographic Ballot Ledger & Tamper Resistance

### 2.1 Linked SHA-256 Hash Chaining
Every cast vote produces a block on the election's ledger. The block hash is calculated strictly as:
$$\text{Hash}_i = \text{SHA256}\Big(\text{prevHash}_{i-1} \,\|\, \text{electionId} \,\|\, \text{candidateId} \,\|\, \text{timestamp} \,\|\, \text{receiptHash}\Big)$$

- **Genesis Block**: Created at election launch:
  $$\text{GenesisHash} = \text{SHA256}("GENESIS\_BLOCK\_" \,\|\, \text{title} \,\|\, \text{createdAt})$$
- **Tamper Evidence**: If an attacker with direct database access alters a single candidate ID, sequence number, or timestamp in Block $k$, then:
  $$\text{SHA256}(\text{Block}_k) \neq \text{Block}_{k+1}.\text{prevHash}$$
  The chain breaks instantly at Block $k+1$.

### 2.2 CLI Audit Verification
The system provides `scripts/verify_ledger_cli.js`, which traverses all election blocks from sequence #1 to the tip:
```bash
node scripts/verify_ledger_cli.js
```
If any block hash or backward pointer fails, the CLI outputs `[FAIL] CORRUPTION OR TAMPERING DETECTED!` with the exact corrupted sequence number.

---

## 3. Voter Anonymity & Receipt-Freeness

### 3.1 Strict Identity-to-Ballot Decoupling
To achieve the secret ballot principle in a database-backed system, the data model separates *eligibility tracking* from *ballot storage*:

```
+------------------------------------+         +-------------------------------------+
|        VoteRecord Document         |         |           Ballot Document           |
+------------------------------------+         +-------------------------------------+
| voterId:      "673f123456789..."   |         | voterId:      [NOT STORED]          |
| electionId:   "6ae81eb02f0e6..."   |         | candidateId:  "cand_alice_chen"     |
| receiptHash:  "REC-AA11BB22CC33"   |         | receiptHash:  "REC-AA11BB22CC33"    |
| votedAt:      2026-11-01T07:25:04Z |         | prevHash:     "9b021040e6ee2234..." |
| candidateId:  [NOT STORED]         |         | hash:         "9ba3a700487d9d27..." |
+------------------------------------+         +-------------------------------------+
```

- **Receipt Verification**: A voter with receipt token `REC-AA11BB22CC33` can query `/api/v1/votes/verify-receipt/REC-AA11BB22CC33`.
- **Anonymity Guarantee**: The response proves that the ballot exists at Sequence #1 in the blockchain ledger, provides the timestamp, and confirms inclusion in the count **without displaying candidateId**. Thus, the voter cannot be coerced into showing the receipt to prove who they voted for (receipt-freeness).

---

## 4. One-Person-One-Vote Enforcement

Double voting is prevented through three independent layers of defense:

1. **Database Compound Unique Index**:
   ```javascript
   VoteRecordSchema.index({ voterId: 1, electionId: 1 }, { unique: true });
   ```
   At the database engine level, MongoDB rejects any duplicate insert with a duplicate key error (code 11000).
2. **Pre-Flight Controller Check**:
   Before initiating biometric verification or ledger locking, `voteController.js` executes `VoteRecord.findOne({ voterId, electionId })`. If found, a `403 Forbidden` (`VOTE_ALREADY_CAST`) is returned immediately.
3. **Role & Approval State Guard**:
   The `requireApprovedVoter` middleware rejects unapproved, pending, or banned accounts before request processing.

---

## 5. Authentication & Session Hardening

| Component | Security Configuration | Purpose |
|---|---|---|
| **Password Hashing** | Bcrypt with salt rounds = 12 | Resist rainbow tables and GPU cracking |
| **Email OTP** | 6-digit cryptographically secure CSPRNG (`crypto.randomInt(100000, 999999)`) | Multi-factor registration verification |
| **OTP Storage** | SHA-256 hash stored in DB; 10-minute TTL | Prevents database read compromise of live OTPs |
| **Access Tokens** | JWT signed with HMAC-SHA256, 15-minute expiration | Minimizes blast radius of stolen access tokens |
| **Refresh Tokens** | JWT stored in HTTP-only safe storage, 7-day expiration | Allows seamless token rotation without re-prompting |
| **RBAC** | Strict role middleware (`voter` vs `admin`) | Prevents horizontal and vertical privilege escalation |

---

## 6. Machine Learning Security (Biometrics & Anomaly Defense)

### 6.1 Biometric Anti-Spoofing
- **The Threat**: An adversary holds up a printed photo or smartphone screen of an authorized voter to bypass facial verification.
- **The Mitigation**: The webcam client captures multiple consecutive video frames during the verification challenge. The ML engine calculates the Eye Aspect Ratio (EAR) across frames, verifying dynamic eyelid micro-movement ($\sigma^2 > 0.005$) and at least one complete blink cycle.

### 6.2 Behavioral Anomaly Detection (Isolation Forest)
- **The Threat**: Scripted botnets using automated browser headless tools (Puppeteer / Selenium) casting votes at inhuman speeds, hopping VPN IPs, or attempting credential stuffing.
- **The Mitigation**: Each voting request submits behavioral telemetry (`login_frequency_24h`, `ip_change_count`, `time_to_vote_seconds`, `failed_attempts_ratio`). An Isolation Forest model isolates outliers ($s \le -0.15$), triggering real-time alerts in the administrator dashboard while maintaining an audit log.

---

## 7. OWASP Top 10 Mitigation Summary

| OWASP Threat Category | System Defense Mechanism |
|---|---|
| **A01: Broken Access Control** | Role-Based Access Control (`authMiddleware.js`), ownership checks on ballots, public API sanitization. |
| **A02: Cryptographic Failures** | SHA-256 ledger chaining, Bcrypt 12 rounds, TLS/HTTPS readiness, environment-isolated secrets (`.env`). |
| **A03: Injection** | Mongoose schema validation, parameterized queries (NoSQL injection immune), express-validator input sanitizers. |
| **A04: Insecure Design** | Separation of voter identity from cast ballot, zero trust internal ML microservice token exchange. |
| **A05: Security Misconfiguration** | Helmet security headers (`X-Content-Type-Options`, `X-Frame-Options: DENY`, `Strict-Transport-Security`), CORS origin lockdown. |
| **A06: Vulnerable Components** | All npm and Python packages pinned to secure versions, zero vulnerable transitive dependencies. |
| **A07: Identification & Auth Failures** | Mandatory email OTP verification, strict rate limiting on `/api/v1/auth/login` (max 20 attempts/15m). |
| **A08: Software & Data Integrity** | SHA-256 tamper-evident vote ledger, reproducible CLI cryptographic auditor. |
| **A09: Security Logging & Monitoring** | Dedicated `AuditLog` collection recording actor ID, IP, user-agent, timestamp, and status for all sensitive administrative actions. |
| **A10: Server-Side Request Forgery** | ML client communicates only with explicitly configured `ML_SERVICE_URL` (`http://127.0.0.1:8000`), refusing untrusted external redirects. |

