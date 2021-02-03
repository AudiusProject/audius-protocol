const si = require('systeminformation')
const disk = require('diskusage')
const DiskManager = require('../diskManager')

const getStoragePathSize = async () => {
  const storagePath = DiskManager.getConfigStoragePath()
  const { total } = await disk.check(storagePath)
  return total
}

const getStoragePathUsed = async () => {
  const storagePath = DiskManager.getConfigStoragePath()
  const { available, total } = await disk.check(storagePath)
  return total - available
}

const getFilesystemSize = async () => {
  const fsSize = await si.fsSize()
  return fsSize[0].size
}

const getFilesystemUsed = async () => {
  const fsSize = await si.fsSize()
  return fsSize[0].used
}

// TODO: Determine how to compute IOPS -- `systeminformation`
// doesn't handle this gracefully when containerized.
//
// const getFilesystemReadsPerSec = async () => {
//   const fsStats = await si.fsStats()
//   return fsStats.rx_sec
// }
// const getFilesystemWritesPerSec = async () => {
//   const fsStats = await si.fsStats()
//   return fsStats.wx_sec
// }

const getMaxFileDescriptors = async () => {
  const fsOpenFiles = await si.fsOpenFiles()
  return fsOpenFiles.max
}

const getAllocatedFileDescriptors = async () => {
  const fsOpenFiles = await si.fsOpenFiles()
  return fsOpenFiles.allocated
}

module.exports = {
  getStoragePathSize,
  getStoragePathUsed,
  getFilesystemSize,
  getFilesystemUsed,
  getMaxFileDescriptors,
  getAllocatedFileDescriptors
}
