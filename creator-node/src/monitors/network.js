const si = require('systeminformation')

const getReceivedBytesPerSec = async () => {
  const networkStats = await si.networkStats()
  return networkStats[0].rx_sec
}

const getTransferredBytesPerSec = async () => {
  const networkStats = await si.networkStats()
  return networkStats[0].tx_sec
}

module.exports = {
  getReceivedBytesPerSec,
  getTransferredBytesPerSec
}
