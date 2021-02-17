const si = require('systeminformation')

const getTotalMemory = async () => {
  const mem = await si.mem()
  return mem.total
}

const getUsedMemory = async () => {
  const mem = await si.mem()
  return mem.used
}

module.exports = {
  getTotalMemory,
  getUsedMemory
}
