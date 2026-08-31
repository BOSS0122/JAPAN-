/**
 * Who is actually running this service.
 *
 * Japan's 特定商取引法 requires a seller to publish these details, and a
 * privacy policy has to name a contact who answers requests about personal
 * data. Nobody but the operator can supply them, so they live here as one
 * block of blanks rather than being scattered through page copy — and the
 * legal pages render a visible warning for every field still empty, so an
 * unfinished one cannot be published quietly.
 *
 * Fill every field before going live, then delete this paragraph.
 */
export interface OperatorDetails {
  /** Registered company or sole-trader name. 販売業者 */
  legalName: string;
  /** Person responsible for operations. 運営統括責任者 */
  representative: string;
  /** Registered address. Disclosed on request is not enough for a shop. 所在地 */
  address: string;
  /** Reachable during stated hours. 電話番号 */
  phone: string;
  /** Monitored inbox for customer and privacy requests. */
  email: string;
  /** Public site origin, no trailing slash. Used for canonical URLs too. */
  siteUrl: string;
  /** When enquiries are answered, in the traveller's terms. */
  supportHours: string;
  /** Business registration number, where one applies. */
  registrationNumber: string;
}

export const operator: OperatorDetails = {
  legalName: "",
  representative: "",
  address: "",
  phone: "",
  email: "",
  siteUrl: process.env.SITE_URL ?? "",
  supportHours: "",
  registrationNumber: "",
};

/** Fields with no value yet. Empty means the legal pages are publishable. */
export function missingOperatorFields(): (keyof OperatorDetails)[] {
  return (Object.keys(operator) as (keyof OperatorDetails)[]).filter(
    (key) => !operator[key].trim(),
  );
}

export const operatorReady = () => missingOperatorFields().length === 0;
