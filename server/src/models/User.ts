import mongoose, { HydratedDocument, InferSchemaType } from 'mongoose';

const verificationSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['UNVERIFIED', 'REQUIRES_REVIEW', 'VERIFIED', 'REJECTED'], default: 'UNVERIFIED' },
    method: { type: String, enum: ['PROTOTYPE_DEMO', 'SEED'], default: 'PROTOTYPE_DEMO' },
    aadhaarLookupHash: { type: String, index: true, sparse: true }, // HMAC, never the number
    aadhaarMasked: String, // ********1234
    documentHash: String, // SHA-256 of the uploaded file; the file itself is not stored
    extracted: { name: String, dateOfBirth: String, gender: String },
    submittedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    reviewNote: String,
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    role: { type: String, enum: ['donor', 'recipient', 'hospital', 'admin'], required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: String,
    passwordHash: { type: String, required: true, select: false },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    dateOfBirth: Date,
    bloodGroup: { type: String, enum: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] },
    location: { state: String, city: String, hospital: String, address: String },
    // donor-only
    available: { type: Boolean, default: true },
    lastDonationAt: Date,
    consentAt: Date,
    // lifecycle
    suspended: { type: Boolean, default: false },
    isDemoSeed: { type: Boolean, default: false },
    verification: { type: verificationSchema, default: () => ({}) },
  },
  { timestamps: true }
);

schema.index({ role: 1, bloodGroup: 1, available: 1 });

schema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    delete ret.passwordHash;
    delete ret.__v;
    if (ret.verification) {
      delete ret.verification.aadhaarLookupHash;
      delete ret.verification.documentHash;
    }
    return ret;
  },
});

export type UserDoc = HydratedDocument<InferSchemaType<typeof schema>>;
export default mongoose.model('User', schema);
