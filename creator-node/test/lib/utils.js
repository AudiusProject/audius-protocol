const { logger: genericLogger } = require('../../src/logging')
const Utils = require('../../src/utils')

const stringifiedDateFields = (obj) => {
  const newObj = { ...obj }
  if (newObj.createdAt) newObj.createdAt = newObj.createdAt.toISOString()
  if (newObj.updatedAt) newObj.updatedAt = newObj.updatedAt.toISOString()
  return newObj
}

const wait = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

const functionThatThrowsWithMessage = (errorMessage) => {
  return function throwTestingError() {
    throw new Error(errorMessage)
  }
}

/**
 * Generates a fake CID (length: 46) with the letter 'a' and suffix of a random number of n digits
 * Example: Qmaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa12345
 *
 * Reference:
 * https://stackoverflow.com/questions/29640432/generate-4-digit-random-number-using-substring/29640472
 * @param {number} numRandomDigits number of random digits suffix
 * @param {number} maxRandomNumber the max random number
 * @returns
 */
const generateRandomCID = (numRandomDigits = 5, maxRandomNumber = 10000) => {
  // If n is out of bounds, default to 5
  if (numRandomDigits < 0 || numRandomDigits > 46) numRandomDigits = 5

  const randomNDigitNumber = (
    Array(numRandomDigits).join('0') + Utils.getRandomInt(maxRandomNumber)
  ).slice(-numRandomDigits)

  // Return Qm..aaa... of length 46. Array(..) part needs + 1 to generate the remaining amount
  return (
    'Qm' +
    Array(
      46 /* total length of cid */ - 2 /* 'Qm' prefix */ - numRandomDigits + 1
    ).join('a') +
    randomNDigitNumber
  )
}

/**
 * Deletes keys of a pattern: https://stackoverflow.com/a/36006360
 * @param {Object} param
 * @param {string} param.keyPattern the redis key pattern that matches keys to remove
 * @param {Object} param.redis the redis instance
 */
function deleteKeyPatternInRedis({
  keyPattern,
  redis,
  logger = genericLogger
}) {
  // Create a readable stream (object mode)
  const stream = redis.scanStream({
    match: keyPattern
  })
  stream.on('data', function (keys) {
    // `keys` is an array of strings representing key names
    if (keys.length) {
      const pipeline = redis.pipeline()
      keys.forEach(function (key) {
        pipeline.del(key)
      })
      pipeline.exec()
    }
  })
  stream.on('end', function () {
    logger.info(`Done deleting ${keyPattern} entries`)
  })
  stream.on('error', function (e) {
    logger.error(`Could not delete ${keyPattern} entries: ${e.toString()}`)
  })
}

module.exports = {
  wait,
  stringifiedDateFields,
  functionThatThrowsWithMessage,
  generateRandomCID,
  deleteKeyPatternInRedis
}
