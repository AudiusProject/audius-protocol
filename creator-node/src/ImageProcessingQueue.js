const Bull = require('bull')
const os = require('os')
const config = require('./config')
const { logger: genericLogger } = require('./logging')
const fs = require('fs')

const imageProcessingMaxConcurrency = config.get('imageProcessingMaxConcurrency')

const PROCESS_NAMES = Object.freeze({
  resizeImage: 'resizeImage'
})

// Maximum concurrency set to config var if provided
// Otherwise, uses the number of CPU cores available to node
const MAX_CONCURRENCY = imageProcessingMaxConcurrency !== -1
  ? imageProcessingMaxConcurrency
  : os.cpus().length

class ImageProcessingQueue {
  constructor () {
    this.queue = new Bull(
      'image-processing-queue',
      {
        redis: {
          port: config.get('redisPort'),
          host: config.get('redisHost')
        }
      }
    )

    this.queue.process(
      PROCESS_NAMES.resizeImage,
      MAX_CONCURRENCY,
      __dirname + '/resizeImage.js'
    )

    this.logStatus = this.logStatus.bind(this)
    this.resizeImage = this.resizeImage.bind(this)
  }

  /**
   * Logs a status message and includes current queue info
   * @param {object} logContext to create a logger.child(logContext) from
   * @param {string} message
   */
  async logStatus (logContext, message) {
    const logger = genericLogger.child(logContext)
    const count = await this.queue.count()
    logger.info(`Image Processing Queue: ${message}`)
    logger.info(`Image Processing Queue: count: ${count}`)
  }

  // async resizeImage (buffer, maxWidth, square, filename, { logContext }) {
  //   // const x = buffer.toString()
  //   const job = await this.queue.add(
  //     PROCESS_NAMES.resizeImage,
  //     { buffer, maxWidth, square, filename, logContext }
  //   )
  //   const result = await job.finished()
  //   return result
  //   // console.log('got result', result)
  //   // return Buffer.from(result, 'binary')
  //   // const res = fs.readFileSync(result)
  //   // return res
  // }

  async resizeImage ({
    file,
    fileName,
    storagePath,
    sizes,
    square,
    logContext
  }) {
    const job = await this.queue.add(
      PROCESS_NAMES.resizeImage,
      { file, fileName, storagePath, sizes, square, logContext }
    )
    const result = await job.finished()
    return result
  }
}

module.exports = new ImageProcessingQueue()
