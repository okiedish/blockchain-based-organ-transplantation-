import mongoose from 'mongoose';

// An offer of a request to one compatible donor. Becomes a "match" once the donor accepts.
const schema = new mongoose.Schema(
  {
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecipientRequest', required: true, index: true },
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, default: 0 },
    status: { type: String, enum: ['OFFERED', 'ACCEPTED', 'DECLINED', 'COMPLETED', 'EXPIRED'], default: 'OFFERED', index: true },
    respondedAt: Date,
  },
  { timestamps: true }
);
schema.index({ requestId: 1, donorId: 1 }, { unique: true });

export default mongoose.model('Match', schema);
