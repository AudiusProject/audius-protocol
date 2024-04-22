export class RemoteDataNotFoundError extends Error {
  constructor(message: string) {
    super(message) // Pass message to the Error class constructor
    this.name = 'RemoteDataNotFoundError' // Set the error name to the class name
  }
}
