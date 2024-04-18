/** An error class that extends `Error` */
export default class OneBlinkStorageError extends Error {
  /** The http status code associated with the error */
  httpStatusCode: number
  /** The original error that was thrown */
  originalError?: Error

  /**
   * Used to create an instance of the `OneBlinkStorageError` class.
   *
   * @param message The message associated with the error
   * @param options The options associated with the error
   */
  constructor(
    message: string,
    options: {
      /** The http status code associated with the error */
      httpStatusCode: number
      /** The original error that was thrown */
      originalError?: Error
    },
  ) {
    super(message)
    this.name = 'OneBlinkStorageError'

    this.originalError = options.originalError
    this.httpStatusCode = options.httpStatusCode
  }
}
