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
