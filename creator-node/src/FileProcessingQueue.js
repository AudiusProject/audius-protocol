const Bull = require('bull')
const { logger: genericLogger } = require('./logging')
const config = require('./config')
const redisClient = require('./redis')
const { handleTrackContentRoute: transcodeFn } = require('./components/tracks/tracksComponentService')
const { serviceRegistry } = require('./serviceRegistry')

const EXPIRATION = 86400 // 24 hours in seconds
const PROCESS_NAMES = Object.freeze({
  transcode: 'transcode'
})
const PROCESS_STATES = Object.freeze({
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  FAILED: 'FAILED'
})

function constructProcessKey (taskType, uuid) {
  return `${taskType}:::${uuid}`
}

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

    this.queue.process(
      PROCESS_NAMES.transcode,
      100 /* concurrency */,
      async (job, done) => {
        const { transcodeParams } = job.data

        try {
          const response = await this.monitorProgress(PROCESS_NAMES.transcode, transcodeFn, transcodeParams)
          done(null, { response })
        } catch (e) {
          this.logError(transcodeParams.logContext, `Could not process taskType=${PROCESS_NAMES.transcode} uuid=${transcodeParams.logContext.requestID}: ${e.toString()}`)
          done(e.toString())
        }
      })
  }

  async logStatus (logContext, message) {
    const logger = genericLogger.child(logContext)
    const count = await this.queue.count()
    logger.info(`FileProcessingQueue: ${message}, count: ${count}`)
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

  async monitorProgress (taskType, func, { logContext, req }) {
    const blacklistManager = await serviceRegistry.getBlacklistManager()
    const ipfs = serviceRegistry.getIPFS()

    const uuid = logContext.requestID
    const redisKey = constructProcessKey(taskType, uuid)

    let state = { status: PROCESS_STATES.IN_PROGRESS }
    this.logStatus(logContext, `Starting ${taskType}! uuid=${uuid}}`)
    await redisClient.set(redisKey, JSON.stringify(state), 'EX', EXPIRATION)

    let response
    try {
      response = await func({ logContext }, req, ipfs, blacklistManager)
      state = { status: PROCESS_STATES.DONE, resp: response }
      this.logStatus(logContext, `Successful ${taskType}! uuid=${uuid}}`)
      await redisClient.set(redisKey, JSON.stringify(state), 'EX', EXPIRATION)
    } catch (e) {
      state = { status: PROCESS_STATES.FAILED, resp: e.message }
      this.logError(logContext, `Error with ${taskType}. uuid=${uuid}} resp=${JSON.stringify(e.message)}`)
      await redisClient.set(redisKey, JSON.stringify(state), 'EX', EXPIRATION)
      throw e
    }

    return response
  }
}

module.exports = {
  FileProcessingQueue: new FileProcessingQueue(),
  PROCESS_NAMES,
  constructProcessKey
}
