/**
 * F-59 — the single source of truth for input length limits.
 *
 * These numbers used to be literals scattered across the forms as hard-coded
 * maxLength attributes, which is how the contact form ended up allowing a
 * two-thousand-char message while its server-side validation disagreed, and
 * how "what's the email limit?" had no answer except "grep the source".
 * One map means the UI constraint, the server validation and any future
 * CMS/storage limit can all point at the same value.
 *
 * Values chosen to match what the backend actually accepts (Vendure/Payload
 * string columns and RFC 5321's 254-char mailbox path), not round guesses.
 */
export const FIELD_LIMITS = {
  /** Full personal name — generous for compounded Arabic names. */
  personName: 120,
  /** RFC 5321: 64 local + @ + 190 domain. */
  emailAddress: 254,
  /** Egyptian mobile in E.164-ish forms (+20…); 40 leaves room for separators. */
  phoneNumber: 40,
  /** Company / pharmacy name. */
  organization: 160,
  /** Contact-form subject line. */
  subject: 200,
  /** Contact-form message body. */
  message: 2000,
  /** Street-level address line(s). */
  streetAddress: 200,
  /** Free-text order notes. */
  orderNotes: 500,
} as const

export type FieldLimit = keyof typeof FIELD_LIMITS
