import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true, unique: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecipientRequest', required: true, index: true },
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bloodGroup: { type: String, required: true }, // donor's group
    units: { type: Number, default: 1 },
    hospital: String,
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date, required: true },
    status: { type: String, enum: ['COMPLETED'], default: 'COMPLETED' },
  },
  { timestamps: true }
);

export default mongoose.model('Donation', schema);
