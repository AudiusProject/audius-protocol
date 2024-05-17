export class MissingOtpUserAuthError extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, MissingOtpUserAuthError.prototype)
  }
}

export class AntiAbuseAttestionError extends Error {
  constructor(public code: number, message: string) {
    super(message) // Pass message to the Error class constructor
    this.name = 'AntiAbuseAttestionError' // Set the error name to the class name
  }
}
