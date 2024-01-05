/* eslint-disable @typescript-eslint/no-unused-vars */

// TODO: Use the right SDK type
export const createScheduledReleaseService = (sdk: any) => {
  const queue = [] // TODO: Use https://github.com/mcollina/fastq

  const addTracksToQueue = async () => {
    // TODO: Scan dbService for tracks and push them onto the queue
  }

  const upload = async (trackInfo: any) => {
    // TODO: sdk.uploadTrack(...)
  }

  return {
    addTracksToQueue,
    upload,
  }
}
