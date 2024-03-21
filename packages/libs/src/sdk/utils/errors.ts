export class MissingOtpUserAuthError extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, MissingOtpUserAuthError.prototype)
  }
}
