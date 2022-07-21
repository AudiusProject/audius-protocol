const Bull = require('bull')
const os = require('os')

const config = require('./config')
const ffmpeg = require('./ffmpeg')
const { logger: genericLogger } = require('./logging')

const TRANSCODING_MAX_CONCURRENCY = config.get('transcodingMaxConcurrency')
const MAX_ACTIVE_JOBS = config.get('maximumTranscodingActiveJobs')
const MAX_WAITING_JOBS = config.get('maximumTranscodingWaitingJobs')

// Maximum concurrency set to config var if provided
// Otherwise, uses the number of CPU cores available to node
const MAX_CONCURRENCY =
  TRANSCODING_MAX_CONCURRENCY !== -1
    ? TRANSCODING_MAX_CONCURRENCY
    : os.cpus().length

const PROCESS_NAMES = Object.freeze({
  segment: 'segment',
  transcode320: 'transcode_320'
})

const TRANSCODING_QUEUE_HISTORY = 500

class TranscodingQueue {
  constructor() {
    this.queue = new Bull('transcoding-queue', {
      redis: {
        port: config.get('redisPort'),
        host: config.get('redisHost')
      },
      defaultJobOptions: {
        removeOnComplete: TRANSCODING_QUEUE_HISTORY,
        removeOnFail: true
      }
    })
    this.logStatus('Initialized TranscodingQueue')

    // NOTE: Specifying max concurrency here dictates the max concurrency for
    // *any* process fn below
    // See https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#queueprocess
    this.queue.process(
      PROCESS_NAMES.segment,
      MAX_CONCURRENCY,
      async (job, done) => {
        const start = Date.now()
        const { fileDir, fileName, logContext } = job.data

        try {
          this.logStatus(`Segmenting ${fileDir} ${fileName}`, logContext)

          const response = await ffmpeg.segmentFile(fileDir, fileName, {
            logContext
          })
          this.logStatus(
            `Successfully completed segment job ${fileDir} ${fileName} in duration ${
              Date.now() - start
            }ms`,
            logContext
          )
          done(null, response)
        } catch (e) {
          this.logStatus(
            `Segment Job Error ${e} in duration ${Date.now() - start}ms`,
            logContext
          )
          done(e)
        }
      }
    )

    this.queue.process(
      PROCESS_NAMES.transcode320,
      /* inherited */ 0,
      async (job, done) => {
        const start = Date.now()
        const { fileDir, fileName, logContext } = job.data

        try {
          this.logStatus(
            `transcoding to 320kbps ${fileDir} ${fileName}`,
            logContext
          )

          const transcodeFilePath = await ffmpeg.transcodeFileTo320(
            fileDir,
            fileName,
            {
              logContext
            }
          )
          this.logStatus(
            `Successfully completed Transcode320 job ${fileDir} ${fileName} in duration ${
              Date.now() - start
            }ms`,
            logContext
          )
          done(null, { transcodeFilePath })
        } catch (e) {
          this.logStatus(
            `Transcode320 Job Error ${e} in duration ${Date.now() - start}`,
            logContext
          )
          done(e)
        }
      }
    )

    this.logStatus = this.logStatus.bind(this)
    this.logError = this.logError.bind(this)
    this.segment = this.segment.bind(this)
    this.transcode320 = this.transcode320.bind(this)
    this.getTranscodeQueueJobs = this.getTranscodeQueueJobs.bind(this)
    this.isAvailable = this.isAvailable.bind(this)
  }

  /**
   * Logs a successful status message and includes current queue info
   * @param {Object} logContext to create a logger.child(logContext) from
   * @param {string} message
   */
  async logStatus(message, logContext = {}) {
    const logger = genericLogger.child(logContext)
    const { waiting, active, completed, failed, delayed } =
      await this.queue.getJobCounts()
    logger.info(
      `Transcoding Queue: ${message} || active: ${active}, waiting: ${waiting}, failed ${failed}, delayed: ${delayed}, completed: ${completed} `
    )
  }

  /**
   * Logs an error status message and includes current queue info
   * @param {object} logContext to create a logger.child(logContext) from
   * @param {string} message
   */
  async logError(message, logContext = {}) {
    const logger = genericLogger.child(logContext)
    const { waiting, active, completed, failed, delayed } =
      await this.queue.getJobCounts()
    logger.error(
      `Transcoding error: ${message} || active: ${active}, waiting: ${waiting}, failed ${failed}, delayed: ${delayed}, completed: ${completed} `
    )
  }

  /**
   * Adds a task to the queue that segments up an audio file
   * @param {string} fileDir
   * @param {string} fileName
   * @param {Object} logContext to create a logger.child(logContext) from
   * @returns {Object} response in the structure 
    {
      segments: {
        fileNames: segmentFileNames {string[]}: the segment file names only, 
        filePaths: segmentFilePaths {string[]}: the segment file paths 
      },
      m3u8FilePath {string}: the m3u8 file path 
    }
   */
  async segment(fileDir, fileName, { logContext }) {
    this.logStatus(
      `Adding job to segment queue, fileDir=${fileDir}, fileName=${fileName}`,
      logContext
    )
    const job = await this.queue.add(PROCESS_NAMES.segment, {
      fileDir,
      fileName,
      logContext
    })
    this.logStatus(
      `Job added to segment queue, fileDir=${fileDir}, fileName=${fileName}`,
      logContext
    )

    const result = await job.finished()
    this.logStatus(
      `Segment job successful, fileDir=${fileDir}, fileName=${fileName}`,
      logContext
    )
    return result
  }

  /**
   * Adds a task to the queue that transcodes an audio file to 320kpbs mp3
   * @param {string} fileDir
   * @param {string} fileName
   * @param {Object} logContext to create a logger.child(logContext) from
   * @returns {Object} { transcodeFilePath {string}: where the transcode exists in the fs }
   */
  async transcode320(fileDir, fileName, { logContext }) {
    this.logStatus(
      `Adding job to transcode320 queue, fileDir=${fileDir}, fileName=${fileName}`,
      logContext
    )
    const job = await this.queue.add(PROCESS_NAMES.transcode320, {
      fileDir,
      fileName,
      logContext
    })
    this.logStatus(
      `Job added to transcode320 queue, fileDir=${fileDir}, fileName=${fileName}`,
      logContext
    )

    const result = await job.finished()
    this.logStatus(
      `Transcode320 job successful, fileDir=${fileDir}, fileName=${fileName}`,
      logContext
    )
    return result
  }

  async getTranscodeQueueJobs() {
    const queue = this.queue
    const [waiting, active] = await Promise.all([
      queue.getJobs(['waiting']),
      queue.getJobs(['active'])
    ])

    return {
      waiting: waiting.length,
      active: active.length
    }
  }

  /**
   * The max number of transcode jobs that can run at a given moment is correlated to
   * the number of cores available.
   *
   * If the number of active jobs is less than MAX_ACTIVE_JOBS, and the number of
   * waiting jobs is less than or equal to or greater MAX_WAITING_JOBS, mark the
   * TranscodingQueue as unavailable.
   *
   * @returns boolean flag if the transcode queue can accept more jobs
   */
  async isAvailable() {
    const { active, waiting } = await this.getTranscodeQueueJobs()

    return active < MAX_ACTIVE_JOBS || waiting <= MAX_WAITING_JOBS
  }
}

module.exports = new TranscodingQueue()
