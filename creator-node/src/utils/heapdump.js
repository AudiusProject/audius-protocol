const heapdump = require('heapdump')
const { logger } = require('../logging')
const config = require('../config')

let dumpDebounce = false

const dump = () => {
  const ts = Date.now()
  const endpoint = config.get('creatorNodeEndpoint').split('//')[1]
  const file = `./${endpoint}-${ts}.heapsnapshot`
  if (!dumpDebounce) {
    dumpDebounce = true
    logger.info(`Taking heap dump at ${ts}`)
    heapdump.writeSnapshot(file)
    setTimeout(() => {
      dumpDebounce = false
    }, 1000 * 60 * 5)
  } else {
    logger.info(`Cannot take heap dump at ${ts} -- latest one too recent`)
  }
  return file
}

module.exports = {
  dump
}
