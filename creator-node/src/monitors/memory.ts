import si from 'systeminformation'
import sockstat from 'sockstat'

export const getTotalMemory = async () => {
  const mem = await si.mem()
  return mem.total
}

export const getUsedMemory = async () => {
  const mem = await si.mem()
  // Excluding buffers/cache
  return mem.active
}

export const getNodeProcessMemoryUsage = async () => {
  const mem = process.memoryUsage()
  return JSON.stringify(mem)
}

type SockStat = {
  tcp: {
    mem: number
  }
}
export const getUsedTCPMemory = async () => {
  const stats: SockStat = await sockstat.get()
  return stats.tcp.mem
}
