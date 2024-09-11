export class MissingOtpUserAuthError extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, MissingOtpUserAuthError.prototype)
  }
}

export class AntiAbuseOracleAttestationError extends Error {
  override name = 'AntiAbuseOracleAttestationError'
  constructor(public code: number, message: string) {
    super(message)
    Object.setPrototypeOf(this, AntiAbuseOracleAttestationError.prototype)
  }
}
