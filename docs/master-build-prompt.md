# MASTER BUILD PROMPT — JEEVANBINDU

Act as a senior MERN + blockchain engineer. Convert the supplied JeevanBindu project
into a genuinely functional application while preserving the current UI almost exactly.

## NON-NEGOTIABLE SOURCE COVERAGE
There are TWO supplied archives:
1. `jeevanbindu-organ-connect-main.zip` — inventory EVERY file. Preserve all useful
   pages, dashboard components, layout, shadcn/ui primitives, styles, assets and types.
2. `prgan-frontend.zip` — inventory EVERY file. Reuse its useful concepts from
   AadhaarAuth, Signup, Login, Dashboard, Matching, PatientForm, DonorForm and Navbar.
Do not silently omit a file. If a file is obsolete, document the replacement in
`docs/migration-map.md`.

The existing UI is the design source of truth. Do not replace it with a generic template.

## REMOVE
Remove/replace Lovable project references, Lovable APIs, Supabase, fake localStorage
database/auth, artificial delays, mock blockchain hashes and placeholder alerts.
Do NOT put credentials, Aadhaar numbers or medical information on the blockchain.

## STACK
Frontend: React + TypeScript + Vite + Tailwind + shadcn/ui.
Backend: Node.js + Express + TypeScript.
DB: MongoDB + Mongoose.
Auth: JWT + bcrypt/argon2 + role authorization.
Validation: Zod.
Blockchain: Solidity + Hardhat + ethers.js.
Security: helmet, CORS allowlist, rate limiting, validation, audit logging.
Testing: API + contract + end-to-end tests.
Deployment: Docker-ready.

## ROLES
- Donor
- Recipient
- Hospital
- Government Admin

## DATABASE
User: role, name, email, phone, HMAC Aadhaar lookup token, masked Aadhaar,
passwordHash, bloodGroup, organTypes, location, status, verificationStatus,
blockchainRegistrationHash, timestamps.

Hospital: name, email, phone, registrationNumber, location, verificationStatus,
adminVerified, timestamps.

OrganRecord: donorId, organType, bloodGroup, availability, medicalStatus,
hospitalId, consentVersion, consentAt, blockchainRecordHash, timestamps.

RecipientRequest: recipientId, hospitalId, organType, bloodGroup, urgency,
medicalPriority, status, timestamps.

Match: recipientRequestId, donorId, hospitalId, compatibilityScore,
priorityScore, status, approvedBy, blockchainMatchHash, timestamps.

AuditLog: actorId, role, action, entityType, entityId, metadata, ip, timestamps.

BlockchainAudit: entityType, entityId, action, payloadHash, txHash, blockNumber,
network, createdAt.

## API
POST /api/auth/register
POST /api/auth/login
POST /api/auth/request-otp
POST /api/auth/verify-otp
GET /api/auth/me
GET /api/users/me
PATCH /api/users/me
POST /api/organs
GET /api/organs/mine
PATCH /api/organs/:id/availability
POST /api/recipient-requests
GET /api/recipient-requests/mine
GET /api/matches
POST /api/matches/run
POST /api/matches/:id/request
POST /api/matches/:id/approve
POST /api/matches/:id/reject
GET /api/hospitals
POST /api/hospitals/:id/verify
GET /api/admin/statistics
GET /api/admin/blockchain-records
GET /api/audit
GET /api/health

Every response follows `{success,data,error}`.

## FUNCTIONAL FLOWS
### Donor
Aadhaar sandbox OTP → registration → consent → organ selection → availability →
dashboard → verification/audit → availability updates.

### Recipient
Aadhaar sandbox OTP → registration → organ request → see eligible matches →
request match → hospital approval → matched/completed status.

### Hospital
Email/password login → real dashboard → search/filter donors and recipients →
verify eligible records → review requests → run matching → approve/reject →
inspect audit/blockchain records.

### Admin
Login → statistics → hospital/user verification → audit trail → blockchain records →
system-wide matching and oversight.

## MATCHING ENGINE
Server-side only. Never use localStorage matching.
Match on organ compatibility, blood group, medical eligibility, urgency,
medical priority, geography, donor availability and hospital constraints.
Use deterministic scoring and tie-breaking. Prevent double-allocation of a donor
using database atomic operations/transactions. Audit every match decision.

Suggested weights: compatibility 40%, urgency 25%, medical priority 15%,
distance 10%, availability 10%. Make weights configurable.

## BLOCKCHAIN
Create `JeevanBinduRegistry.sol`.
Functions:
- registerEntity(bytes32 entityHash, string action)
- recordMatch(bytes32 matchHash, bytes32 donorHash, bytes32 recipientHash)
- verifyRecord(bytes32 hash)
Emit registration/match events and restrict writes to operator/admin.
Store hashes only. Backend anchors canonical JSON hashes and records txHash,
blockNumber, network and confirmation status in MongoDB.

Use an outbox/retry mechanism or pending/confirmed/failed status so blockchain
failure never corrupts the primary MongoDB workflow.

## SECURITY
Aadhaar must never be stored plaintext; use HMAC lookup + masked display.
Do not claim real UIDAI authentication. OTP is a development sandbox.
Do not store PII/medical data on-chain.
Use bcrypt/argon2, JWT secret env vars, role middleware, input validation,
helmet, rate limiting, CORS, secure file handling and audit logs.

## UI MIGRATION
Keep the existing hero, features, registration cards, navigation, footer, login,
registration, dashboards, charts, badges, tables, dialogs, colors, spacing and
responsive behavior. Wire them to the REST API without changing their visual identity.

Replace every mock action with an API action and provide loading/error/empty states.
The Transparency page must show real blockchain audit records and offer hash verification.

## SEED + DEMO
Seed obviously fake donor/recipient/hospital/admin records.
Document demo credentials in `.env.example`/README.
Never use real identity data.

## TESTS
Cover auth and role authorization, OTP, donor availability, matching compatibility,
double-allocation race conditions, hospital approval, admin authorization,
contract writes/verification, and an end-to-end donor → recipient request →
matching → hospital approval → blockchain anchor → transparency verification flow.

## ACCEPTANCE
Before declaring completion:
1. Inventory both archives file-by-file.
2. Build client, server and blockchain.
3. Run tests and fix failures.
4. Verify no Lovable/Supabase imports/config remain.
5. Verify no fake blockchain transaction generation remains.
6. Verify dashboards read real API data.
7. Verify all supplied UI files are either retained or explicitly mapped.
8. Provide exact local setup commands and `.env.example` files.
