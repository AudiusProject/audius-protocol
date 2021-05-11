const heapdump = require('heapdump')
const { logger } = require('../logging')
const config = require('../config')

const dump = () => {
  const ts = Date.now()
  const endpoint = config.get('creatorNodeEndpoint').split('//')[1]
  const file = `./${endpoint}-${ts}.heapsnapshot`

  try {
    heapdump.writeSnapshot(file)
  } catch (e) {
    logger.error(`Could not take heapdump: ${e.message}`)
  }

  return file
}

module.exports = {
  dump
}
