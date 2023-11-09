import { logger } from '../logger'

export type MemoryStats = {
  heapTotal: string
  heapUsed: string
  heapAvailable: string
  external: string
  rss: string
}

export const logMemStats = () => {
  const stats = getMemStats()
  const logFmt = (key: string, val: string) => logger.info(`${key}: ${val}MB`)
  logFmt('Heap Total', stats.heapTotal)
  logFmt('Heap Used', stats.heapUsed)
  logFmt('Heap Available', stats.heapAvailable)
  logFmt('External', stats.external)
  logFmt('RSS', stats.rss)
}

export const getMemStats = (): MemoryStats => {
  const memoryUsage = process.memoryUsage()
  const bytesToMb = 1024 * 1024
  const convert = (bytes: number): string => (bytes / bytesToMb).toFixed(2)
  const heapTotal = convert(memoryUsage.heapTotal)
  const heapUsed = convert(memoryUsage.heapUsed)
  const heapAvailable = (
    parseFloat(heapTotal) - parseFloat(heapUsed)
  ).toString()
  const external = convert(memoryUsage.external)
  const rss = convert(memoryUsage.rss)
  return {
    heapAvailable,
    heapTotal,
    heapUsed,
    external,
    rss
  }
}
