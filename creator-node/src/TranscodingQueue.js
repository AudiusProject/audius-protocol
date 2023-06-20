const { segmentFile, transcodeFileTo320 } = require('./ffmpeg')
const { Queue, QueueEvents, Worker } = require('bullmq')
const os = require('os')

const config = require('./config')
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
    const connection = {
      host: config.get('redisHost'),
      port: config.get('redisPort')
    }
    this.queue = new Queue('transcoding-queue', {
      connection,
      defaultJobOptions: {
        removeOnComplete: TRANSCODING_QUEUE_HISTORY,
        removeOnFail: TRANSCODING_QUEUE_HISTORY
      }
    })
    this.queueEvents = new QueueEvents('transcoding-queue', {
      connection
    })
    this._logStatus('Initialized TranscodingQueue')

    // disabling because `new Worker()` has side effects
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const worker = new Worker(
      'transcoding-queue',
      async (job) => {
        switch (job.name) {
          case PROCESS_NAMES.segment: {
            const start = Date.now()
            const { fileDir, fileName, logContext } = job.data

            try {
              this._logStatus(`Segmenting ${fileDir} ${fileName}`, logContext)

              const response = await segmentFile(fileDir, fileName, {
                logContext
              })
              this._logStatus(
                `Successfully completed segment job ${fileDir} ${fileName} in duration ${
                  Date.now() - start
                }ms`,
                logContext
              )
              return response
            } catch (e) {
              this._logStatus(
                `Segment Job Error ${e} in duration ${Date.now() - start}ms`,
                logContext
              )
              return e
            }
          }
          case PROCESS_NAMES.transcode320: {
            const start = Date.now()
            const { fileDir, fileName, logContext } = job.data

            try {
              this._logStatus(
                `transcoding to 320kbps ${fileDir} ${fileName}`,
                logContext
              )

              const transcodeFilePath = await transcodeFileTo320(
                fileDir,
                fileName,
                {
                  logContext
                }
              )
              this._logStatus(
                `Successfully completed Transcode320 job ${fileDir} ${fileName} in duration ${
                  Date.now() - start
                }ms`,
                logContext
              )
              return { transcodeFilePath }
            } catch (e) {
              this._logStatus(
                `Transcode320 Job Error ${e} in duration ${Date.now() - start}`,
                logContext
              )
              return e
            }
          }
        }
      },
      {
        connection,
        concurrency: MAX_CONCURRENCY
      }
    )

    this._logStatus = this._logStatus.bind(this)
    this._logError = this._logError.bind(this)
    this.segment = this.segment.bind(this)
    this.transcode320 = this.transcode320.bind(this)
    this.getTranscodeQueueJobs = this.getTranscodeQueueJobs.bind(this)
    this.isAvailable = this.isAvailable.bind(this)
  }

  /**
   * Logs a successful status message
   * @param {Object} logContext to create a logger.child(logContext) from
   * @param {string} message
   */
  _logStatus(message, logContext = {}) {
    const logger = genericLogger.child(logContext)
    logger.info(`Transcoding Queue: ${message}`)
  }

  /**
   * Logs an error status message
   * @param {object} logContext to create a logger.child(logContext) from
   * @param {string} message
   */
  _logError(message, logContext = {}) {
    const logger = genericLogger.child(logContext)
    logger.error(`Transcoding error: ${message}`)
  }

  /**
   * Adds a task to the queue that segments up an audio file
   * @param {string} fileDir
   * @param {string} fileName
   * @param {Object} logContext to create a logger.child(logContext) from
   * @returns response in the structure 
    {
      segments: {
        fileNames: segmentFileNames {string[]}: the segment file names only, 
        filePaths: segmentFilePaths {string[]}: the segment file paths 
      },
      m3u8FilePath {string}: the m3u8 file path 
    }
   */
  async segment(fileDir, fileName, { logContext }) {
    this._logStatus(
      `Adding job to segment queue, fileDir=${fileDir}, fileName=${fileName}`,
      logContext
    )
    const job = await this.queue.add(PROCESS_NAMES.segment, {
      fileDir,
      fileName,
      logContext
    })
    this._logStatus(
      `Job added to segment queue, fileDir=${fileDir}, fileName=${fileName}`,
      logContext
    )

    const result = await job.waitUntilFinished(this.queueEvents)
    this._logStatus(
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
   * @returns { transcodeFilePath {string}: where the transcode exists in the fs }
   */
  async transcode320(fileDir, fileName, { logContext }) {
    this._logStatus(
      `Adding job to transcode320 queue, fileDir=${fileDir}, fileName=${fileName}`,
      logContext
    )
    const job = await this.queue.add(PROCESS_NAMES.transcode320, {
      fileDir,
      fileName,
      logContext
    })
    this._logStatus(
      `Job added to transcode320 queue, fileDir=${fileDir}, fileName=${fileName}`,
      logContext
    )

    const result = await job.waitUntilFinished(this.queueEvents)
    this._logStatus(
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
