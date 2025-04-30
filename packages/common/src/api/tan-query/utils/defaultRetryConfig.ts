export const MAX_RETRIES = 3
export const HTTP_STATUSES_TO_NOT_RETRY = [400, 401, 403, 404]

export const defaultRetryConfig = (failureCount: number, error: any) => {
  if (failureCount > MAX_RETRIES) {
    return false
  }

  if (
    Object.hasOwnProperty.call(error, 'status') &&
    HTTP_STATUSES_TO_NOT_RETRY.includes(error.status)
  ) {
    return false
  }

  return true
}
