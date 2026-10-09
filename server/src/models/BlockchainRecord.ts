import mongoose from 'mongoose';

export const RECORD_TYPES = ['REGISTRATION', 'VERIFICATION', 'MATCH', 'DONATION'] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

// Off-chain bookkeeping for every on-chain anchor. The chain holds only hashes.
const schema = new mongoose.Schema(
  {
    recordType: { type: String, enum: RECORD_TYPES, required: true },
    referenceModel: { type: String, required: true }, // User | Match | Donation
    referenceId: { type: String, required: true }, // database id of the anchored record
    parentReferenceId: String, // e.g. request id for MATCH / DONATION
    recordId: { type: String, required: true, unique: true }, // bytes32 hex used on-chain
    recordHash: { type: String, required: true }, // bytes32 hex (SHA-256 of canonical data)
    referenceHash: String,
    ownerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }], // who may see it
    status: { type: String, enum: ['PENDING', 'CONFIRMED', 'FAILED'], default: 'PENDING', index: true },
    transactionHash: String,
    blockNumber: Number,
    contractAddress: String,
    chainId: Number,
    network: String,
    attempts: { type: Number, default: 0 },
    submittedAt: Date,
    confirmedAt: Date,
    errorMessage: String,
  },
  { timestamps: true }
);
schema.index({ recordType: 1, referenceId: 1 }, { unique: true });

export default mongoose.model('BlockchainRecord', schema);
