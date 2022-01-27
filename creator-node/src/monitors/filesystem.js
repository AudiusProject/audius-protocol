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

// We first check '/var/k8s' in case the service operator has elected to
// mount an external volume for k8s data. Otherwise, default to the root path at '/'

const getFilesystemSize = async () => {
  const fsSizes = await si.fsSize()

  let fsSize = fsSizes.find((fsSize) => fsSize.mount === '/var/k8s')
  if (!fsSize) {
    fsSize = fsSizes.find((fsSize) => fsSize.mount === '/')
  }

  return fsSize.size
}

const getFilesystemUsed = async () => {
  const fsSizes = await si.fsSize()

  let fsSize = fsSizes.find((fsSize) => fsSize.mount === '/var/k8s')
  if (!fsSize) {
    fsSize = fsSizes.find((fsSize) => fsSize.mount === '/')
  }

  return fsSize.used
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
