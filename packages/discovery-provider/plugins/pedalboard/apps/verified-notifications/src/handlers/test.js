import { isOldUpload } from './tracks.js'

const oldDate = 'Thu Nov 05 2020 20:36:07 GMT-0600'
const isOld = isOldUpload(oldDate)

const newDate = new Date().getTime() // uploaded right now
const isNew = isOldUpload(newDate)

if (!isOld) {
  throw new Error('failed')
}

if (isNew) {
  throw new Error('failed here')
}
