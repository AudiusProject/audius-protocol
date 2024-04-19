/**
 * Generate the redis keys required for tracking listen submission vs success
 * @param {string} hour formatted as such - 2022-01-25T21:00:00.000Z
 */
const getTrackingListenKeys = (hour: string) => {
    return {
      submission: `listens-tx-submission::${hour}`,
      success: `listens-tx-success::${hour}`
    }
  }

const TRACKING_LISTEN_SUBMISSION_KEY = 'listens-tx-submission-ts'
const TRACKING_LISTEN_SUCCESS_KEY = 'listens-tx-success-ts'
