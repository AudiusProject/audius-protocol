/**
 * A current node should handle a track transcode if there is enough room in the TranscodingQueue to accept more jobs
 *
 * If there is not enough room, if the spID is not set after app init, then the current node should still accept the transcode task
 * @param {Object} param
 * @param {boolean} param.transcodingQueueCanAcceptMoreJobs flag to determine if TranscodingQueue can accept more jobs
 * @param {number} param.spID the spID of the current node
 * @returns whether or not the current node can handle the transcode
 */
export function currentNodeShouldHandleTranscode({
  transcodingQueueCanAcceptMoreJobs,
  spID
}: {
  transcodingQueueCanAcceptMoreJobs: boolean
  spID: number
}) {
  // If the TranscodingQueue is available, let current node handle transcode
  if (transcodingQueueCanAcceptMoreJobs) return true

  // Else, if spID is not initialized, the track cannot be handed off to another node to transcode.
  // Continue with the upload on the current node.
  const currentNodeShouldHandleTranscode = !Number.isInteger(spID)

  return currentNodeShouldHandleTranscode
}
