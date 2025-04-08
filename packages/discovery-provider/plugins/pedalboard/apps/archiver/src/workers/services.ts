import { Config, readConfig } from '../config'
import { getAudiusSdk } from '../sdk'
import { SpaceManager, createSpaceManager } from './spaceManager'
import fs from 'fs/promises'
import fsSync from 'fs'
import { Logger, logger } from '../logger'
import path from 'path'
import archiver from 'archiver'
import fetch from 'node-fetch'

export type WorkerServices = {
  archiver: typeof archiver
  config: Config
  fetch: typeof fetch
  spaceManager: SpaceManager
  fs: typeof fs
  fsSync: typeof fsSync
  path: typeof path
  sdk: ReturnType<typeof getAudiusSdk>
  logger: Logger
}

export const createDefaultWorkerServices = (): WorkerServices => {
  const config = readConfig()
  const spaceManager = createSpaceManager({
    maxSpaceBytes: config.maxDiskSpaceBytes,
    logger
  })
  const sdk = getAudiusSdk()
  return {
    archiver,
    config,
    fetch,
    fs,
    fsSync,
    logger,
    path,
    sdk,
    spaceManager
  }
}
