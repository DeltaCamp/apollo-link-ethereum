export class CustomError extends Errors {

  constructor(...args) {
    console.log(...args)
    super(...args)

    Error.captureStackTrace(this, CustomError)
  }

}
