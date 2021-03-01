const si = require('systeminformation')

const getTotalMemory = async () => {
  const mem = await si.mem()
  return mem.total
}

const getUsedMemory = async () => {
  const mem = await si.mem()
  // Excluding buffers/cache
  return mem.active
}

module.exports = {
  getTotalMemory,
  getUsedMemory
}
