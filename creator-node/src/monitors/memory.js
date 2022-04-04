const si = require('systeminformation')
const sockstat = require('sockstat')

const getTotalMemory = async () => {
  const mem = await si.mem()
  return mem.total
}

const getUsedMemory = async () => {
  const mem = await si.mem()
  // Excluding buffers/cache
  return mem.active
}

const getNodeProcessMemoryUsage = async () => {
  const mem = process.memoryUsage()
  return JSON.stringify(mem)
}

const getUsedTCPMemory = async () => {
  const stats = await sockstat.get()
  return stats.tcp.mem
}

module.exports = {
  getTotalMemory,
  getUsedMemory,
  getNodeProcessMemoryUsage,
  getUsedTCPMemory
}
