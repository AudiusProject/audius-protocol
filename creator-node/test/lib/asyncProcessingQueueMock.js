class AsyncProcessingQueueMock {
  async startQueueMetrics() {}

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
      }
    }
  }
}

module.exports = AsyncProcessingQueueMock
