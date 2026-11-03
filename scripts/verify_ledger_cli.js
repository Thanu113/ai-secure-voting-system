const path = require('path');
// Ensure server dependencies are resolvable from root
const serverModules = path.resolve(__dirname, '../server/node_modules');
if (!module.paths.includes(serverModules)) {
  module.paths.unshift(serverModules);
}

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const Election = require('../server/src/models/Election');
const Ballot = require('../server/src/models/Ballot');
const { verifyLedgerChain } = require('../server/src/utils/hashUtils');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_voting_system';

const runCliAudit = async () => {
  try {
    console.log('[Ledger CLI] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);

    const elections = await Election.find();
    console.log(`[Ledger CLI] Found ${elections.length} elections. Running cryptographic verification...\n`);

    for (const elec of elections) {
      console.log(`=======================================================`);
      console.log(`Auditing Election: "${elec.title}"`);
      console.log(`ID: ${elec._id} | Status: ${elec.status}`);
      console.log(`Genesis Hash: ${elec.genesisHash}`);

      const blocks = await Ballot.find({ electionId: elec._id }).sort({ sequenceNumber: 1 });
      const result = verifyLedgerChain(blocks, elec.genesisHash);

      console.log(`Total Blocks on Ledger: ${result.totalBlocks}`);
      console.log(`Recorded Votes in Election Document: ${elec.totalVotesCast}`);

      if (result.valid) {
        console.log(`RESULT: [PASS] LEDGER IS 100% CRYPTOGRAPHICALLY TAMPER-FREE`);
        console.log(`All SHA-256 blocks connect backward without any corruption.`);
      } else {
        console.error(`RESULT: [FAIL] CORRUPTION OR TAMPERING DETECTED!`);
        console.error(`Reason: ${result.reason}`);
        console.error(`Corrupted Block Index: #${result.corruptedBlockIndex}`);
      }
      console.log(`=======================================================\n`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Ledger CLI Error]:', err.message);
    process.exit(1);
  }
};

runCliAudit();

