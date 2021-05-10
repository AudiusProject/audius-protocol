const heapdump = require('heapdump')
const { logger } = require('../logging')
const config = require('../config')

const FIVE_MINUTES = 1000 * 60 * 5
let dumpDebounce = false

const dump = () => {
  const ts = Date.now()
  const endpoint = config.get('creatorNodeEndpoint').split('//')[1]
  const file = `./${endpoint}-${ts}.heapsnapshot`

  if (!dumpDebounce) {
    logger.info(`Taking heap dump at ${ts}`)
    // this is a synchronous operation
    heapdump.writeSnapshot(file)
    dumpDebounce = true

    setTimeout(() => {
      dumpDebounce = false
    }, FIVE_MINUTES)
  } else {
    logger.error(`Cannot take heap dump at ${ts} -- latest one too recent`)
  }

  return file
}

module.exports = {
  dump
}
