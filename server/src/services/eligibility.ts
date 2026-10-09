export const MIN_AGE = 18;
export const MAX_AGE = 65;
export const MIN_DAYS_BETWEEN_DONATIONS = 90; // conservative platform rule for whole-blood donation

export function ageOn(dob: Date, on: Date = new Date()): number {
  let age = on.getFullYear() - dob.getFullYear();
  const m = on.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && on.getDate() < dob.getDate())) age--;
  return age;
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
  nextEligibleDate?: Date;
}

/** Basic platform eligibility only. This is not a medical screening. */
export function donorEligibility(
  p: { dateOfBirth?: Date | null; lastDonationAt?: Date | null },
  now: Date = new Date()
): EligibilityResult {
  const reasons: string[] = [];
  let nextEligibleDate: Date | undefined;
  if (!p.dateOfBirth) reasons.push('Date of birth is missing');
  else {
    const age = ageOn(p.dateOfBirth, now);
    if (age < MIN_AGE) reasons.push(`Donors must be at least ${MIN_AGE} years old`);
    if (age > MAX_AGE) reasons.push(`Donors must be ${MAX_AGE} or younger`);
  }
  if (p.lastDonationAt) {
    const next = new Date(p.lastDonationAt.getTime() + MIN_DAYS_BETWEEN_DONATIONS * 86400000);
    if (next > now) {
      reasons.push(`Last donation was too recent (next eligible ${next.toISOString().slice(0, 10)})`);
      nextEligibleDate = next;
    }
  }
  return { eligible: reasons.length === 0, reasons, nextEligibleDate };
}
