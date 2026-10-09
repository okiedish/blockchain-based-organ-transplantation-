export const BLOOD_GROUPS = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const isBloodGroup = (v: unknown): v is BloodGroup => typeof v === 'string' && (BLOOD_GROUPS as readonly string[]).includes(v);

function parse(group: BloodGroup): { abo: 'O' | 'A' | 'B' | 'AB'; rhPositive: boolean } {
  return { abo: group.slice(0, -1) as 'O' | 'A' | 'B' | 'AB', rhPositive: group.endsWith('+') };
}

/**
 * Red blood cell (packed RBC / whole blood) compatibility.
 * ABO: O donates to everyone; A to A and AB; B to B and AB; AB only to AB.
 * Rh : Rh-negative donors can give to anyone; Rh-positive donors only to Rh-positive recipients.
 * Plasma and platelet compatibility differ and are intentionally out of scope.
 */
export function canDonate(donor: BloodGroup, recipient: BloodGroup): boolean {
  const d = parse(donor);
  const r = parse(recipient);
  const aboOk = d.abo === 'O' || d.abo === r.abo || r.abo === 'AB';
  const rhOk = !d.rhPositive || r.rhPositive;
  return aboOk && rhOk;
}

/** Every donor group that may give to this recipient group. */
export const compatibleDonorGroups = (recipient: BloodGroup): BloodGroup[] => BLOOD_GROUPS.filter((g) => canDonate(g, recipient));

/** Every recipient group this donor group may give to. */
export const compatibleRecipientGroups = (donor: BloodGroup): BloodGroup[] => BLOOD_GROUPS.filter((g) => canDonate(donor, g));
