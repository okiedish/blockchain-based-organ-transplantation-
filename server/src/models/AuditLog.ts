import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: String,
    action: { type: String, required: true, index: true },
    entityType: String,
    entityId: String,
    metadata: mongoose.Schema.Types.Mixed, // never passwords, Aadhaar numbers or documents
    ip: String,
  },
  { timestamps: true }
);

export default mongoose.model('AuditLog', schema);
