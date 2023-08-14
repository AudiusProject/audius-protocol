export enum Status {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

/** Detects if a status is in a non-terminal state */
export function statusIsNotFinalized(status: Status) {
  return [Status.IDLE, Status.LOADING].includes(status)
}

/**
 * Reduces an array of `Status` values to the least-complete status or `ERROR` if present.
 */
export function combineStatuses(statuses: Status[]) {
  if (statuses.includes(Status.ERROR)) {
    return Status.ERROR
  }
  if (statuses.includes(Status.LOADING)) {
    return Status.LOADING
  }
  if (statuses.includes(Status.IDLE)) {
    return Status.IDLE
  }
  return Status.SUCCESS
}
