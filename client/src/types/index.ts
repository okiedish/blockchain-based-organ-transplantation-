export type UserRole = 'donor' | 'recipient' | 'hospital' | 'admin';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type VerificationStatus = 'UNVERIFIED' | 'REQUIRES_REVIEW' | 'VERIFIED' | 'REJECTED';
export type ChainStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface User {
  _id: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  bloodGroup?: BloodGroup;
  location?: { state?: string; city?: string; hospital?: string; address?: string };
  available?: boolean;
  lastDonationAt?: string;
  verification?: {
    status: VerificationStatus;
    aadhaarMasked?: string;
    submittedAt?: string;
    reviewedAt?: string;
    reviewNote?: string;
    extracted?: { name?: string; dateOfBirth?: string; gender?: string };
  };
  createdAt: string;
}

export interface BloodRequest {
  _id: string;
  bloodGroup: BloodGroup;
  units: number;
  unitsFulfilled: number;
  urgency: number;
  hospital: string;
  location: { state: string; city: string };
  status: 'OPEN' | 'MATCHED' | 'FULFILLED' | 'CANCELLED';
  candidateCount: number;
  createdAt: string;
  recipientId?: { name?: string } | string;
}

export interface MatchView {
  id: string;
  status: 'OFFERED' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED' | 'EXPIRED';
  score: number;
  createdAt: string;
  request?: { id: string; bloodGroup: BloodGroup; units: number; urgency: number; hospital: string; location: { state: string; city: string }; status: string };
  donor?: { name?: string; bloodGroup?: BloodGroup; city?: string };
  recipient?: { name?: string };
}

export interface DonationView {
  id: string;
  bloodGroup: BloodGroup;
  units: number;
  hospital?: string;
  completedAt: string;
  donor?: { name?: string };
  recipient?: { name?: string };
}

export interface ChainRecord {
  _id: string;
  recordType: 'REGISTRATION' | 'VERIFICATION' | 'MATCH' | 'DONATION';
  status: ChainStatus;
  transactionHash?: string;
  blockNumber?: number;
  network?: string;
  chainId?: number;
  contractAddress?: string;
  errorMessage?: string;
  explorerUrl?: string | null;
  recordHash: string;
  attempts: number;
  createdAt: string;
  confirmedAt?: string;
}

export interface Statistics {
  totals: { totalDonors: number; totalRecipients: number; verifiedUsers: number; openRequests: number; successfulMatches: number; completedDonations: number };
  bloodGroupDistribution: { bloodGroup: string; donors: number }[];
  donationTrend: { month: string; donations: number }[];
  requestFulfillment: Record<string, number>;
  verificationStatus: Record<string, number>;
  blockchain: Record<string, number>;
  donorsByState: Record<string, number>;
}
