const util = require('util')
const path = require('path')
const { RandomPicture } = require('random-picture')
const fetch = require('node-fetch')
const { _ } = require('lodash')
const fs = require('fs-extra')
const moment = require('moment')
const streamPipeline = util.promisify(require('stream').pipeline)
const { logger } = require('./logger.js')

const TRACK_URLS = [
    'https://royalty-free-content.s3-us-west-2.amazonaws.com/audio/Gipsy.mp3',
    'https://royalty-free-content.s3-us-west-2.amazonaws.com/audio/First+Rain.mp3',
    'https://royalty-free-content.s3-us-west-2.amazonaws.com/audio/Miracle.mp3',
    'https://royalty-free-content.s3-us-west-2.amazonaws.com/audio/Ice+Cream.mp3',
    'https://royalty-free-content.s3-us-west-2.amazonaws.com/audio/Street+Tables+Cafe.mp3',
    'https://royalty-free-content.s3-us-west-2.amazonaws.com/audio/Cowboy+Tears.mp3',
    'https://royalty-free-content.s3-us-west-2.amazonaws.com/audio/Happy.mp3'
]

/**
 * Generates random users.
 * @param {int} count
 */
 const genRandomUsers = count => _.range(count).map(x => getRandomUser())

 /**
  * Generates a single random user.
  */
 // TODO see if this can be refactored to
 // combine with getRandomUserMetadata
 const getRandomUser = () => {
   return {
     name: `name_${r6()}`,
     email: `email_${r6()}@audius.co`,
     password: `pass_${r6()}`,
     handle: `handle_${r6()}`,
     bio: `bio_${r6()}`,
     location: `loc_${r6()}`,
     is_creator: false,
     is_verified: false,
     is_deactivated: false,
     profile_picture: null,
     profile_picture_sizes: null,
     cover_photo: null,
     cover_photo_sizes: null,
     creator_node_endpoint: ''
   }
 }

 /**
  * Generates a random track.
  */
 const getRandomTrackMetadata = userId => {
   return {
     owner_id: userId,
     cover_art: null,
     cover_art_sizes: null,
     title: `title_${r6()}`,
     length: 0,
     cover_art: null,
     tags: '',
     genre: 'SomeGenre',
     mood: 'Dope',
     credits_splits: '',
     create_date: '',
     release_date: '',
     file_type: '',
     description: `description_${r6()}`,
     license: '',
     isrc: '',
     iswc: '',
     track_segments: []
   }
 }

 /**
  * Randomly selects url from TRACK_URLS, downloads track file from url to temp local storage, & returns its file path
  *
  * @notice this depends on TRACK_URLS pointing to valid urls in S3. Ideally we'd be able to
  *    randomly select any file from the parent folder.
  */
 const getRandomTrackFilePath = async localDirPath => {
   if (!fs.existsSync(localDirPath)) {
     fs.mkdirSync(localDirPath)
   }

   const trackURL = _.sample(TRACK_URLS)
   const targetFilePath = path.resolve(localDirPath, `${genRandomString(6)}.mp3`)

   const response = await fetch(trackURL)
   if (!response.ok) {
     throw new Error(`unexpected response ${response.statusText}`)
   }

   try {
     await fs.ensureDir(localDirPath)
     await streamPipeline(response.body, fs.createWriteStream(targetFilePath))

     logger.info(`Wrote track to temp local storage at ${targetFilePath}`)
   } catch (e) {
     const errorMsg = `Error with writing track to path ${localDirPath}`
     logger.error(errorMsg)
     console.error(e)
     throw new Error(`${errorMsg}: ${e.message}`)
   }

   // Return full file path
   return targetFilePath
 }

 const getRandomImageFilePath = async (localDirPath) => {
   if (!fs.existsSync(localDirPath)) {
     fs.mkdirSync(localDirPath)
   }

   const imageURL = (await RandomPicture()).url // always jpg
   const targetFilePath = path.resolve(localDirPath, `${genRandomString(6)}.jpg`)

   const response = await fetch(imageURL)
   if (!response.ok) {
     throw new Error(`unexpected response ${response.statusText}`)
   }

   try {
     await fs.ensureDir(localDirPath)
     await streamPipeline(response.body, fs.createWriteStream(targetFilePath))

     logger.info(`Wrote image to temp local storage at ${targetFilePath}`)
   } catch (e) {
     const errorMsg = `Error with writing image to path ${localDirPath}`
     logger.error(errorMsg)
     console.error(e)
     throw new Error(`${errorMsg}: ${e.message}`)
   }

   // Return full file path
   return targetFilePath
 }

 /**
  * Genererates a random string of uppercase + lowercase chars, optionally with numbers.
  * @param {*} length
  * @param {*} withNumbers
  */
 const genRandomString = (length, withNumbers = false) => {
   const lower = 'abcdefghijklmnopqrstuvwxyz'
   const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
   const numbers = '0123456789'

   const combined = (lower + upper + (withNumbers ? numbers : '')).split('')
   return _.range(length)
     .map(x => _.sample(combined))
     .join('')
 }

 const r6 = (withNum = false) => genRandomString(6, withNum)

const getRandomEmail = (root = '') => {
  const sauronSuffix = moment().format('YYMMDD') + Math.random().toString(36).substring(2, 6)
  let email
  if (root) {
    const [user, domain] = root.split('@')
    email = [user, '+', sauronSuffix, '@', domain].join('')
  } else {
    email = ['service-commands-seed', '+', sauronSuffix, '@', 'audius.co'].join('')
  }
  return email
}

const getRandomPassword = () => {
    return 'wordpass'
}

// TODO put the following in libs so it can be required in both sauron and here?
/**
 * Generates a single random user with the random suffix of
 * <spId>_<YYMMDDxxxxxx>
 * YY - year (ex.: the 21 part of 2021)
 * MM - month
 * DD - day
 * xxxxxx - random string of lowercase letters + numbers (just to ensure randomness)
 *
 * ex: 'seed_210331abc123
 * @param {string} sauronSuffix a string with the pattern YYMMDDxxxxxx
 * @returns the user metadata object
 */
 const getRandomUserMetadata = (email, password) => {
  const sauronSuffix = moment().format('YYMMDD') + Math.random().toString(36).substring(2, 6)
 return {
   name: `seed_${sauronSuffix}`,
   email,
   password,
   handle: `seed_${sauronSuffix}`,
   bio: `seed_bio_${sauronSuffix}`,
   location: `seed_loc_${sauronSuffix}`,
   is_creator: false,
   is_verified: false,
   is_deactivated: false,
   profile_picture: null,
   profile_picture_sizes: null,
   cover_photo: null,
   cover_photo_sizes: null,
   creator_node_endpoint: ''
 }
}

 module.exports = {
    genRandomUsers,
    getRandomUser,
    getRandomTrackMetadata,
    genRandomString,
    getRandomTrackFilePath,
    getRandomImageFilePath,
    r6,
    getRandomPassword,
    getRandomEmail,
    getRandomUserMetadata
  }
