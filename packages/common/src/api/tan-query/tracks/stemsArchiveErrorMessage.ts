export const stemsArchiveErrorMessages = {
  // The archiver ran the job and it failed, but gave no reason. Don't assert a
  // cause we can't know.
  generic: "We couldn't prepare your download. Please try again.",
  // The archiver could not be reached to start the job, or polling its status
  // errored. This is retryable and is not necessarily the user's connection.
  requestFailed:
    "We couldn't reach the download service. Please try again in a moment.",
  // The job never reached a terminal state before we stopped polling. It may
  // still be running server-side.
  timedOut:
    'This is taking longer than expected. Your files may still be zipping, so please try again in a few minutes.'
}

// failedReason comes from the archiver worker and is not written for end
// users, so keep what we show short and tidy.
const MAX_FAILED_REASON_LENGTH = 200

const formatFailedReason = (failedReason?: string) => {
  const reason = failedReason?.replace(/\s+/g, ' ').trim()
  if (!reason) return undefined
  return reason.length > MAX_FAILED_REASON_LENGTH
    ? `${reason.slice(0, MAX_FAILED_REASON_LENGTH - 1)}…`
    : reason
}

type StemsArchiveErrorInfo = {
  /** The POST that creates the archive job failed. */
  initiateFailed?: boolean
  /** The state reported by the archiver for the job, if any. */
  jobState?: string
  /** The reason reported by the archiver when the job failed, if any. */
  failedReason?: string
  /** Polling the job status errored. */
  isStatusError?: boolean
  /** We stopped polling before the job reached a terminal state. */
  isTimedOut?: boolean
}

/**
 * Picks the message to show when a stems archive download fails.
 *
 * The failure paths mean different things to the user, so they get different
 * copy instead of one "check your connection" message:
 *  1. The job ran and failed: show the archiver's reason when it gave one.
 *  2. Polling timed out: the job may still be running, so don't say it failed.
 *  3. The request to start or poll the job failed: retryable, not necessarily
 *     the user's network.
 */
export const getStemsArchiveErrorMessage = ({
  initiateFailed,
  jobState,
  failedReason,
  isStatusError,
  isTimedOut
}: StemsArchiveErrorInfo) => {
  if (jobState === 'failed') {
    return formatFailedReason(failedReason) ?? stemsArchiveErrorMessages.generic
  }
  if (isTimedOut) {
    return stemsArchiveErrorMessages.timedOut
  }
  if (initiateFailed || isStatusError) {
    return stemsArchiveErrorMessages.requestFailed
  }
  return stemsArchiveErrorMessages.generic
}
