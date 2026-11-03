const {
  generateOtp,
  hashOtp,
  generateReceiptHash,
  calculateBlockHash,
  verifyBlock,
  verifyLedgerChain,
} = require('../src/utils/hashUtils');

describe('Cryptographic Hash Utilities & Blockchain Ledger Engine', () => {
  describe('OTP Generation & Hashing', () => {
    test('generateOtp should return a 6-digit numeric string', () => {
      const otp = generateOtp();
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
    });

    test('hashOtp should produce deterministic 64-char hex SHA-256 string', () => {
      const otp = '654321';
      const hash1 = hashOtp(otp);
      const hash2 = hashOtp(otp);
      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hashOtp('123456'));
    });
  });

  describe('Receipt Hash Generation', () => {
    test('generateReceiptHash should generate prefixed unique tokens', () => {
      const receipt1 = generateReceiptHash();
      const receipt2 = generateReceiptHash();
      expect(receipt1.startsWith('REC-')).toBe(true);
      expect(receipt1).not.toBe(receipt2);
    });
  });

  describe('Blockchain Block & Chain Hash Verification', () => {
    const genesisHash = '0000000000000000000000000000000000000000000000000000000000000000';
    const electionId = '6633ff88aa99bb11cc22dd33';

    test('calculateBlockHash should compute deterministic SHA-256 hash', () => {
      const timestamp = new Date('2026-05-01T10:00:00.000Z');
      const hashA = calculateBlockHash({
        prevHash: genesisHash,
        electionId,
        candidateId: 'cand_1',
        timestamp,
        receiptHash: 'REC-123456',
      });

      const hashB = calculateBlockHash({
        prevHash: genesisHash,
        electionId,
        candidateId: 'cand_1',
        timestamp,
        receiptHash: 'REC-123456',
      });

      expect(hashA).toHaveLength(64);
      expect(hashA).toBe(hashB);
    });

    test('verifyLedgerChain should validate an untampered 3-block chain', () => {
      const ts1 = new Date('2026-05-01T10:01:00.000Z');
      const ts2 = new Date('2026-05-01T10:02:00.000Z');
      const ts3 = new Date('2026-05-01T10:03:00.000Z');

      const hash1 = calculateBlockHash({
        prevHash: genesisHash,
        electionId,
        candidateId: 'cand_A',
        timestamp: ts1,
        receiptHash: 'REC-01',
      });

      const hash2 = calculateBlockHash({
        prevHash: hash1,
        electionId,
        candidateId: 'cand_B',
        timestamp: ts2,
        receiptHash: 'REC-02',
      });

      const hash3 = calculateBlockHash({
        prevHash: hash2,
        electionId,
        candidateId: 'cand_A',
        timestamp: ts3,
        receiptHash: 'REC-03',
      });

      const blocks = [
        { sequenceNumber: 1, prevHash: genesisHash, hash: hash1, electionId, candidateId: 'cand_A', timestamp: ts1, receiptHash: 'REC-01' },
        { sequenceNumber: 2, prevHash: hash1, hash: hash2, electionId, candidateId: 'cand_B', timestamp: ts2, receiptHash: 'REC-02' },
        { sequenceNumber: 3, prevHash: hash2, hash: hash3, electionId, candidateId: 'cand_A', timestamp: ts3, receiptHash: 'REC-03' },
      ];

      const result = verifyLedgerChain(blocks, genesisHash);
      expect(result.valid).toBe(true);
      expect(result.totalBlocks).toBe(3);
      expect(result.corruptedBlockIndex).toBeNull();
    });

    test('verifyLedgerChain should instantly catch and flag tampered blocks', () => {
      const ts1 = new Date('2026-05-01T10:01:00.000Z');
      const ts2 = new Date('2026-05-01T10:02:00.000Z');

      const hash1 = calculateBlockHash({
        prevHash: genesisHash,
        electionId,
        candidateId: 'cand_A',
        timestamp: ts1,
        receiptHash: 'REC-01',
      });

      const hash2 = calculateBlockHash({
        prevHash: hash1,
        electionId,
        candidateId: 'cand_B',
        timestamp: ts2,
        receiptHash: 'REC-02',
      });

      // An attacker tampers with candidate in block #2 from cand_B to cand_C without updating hash
      const corruptedBlocks = [
        { sequenceNumber: 1, prevHash: genesisHash, hash: hash1, electionId, candidateId: 'cand_A', timestamp: ts1, receiptHash: 'REC-01' },
        { sequenceNumber: 2, prevHash: hash1, hash: hash2, electionId, candidateId: 'cand_C_TAMPERED', timestamp: ts2, receiptHash: 'REC-02' },
      ];

      const result = verifyLedgerChain(corruptedBlocks, genesisHash);
      expect(result.valid).toBe(false);
      expect(result.corruptedBlockIndex).toBe(1);
      expect(result.reason).toContain('contents have been tampered with');
    });
  });
});

