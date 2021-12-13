const Bull = require('bull')
const os = require('os')
const config = require('./config')
const ffmpeg = require('./ffmpeg')
const { logger: genericLogger } = require('./logging')

const transcodingMaxConcurrency = config.get('transcodingMaxConcurrency')

// Maximum concurrency set to config var if provided
// Otherwise, uses the number of CPU cores available to node
const MAX_CONCURRENCY = transcodingMaxConcurrency !== -1
  ? transcodingMaxConcurrency
  : os.cpus().length

const PROCESS_NAMES = Object.freeze({
  segment: 'segment',
  transcode320: 'transcode_320'
})

class TranscodingQueue {
  constructor () {
    this.queue = new Bull(
      'transcoding-queue',
      {
        redis: {
          port: config.get('redisPort'),
          host: config.get('redisHost')
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: true
        }
      })
    this.logStatus('Successfully initialized TranscodingQueue')

    // NOTE: Specifying max concurrency here dictates the max concurrency for
    // *any* process fn below
    // See https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#queueprocess
    this.queue.process(PROCESS_NAMES.segment, MAX_CONCURRENCY, async (job, done) => {
      const start = Date.now()
      const { fileDir, fileName, logContext } = job.data

      try {
        this.logStatus(`Segmenting ${fileDir} ${fileName}`, logContext)

        const filePaths = await ffmpeg.segmentFile(
          fileDir,
          fileName,
          { logContext }
        )
        this.logStatus(`Completed segment job ${fileDir} ${fileName} in duration ${Date.now() - start}ms`, logContext)
        done(null, { filePaths })
      } catch (e) {
        this.logError(`Segment Job Error ${e} in duration ${Date.now() - start}ms`, logContext)
        done(e)
      }
    })

    this.queue.process(PROCESS_NAMES.transcode320, /* inherited */ 0, async (job, done) => {
      const start = Date.now()
      const { fileDir, fileName, logContext } = job.data

      try {
        this.logStatus(`transcoding to 320kbps ${fileDir} ${fileName}`, logContext)

        const filePath = await ffmpeg.transcodeFileTo320(
          fileDir,
          fileName,
          { logContext }
        )
        this.logStatus(`Completed Transcode320 job ${fileDir} ${fileName} in duration ${Date.now() - start}ms`, logContext)
        done(null, { filePath })
      } catch (e) {
        this.logError(`Transcode320 Job Error ${e} in duration ${Date.now() - start}`, logContext)
        done(e)
      }
    })

    this.logStatus = this.logStatus.bind(this)
    this.logError = this.logError.bind(this)
    this.segment = this.segment.bind(this)
    this.transcode320 = this.transcode320.bind(this)
    this.getTranscodeQueueJobs = this.getTranscodeQueueJobs.bind(this)
  }

  /**
   * Logs a successful status message and includes current queue info
   * @param {object} logContext to create a logger.child(logContext) from
   * @param {string} message
   */
  async logStatus (message, logContext = {}) {
    const logger = genericLogger.child(logContext)
    const { waiting, active, completed, failed, delayed } = await this.queue.getJobCounts()
    logger.info(`Transcoding Queue: ${message} || active: ${active}, waiting: ${waiting}, failed ${failed}, delayed: ${delayed}, completed: ${completed} `)
  }

  /**
   * Logs an error status message and includes current queue info
   * @param {object} logContext to create a logger.child(logContext) from
   * @param {string} message
   */
  async logError (message, logContext = {}) {
    const logger = genericLogger.child(logContext)
    const { waiting, active, completed, failed, delayed } = await this.queue.getJobCounts()
    logger.error(`Transcoding error: ${message} || active: ${active}, waiting: ${waiting}, failed ${failed}, delayed: ${delayed}, completed: ${completed} `)
  }

  /**
   * Adds a task to the queue that segments up an audio file
   * @param {string} fileDir
   * @param {string} fileName
   * @param {object} logContext to create a logger.child(logContext) from
   */
  async segment (fileDir, fileName, { logContext }) {
    this.logStatus(`Adding job to segment queue, fileDir=${fileDir}, fileName=${fileName}`, logContext)
    const job = await this.queue.add(
      PROCESS_NAMES.segment,
      { fileDir, fileName, logContext }
    )
    this.logStatus(`Job added to segment queue, fileDir=${fileDir}, fileName=${fileName}`, logContext)

    const result = await job.finished()
    this.logStatus(`Segment job successful, fileDir=${fileDir}, fileName=${fileName}`, logContext)
    return result
  }

  /**
   * Adds a task to the queue that transcodes an audio file to 320kpbs mp3
   * @param {string} fileDir
   * @param {string} fileName
   * @param {object} logContext to create a logger.child(logContext) from
   */
  async transcode320 (fileDir, fileName, { logContext }) {
    this.logStatus(`Adding job to transcode320 queue, fileDir=${fileDir}, fileName=${fileName}`, logContext)
    const job = await this.queue.add(
      PROCESS_NAMES.transcode320,
      { fileDir, fileName, logContext }
    )
    this.logStatus(`Job added to transcode320 queue, fileDir=${fileDir}, fileName=${fileName}`, logContext)
    const result = await job.finished()
    this.logStatus(`Transcode320 job successful, fileDir=${fileDir}, fileName=${fileName}`, logContext)
    return result
  }

  async getTranscodeQueueJobs () {
    const queue = this.queue
    const [
      waiting,
      active
    ] = await Promise.all([
      queue.getJobs(['waiting']),
      queue.getJobs(['active'])
    ])

    return {
      waiting: waiting.length,
      active: active.length
    }
  }
}

module.exports = new TranscodingQueue()
