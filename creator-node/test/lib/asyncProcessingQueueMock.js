const AsyncProcessingQueue = require('../../src/AsyncProcessingQueue')

class AsyncProcessingQueueMock {
  constructor () {
    const apq = new AsyncProcessingQueue()

    this.PROCESS_NAMES = apq.PROCESS_NAMES
    this.PROCESS_STATES = apq.PROCESS_STATES
  }

  async getAsyncProcessingQueueJobs () {
    return 1
  }
}

module.exports = AsyncProcessingQueueMock
