const AsyncProcessingQueue = require('../../src/AsyncProcessingQueue')

// TODO: do we need this?
class AsyncProcessingQueueMock {
  constructor() {
    const apq = new AsyncProcessingQueue()

    this.PROCESS_NAMES = apq.PROCESS_NAMES
    this.PROCESS_STATES = apq.PROCESS_STATES
  }

  async getAsyncProcessingQueueJobs() {
    return {
      waiting: {
        trackContentUpload: 0,
        transcodeAndSegment: 0,
        processTranscodeAndSegments: 0,
        transcodeHandOff: 0,
        total: 0
      },
      active: {
        trackContentUpload: 0,
        transcodeAndSegment: 0,
        processTranscodeAndSegments: 0,
        transcodeHandOff: 0,
        total: 0
      },
      failed: {
        trackContentUpload: 0,
        transcodeAndSegment: 0,
        processTranscodeAndSegments: 0,
        transcodeHandOff: 0,
        total: 0
      },
      delayed: {
        trackContentUpload: 0,
        transcodeAndSegment: 0,
        processTranscodeAndSegments: 0,
        transcodeHandOff: 0,
        total: 0
      }
    }
  }
}

module.exports = AsyncProcessingQueueMock
