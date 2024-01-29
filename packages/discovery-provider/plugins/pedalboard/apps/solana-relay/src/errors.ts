export class ResponseError extends Error {
  status = 500
}

export class InternalServerError extends ResponseError {
  name = 'Internal Server Error'
  status = 500
}

export class BadRequestError extends ResponseError {
  name = 'Bad Request'
  status = 400
}

export class UnauthorizedError extends ResponseError {
  name = 'Unauthorized'
  status = 401
}

export class ForbiddenError extends ResponseError {
  name = 'Forbidden'
  status = 403
}
