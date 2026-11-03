const path = require('path');
// Ensure server dependencies are resolvable from root
const serverModules = path.resolve(__dirname, '../server/node_modules');
if (!module.paths.includes(serverModules)) {
  module.paths.unshift(serverModules);
}

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const User = require('../server/src/models/User');
const Election = require('../server/src/models/Election');
const Ballot = require('../server/src/models/Ballot');
const VoteRecord = require('../server/src/models/VoteRecord');
const AuditLog = require('../server/src/models/AuditLog');
const FraudAlert = require('../server/src/models/FraudAlert');
const { calculateBlockHash } = require('../server/src/utils/hashUtils');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_voting_system';

// Generate synthetic unit normalized 128-d face vector
const generateSampleEmbedding = (seed = 42) => {
  const vec = [];
  for (let i = 0; i < 128; i++) {
    vec.push(Math.sin(seed * (i + 1)) * 0.1);
  }
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  return vec.map((val) => Number((val / norm).toFixed(6)));
};

const seed = async () => {
  try {
    console.log(`[Seed Script] Connecting to ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed Script] Connected.');

    // Clean existing data
    console.log('[Seed Script] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Election.deleteMany({}),
      Ballot.deleteMany({}),
      VoteRecord.deleteMany({}),
      AuditLog.deleteMany({}),
      FraudAlert.deleteMany({}),
    ]);

    // 1. Create Demo Admin
    console.log('[Seed Script] Creating Demo Admin...');
    const admin = await User.create({
      name: 'Dr. Evelyn Reed (Chief Electoral Officer)',
      email: 'admin@securevote.org',
      voterId: 'ADM-000001',
      password: 'Admin@12345',
      role: 'admin',
      status: 'approved',
      isEmailVerified: true,
      faceEmbedding: generateSampleEmbedding(101),
    });

    // 2. Create Demo Voters
    console.log('[Seed Script] Creating Demo Voters...');
    const voter1 = await User.create({
      name: 'Alex Rivera',
      email: 'voter1@securevote.org',
      voterId: 'VTR-100001',
      password: 'Voter@12345',
      role: 'voter',
      status: 'approved',
      isEmailVerified: true,
      faceEmbedding: generateSampleEmbedding(202),
    });

    const voter2 = await User.create({
      name: 'Sarah Jenkins',
      email: 'voter2@securevote.org',
      voterId: 'VTR-100002',
      password: 'Voter@12345',
      role: 'voter',
      status: 'approved',
      isEmailVerified: true,
      faceEmbedding: generateSampleEmbedding(303),
    });

    const voter3 = await User.create({
      name: 'Michael Chang',
      email: 'voter3@securevote.org',
      voterId: 'VTR-100003',
      password: 'Voter@12345',
      role: 'voter',
      status: 'pending', // Pending KYC
      isEmailVerified: true,
      faceEmbedding: generateSampleEmbedding(404),
    });

    // 3. Create Elections
    console.log('[Seed Script] Creating Elections...');
    const now = new Date();
    const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Started yesterday
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Ends in 7 days

    const election1Genesis = crypto.createHash('sha256').update('GENESIS_BLOCK_STUDENT_UNION_2026').digest('hex');

    const election1 = await Election.create({
      title: '2026 University Student Union Presidential Election',
      description: 'Official annual university election to select the student council executive leadership.',
      startDate,
      endDate,
      status: 'active',
      genesisHash: election1Genesis,
      createdBy: admin._id,
      candidates: [
        {
          candidateId: 'cand_alice_chen',
          name: 'Alice Chen',
          party: 'Progressive Student Alliance',
          manifesto: 'Expanding mental health services, campus sustainability, and 24/7 library access.',
          voteCount: 1,
        },
        {
          candidateId: 'cand_marcus_vance',
          name: 'Marcus Vance',
          party: 'Campus Innovation Coalition',
          manifesto: 'Modernizing campus transport, boosting student startup grants, and hackathons.',
          voteCount: 1,
        },
        {
          candidateId: 'cand_sofia_patel',
          name: 'Sofia Patel',
          party: 'United Students Voice',
          manifesto: 'Fair student housing advocacy, international student legal support, and food co-ops.',
          voteCount: 0,
        },
      ],
      totalVotesCast: 2,
    });

    // 4. Create Initial Hash-Chained Ballots for Election 1
    console.log('[Seed Script] Seeding immutable SHA-256 blockchain ledger...');

    // Block 1 (Voter 1 ballot)
    const receipt1 = 'REC-AA11BB22CC33DD44';
    const timestamp1 = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const hash1 = calculateBlockHash({
      prevHash: election1Genesis,
      electionId: election1._id,
      candidateId: 'cand_alice_chen',
      timestamp: timestamp1,
      receiptHash: receipt1,
    });

    const block1 = await Ballot.create({
      electionId: election1._id,
      sequenceNumber: 1,
      candidateId: 'cand_alice_chen',
      receiptHash: receipt1,
      prevHash: election1Genesis,
      hash: hash1,
      timestamp: timestamp1,
    });

    await VoteRecord.create({
      voterId: voter1._id,
      electionId: election1._id,
      receiptHash: receipt1,
      votedAt: timestamp1,
    });

    // Block 2 (Voter 2 ballot linked to Block 1)
    const receipt2 = 'REC-EE55FF66GG77HH88';
    const timestamp2 = new Date(startDate.getTime() + 4 * 60 * 60 * 1000);
    const hash2 = calculateBlockHash({
      prevHash: hash1,
      electionId: election1._id,
      candidateId: 'cand_marcus_vance',
      timestamp: timestamp2,
      receiptHash: receipt2,
    });

    const block2 = await Ballot.create({
      electionId: election1._id,
      sequenceNumber: 2,
      candidateId: 'cand_marcus_vance',
      receiptHash: receipt2,
      prevHash: hash1,
      hash: hash2,
      timestamp: timestamp2,
    });

    await VoteRecord.create({
      voterId: voter2._id,
      electionId: election1._id,
      receiptHash: receipt2,
      votedAt: timestamp2,
    });

    // 5. Create a Closed Election with Certified Winner
    const closedElectionGenesis = crypto.createHash('sha256').update('GENESIS_BLOCK_REFERENDUM_2025').digest('hex');
    await Election.create({
      title: '2025 Artificial Intelligence & Ethics Referendum',
      description: 'Campus vote on mandatory AI transparency guidelines across all academic departments.',
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() - 23 * 24 * 60 * 60 * 1000),
      status: 'closed',
      genesisHash: closedElectionGenesis,
      createdBy: admin._id,
      totalVotesCast: 1420,
      candidates: [
        {
          candidateId: 'cand_adopt',
          name: 'Adopt AI Ethics Framework (Yes)',
          party: 'Referendum Initiative A',
          manifesto: 'Implement rigorous ethical oversight on student data and automated systems.',
          voteCount: 985,
        },
        {
          candidateId: 'cand_reject',
          name: 'Maintain Existing Policies (No)',
          party: 'Referendum Initiative B',
          manifesto: 'Rely on existing faculty guidelines without additional administrative boards.',
          voteCount: 435,
        },
      ],
    });

    // 6. Create Initial Audit Logs & Fraud Alerts for demo
    await AuditLog.create({
      action: 'SYSTEM_INITIALIZED',
      actorId: admin._id,
      actorRole: 'admin',
      ipAddress: '127.0.0.1',
      userAgent: 'SeedScript/1.0',
      status: 'SUCCESS',
      details: { message: 'Election ledger system bootstrapped with genesis seed.' },
    });

    console.log('\n=======================================================');
    console.log('       DATABASE SEEDED SUCCESSFULLY WITH DEMO DATA      ');
    console.log('=======================================================');
    console.log('Demo Admin:');
    console.log('   Email:    admin@securevote.org');
    console.log('   Password: Admin@12345');
    console.log('-------------------------------------------------------');
    console.log('Demo Voters:');
    console.log('   Voter 1 (Approved, Voted): voter1@securevote.org / Voter@12345 (Receipt: ' + receipt1 + ')');
    console.log('   Voter 2 (Approved, Voted): voter2@securevote.org / Voter@12345 (Receipt: ' + receipt2 + ')');
    console.log('   Voter 3 (Pending KYC):     voter3@securevote.org / Voter@12345');
    console.log('=======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err.message);
    process.exit(1);
  }
};

seed();

