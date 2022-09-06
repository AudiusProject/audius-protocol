import * as Utils from '../../src/utils'

const assert = require('assert')
const _ = require('lodash')

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

const fetchDBStateForWallet = async (walletPublicKey, models) => {
  const response = {
    cnodeUser: null,
    audiusUsers: null,
    tracks: null,
    files: null,
    clockRecords: null
  }

  const cnodeUser = stringifiedDateFields(
    await models.CNodeUser.findOne({
      where: {
        walletPublicKey
      },
      raw: true
    })
  )

  if (!cnodeUser || Object.keys(cnodeUser).length === 0) {
    return response
  } else {
    response.cnodeUser = cnodeUser
  }

  const cnodeUserUUID = cnodeUser.cnodeUserUUID

  const audiusUsers = (
    await models.AudiusUser.findAll({
      where: { cnodeUserUUID },
      raw: true
    })
  ).map(stringifiedDateFields)
  response.audiusUsers = audiusUsers

  const tracks = (
    await models.Track.findAll({
      where: { cnodeUserUUID },
      raw: true
    })
  ).map(stringifiedDateFields)
  response.tracks = tracks

  const files = (
    await models.File.findAll({
      where: { cnodeUserUUID },
      raw: true
    })
  ).map(stringifiedDateFields)
  response.files = files

  const clockRecords = (
    await models.ClockRecord.findAll({
      where: { cnodeUserUUID },
      raw: true
    })
  ).map(stringifiedDateFields)
  response.clockRecords = clockRecords

  return response
}

const assertTableEquality = (tableA, tableB, comparisonOmittedFields = []) => {
  assert.deepStrictEqual(
    _.orderBy(
      tableA.map((entry) => _.omit(entry, comparisonOmittedFields)),
      ['clock'],
      ['asc']
    ),
    _.orderBy(
      tableB.map((entry) => _.omit(entry, comparisonOmittedFields)),
      ['clock'],
      ['asc']
    )
  )
}

module.exports = {
  wait,
  stringifiedDateFields,
  functionThatThrowsWithMessage,
  generateRandomCID,
  fetchDBStateForWallet,
  assertTableEquality
}
