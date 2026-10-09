# Migration map

What changed relative to the supplied archives (both are preserved under `source-archives/`;
`legacy/prgan-frontend/` is the second supplied frontend, kept for reference and not used by the app).

| Before | After |
| --- | --- |
| Organ-donation domain (organ types, NOTTO wording) | Blood donation: ABO/Rh compatibility, units, urgency |
| `client/src/lib/mockData.ts` and `Math.random()` statistics | Removed. All screens read the REST API |
| Simulated Aadhaar OTP and `setTimeout` logins | Email + password (bcrypt, JWT); prototype ID review with admin approval |
| Random "transaction hash" in Register.tsx | Real transactions through `blockchainService.ts`; status derived from the receipt |
| 13-line `JeevanBinduRegistry.sol` | `JeevanBinduRecords.sol` with roles, events, duplicate protection and 20+ tests |
| Minified single-file server routes | Layered routes / services / models in TypeScript |
| Hard-coded hero statistics, invented team members, government credits | Live statistics; honest academic-prototype copy |
| Lovable tagger and OG image | Removed |
