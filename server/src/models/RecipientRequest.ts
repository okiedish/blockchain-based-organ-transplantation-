import mongoose from 'mongoose';

// A blood request raised by a recipient.
const schema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bloodGroup: { type: String, enum: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], required: true },
    units: { type: Number, min: 1, max: 10, default: 1 },
    unitsFulfilled: { type: Number, default: 0 },
    urgency: { type: Number, min: 1, max: 5, default: 3 }, // 5 = critical
    hospital: { type: String, required: true, trim: true },
    location: { state: { type: String, required: true }, city: { type: String, required: true } },
    neededBy: Date,
    notes: { type: String, maxlength: 500 },
    status: { type: String, enum: ['OPEN', 'MATCHED', 'FULFILLED', 'CANCELLED'], default: 'OPEN', index: true },
    candidateCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('RecipientRequest', schema);
