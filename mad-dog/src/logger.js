const winston = require('winston')
const path = require('path')

const myformat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.align(),
  winston.format.printf(
    info => `${info.timestamp} ${info.level}: ${info.message}`
  )
)

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      format: myformat,
      timestamp: true
    })
  ]
})

/**
 * Adds a file logger transport. Returns a function that removes the file logger when called.
 * @param {string} fileName
 */
const addFileLogger = fileName => {
  const filename = path.resolve(`logs/${fileName}`)
  const fileTransport = new winston.transports.File({
    filename,
    timestamp: true
  })
  logger.add(fileTransport)
  return () => {
    logger.remove(fileTransport)
  }
}

module.exports = {
  logger,
  addFileLogger
}
