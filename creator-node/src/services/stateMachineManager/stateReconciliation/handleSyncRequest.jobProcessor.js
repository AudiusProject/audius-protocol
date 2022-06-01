/**
 * Processes a job to execute a manual or recurring sync (determined by syncType param).
 * @param {number} jobId the id of the job being run
 * @param {string} syncType the type of sync (manual or recurring)
 * @param {Object} syncRequestParameters axios params to make the sync request. Shape: { baseURL, url, method, data }
 */
module.exports = async function (jobId, syncType, syncRequestParameters) {
  // TODO: Copy from snapback's `processSyncOperation()`
  return {}
}
