const Bull = require('bull')
const { logger: genericLogger } = require('./logging')
const config = require('./config')
const redisClient = require('./redis')
const { handleTrackContentRoute: transcodeFn } = require('./fileManager')

const EXPIRATION = 7200 // 2 hours in seconds
const PROCESS_NAMES = Object.freeze({
  transcode: 'transcode'
})
const PROCESS_STATES = Object.freeze({
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  FAILED: 'FAILED'
})

class FileProcessingQueue {
  constructor () {
    this.queue = new Bull(
      'fileProcessing', {
        redis: {
          host: config.get('redisHost'),
          port: config.get('redisPort')
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: true
        }
      }
    )
    this.maxConcurrency = 5 // arbitrary; can adjust

    this.queue.process(PROCESS_NAMES.transcode, this.maxConcurrency, async (job, done) => {
      const { transcodeParams } = job.data
      const resp = await this._trackProgress(PROCESS_NAMES.transcode, transcodeFn, transcodeParams)
      done(resp)
    })
  }

  async logStatus (logContext, message) {
    const logger = genericLogger.child(logContext)
    const count = await this.queue.count()
    logger.debug(`FileProcessingQueue: ${message}, count: ${count}`)
  }

  async logError (logContext, message) {
    const logger = genericLogger.child(logContext)
    logger.error(`FileProcessingQueue error: ${message}`)
  }

  // TODO: Will make this job a background process
  async addTranscodeTask (transcodeParams) {
    const { logContext } = transcodeParams
    this.logStatus(logContext, `Adding ${PROCESS_NAMES.transcode} task! uuid=${logContext.requestID}}`)

    const job = await this.queue.add(
      PROCESS_NAMES.transcode,
      { transcodeParams }
    )

    return job
  }

  // Note: "track" in `_trackProgress` is used as a verb, not the noun "track"
  async _trackProgress (taskType, func, { logContext, req }) {
    const uuid = logContext.requestID
    // TODO: consider expiry?

    let state = { status: PROCESS_STATES.IN_PROGRESS }
    this.logStatus(logContext, `Starting ${taskType}! uuid=${uuid}}`)
    await redisClient.set(`${taskType}:::${uuid}`, JSON.stringify(state), 'EX', EXPIRATION)
    const resp = await func({ logContext }, req)

    if (resp.statusCode === 200) {
      state = { status: PROCESS_STATES.DONE, resp }
      this.logStatus(logContext, `Successful ${taskType}! uuid=${uuid}}`)
      await redisClient.set(`${taskType}:::${uuid}`, JSON.stringify(state), 'EX', EXPIRATION)
    } else {
      state = { status: PROCESS_STATES.FAILED, resp }
      this.logError(logContext, `Error with ${taskType}. uuid=${uuid}}`)
      await redisClient.set(`${taskType}:::${uuid}`, JSON.stringify(state), 'EX', EXPIRATION)
    }

    return resp
  }
}

module.exports.FileProcessingQueue = new FileProcessingQueue()
module.exports.PROCESS_NAMES = PROCESS_NAMES
