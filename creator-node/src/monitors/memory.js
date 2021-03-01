const si = require('systeminformation')
const { dump } = require('../utils/heapdump')

const getTotalMemory = async () => {
  const mem = await si.mem()
  return mem.total
}

const getUsedMemory = async () => {
  const mem = await si.mem()
  if (mem.active / mem.total > 0.5) {
    dump()
  }

  // Excluding buffers/cache
  return mem.active
}

const getNodeProcessMemoryUsage = async () => {
  const mem = process.memoryUsage()
  return JSON.stringify(mem)
}

module.exports = {
  getTotalMemory,
  getUsedMemory,
  getNodeProcessMemoryUsage
}
