const { rehydrateIpfsFromFsIfNecessary, rehydrateIpfsDirFromFsIfNecessary } = require('./utils')
const { logger: genericLogger } = require('./logging')

const PROCESS_NAMES = Object.freeze({
  rehydrate_dir: 'rehydrate_dir',
  rehydrate_file: 'rehydrate_file'
})

module.exports = async (job) => {
  const { logContext } = job.data
  const logger = genericLogger.child(logContext)

  const taskName = job.name

  switch (taskName) {
    case PROCESS_NAMES.rehydrate_file: {
      const { multihash, storagePath, filename } = job.data
      try {
        await rehydrateIpfsFromFsIfNecessary(multihash, storagePath, logContext, filename)
        return Promise.resolve()
      } catch (e) {
        logger.error(`Error with processing a rehydrateIpfsFromFsIfNecessary task for ${multihash}: ${e}`)
        return Promise.reject(e)
      }
    }

    case PROCESS_NAMES.rehydrate_dir: {
      const { multihash } = job.data
      try {
        await rehydrateIpfsDirFromFsIfNecessary(multihash, logContext)
        return Promise.resolve()
      } catch (e) {
        logger.error(`Error with processing a rehydrateIpfsDirFromFsIfNecessary task for ${multihash}: ${e}`)
        return Promise.reject(e)
      }
    }

    default: {
      logger.error(`[RehydrateIpfsQueue] Unfamiliar task ${taskName}.`)
    }
  }
}
