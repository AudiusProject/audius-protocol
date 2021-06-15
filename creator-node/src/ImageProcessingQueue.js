const Bull = require('bull')
const os = require('os')
const config = require('./config')
const { logger: genericLogger } = require('./logging')

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
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: true
        }
      }
    )

    /**
     * Queue will process tasks concurrently if provided a concurrency number and a
     *    path to file containing job processor function
     * https://github.com/OptimalBits/bull/tree/013c51942e559517c57a117c27a550a0fb583aa8#separate-processes
     */
    this.queue.process(
      PROCESS_NAMES.resizeImage /** job processor name */,
      MAX_CONCURRENCY /** job processor concurrency */,
      `${__dirname}/resizeImage.js` /** path to job processor function */
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

  /**
   * Resizes a given image into the options provided and
   * writes the results to file storage
   * @param {string} path to the image file
   * @param {string} fileName name of the original file
   * @param {object<string, number>} sizes
   * @param {string} sizes.key the name of the sized file e.g. 150x150.jpg
   * @param {number} sizes.value the maxWidth resize the image to, e.g. 1000
   * @param {boolean} square whether or not to "square" the image when resizing
   * @param {object} logContext the req.logContext
   *
   * @return {object} { dir, files }
   *   dir: {
   *     dirCID: string
   *     dirDestPath: string
   *   }
   *   files: [
   *     {
   *       multihash: string
   *       sourceFile: string
   *       storagePath: string
   *     }
   *   ]
   */
  async resizeImage ({
    file,
    fileName,
    sizes,
    square,
    logContext
  }) {
    const job = await this.queue.add(
      PROCESS_NAMES.resizeImage,
      { file, fileName, sizes, square, logContext }
    )
    const result = await job.finished()
    return result
  }
}

module.exports = new ImageProcessingQueue()
