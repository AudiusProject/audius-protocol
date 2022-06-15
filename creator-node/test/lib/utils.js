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

module.exports = {
  wait,
  stringifiedDateFields,
  functionThatThrowsWithMessage,
  generateRandomCID
}
