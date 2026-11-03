const crypto = require('crypto');

/**
 * Generate a 6-digit cryptographic numeric OTP
 */
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hash an OTP using SHA-256 for secure storage in database
 */
const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * Generate a cryptographically random receipt hash for a voter
 */
const generateReceiptHash = () => {
  return 'REC-' + crypto.randomBytes(24).toString('hex').toUpperCase();
};

/**
 * Calculate the deterministic SHA-256 hash of a ballot block for blockchain ledger chaining
 * Formula: SHA-256(prevHash + ":" + electionId + ":" + candidateId + ":" + timestamp + ":" + receiptHash)
 */
const calculateBlockHash = ({ prevHash, electionId, candidateId, timestamp, receiptHash }) => {
  const ts = timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp).toISOString();
  const payload = `${prevHash}:${electionId.toString()}:${candidateId}:${ts}:${receiptHash}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
};

/**
 * Verify integrity of a single block
 */
const verifyBlock = (block) => {
  const expectedHash = calculateBlockHash({
    prevHash: block.prevHash,
    electionId: block.electionId,
    candidateId: block.candidateId,
    timestamp: block.timestamp,
    receiptHash: block.receiptHash,
  });
  return expectedHash === block.hash;
};

/**
 * Verify an entire sequence of ballot blocks for an election
 * Returns { valid: boolean, totalBlocks: number, corruptedBlockIndex: number | null, reason: string | null }
 */
const verifyLedgerChain = (blocks, expectedGenesisHash) => {
  if (!blocks || blocks.length === 0) {
    return { valid: true, totalBlocks: 0, corruptedBlockIndex: null, reason: 'Empty ledger' };
  }

  for (let i = 0; i < blocks.length; i++) {
    const current = blocks[i];

    // 1. Verify genesis block linkage
    if (i === 0) {
      if (expectedGenesisHash && current.prevHash !== expectedGenesisHash) {
        return {
          valid: false,
          totalBlocks: blocks.length,
          corruptedBlockIndex: 0,
          reason: `Genesis block prevHash does not match election genesis hash (${current.prevHash} != ${expectedGenesisHash})`,
        };
      }
    } else {
      // 2. Verify backward chain link
      const previous = blocks[i - 1];
      if (current.prevHash !== previous.hash) {
        return {
          valid: false,
          totalBlocks: blocks.length,
          corruptedBlockIndex: i,
          reason: `Block #${current.sequenceNumber} prevHash does not match Block #${previous.sequenceNumber} hash`,
        };
      }
    }

    // 3. Verify internal block hash integrity
    if (!verifyBlock(current)) {
      return {
        valid: false,
        totalBlocks: blocks.length,
        corruptedBlockIndex: i,
        reason: `Block #${current.sequenceNumber} contents have been tampered with; hash calculation mismatch`,
      };
    }
  }

  return { valid: true, totalBlocks: blocks.length, corruptedBlockIndex: null, reason: null };
};

module.exports = {
  generateOtp,
  hashOtp,
  generateReceiptHash,
  calculateBlockHash,
  verifyBlock,
  verifyLedgerChain,
};

