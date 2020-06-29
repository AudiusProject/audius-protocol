const Bull = require('bull')
const os = require('os')
const config = require('./config')
const ffmpeg = require('./ffmpeg')
const { logger } = require('./logging')

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
  constructor() {
    this.queue = new Bull(
      'transcoding-queue',
      {
        redis: {
          port: config.get('redisPort'),
          host: config.get('redisHost')
        }
      })

    // NOTE: Specifying max concurrency here dictates the max concurrency for
    // *any* process fn below
    // See https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#queueprocess
    this.queue.process(PROCESS_NAMES.segment, MAX_CONCURRENCY, async (job, done) => {
      const { fileDir, fileName } = job.data

      this.logStatus(`segmenting ${fileDir} ${fileName}`)

      const filePaths = await ffmpeg.segmentFile(
        fileDir,
        fileName
      )
      done(null, { filePaths })
    })

    this.queue.process(PROCESS_NAMES.transcode320, /* inherited */ 0, async (job, done) => {
      const { fileDir, fileName } = job.data

      this.logStatus(`transcoding to 320kbps ${fileDir} ${fileName}`)

      const filePath = await ffmpeg.transcodeFileTo320(
        fileDir,
        fileName
      )
      done(null, { filePath })
    })

    this.logStatus = this.logStatus.bind(this)
    this.segment = this.segment.bind(this)
    this.transcode320 = this.transcode320.bind(this)
  }

  /**
   * Logs a status message and includes current queue info
   * @param {string} message 
   */
  async logStatus(message) {
    const count = await this.queue.count()
    logger.info(`Transcoding Queue: ${message}`)
    logger.info(`Transcoding Queue: count: ${count}`)
  }

  /**
   * Adds a task to the queue that segments up an audio file
   * @param {string} fileDir
   * @param {string} fileName
   */
  async segment(fileDir, fileName) {
    const job = await this.queue.add(
      PROCESS_NAMES.segment,
      { fileDir, fileName }
    )
    const result = await job.finished()
    return result
  }

  /**
   * Adds a task to the queue that transcodes an audio file to 320kpbs mp3
   * @param {string} fileDir
   * @param {string} fileName
   */
  async transcode320(fileDir, fileName) {
    const job = await this.queue.add(
      PROCESS_NAMES.transcode320,
      { fileDir, fileName }
    )
    const result = await job.finished()
    return result
  }
}

module.exports = new TranscodingQueue()
