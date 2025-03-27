import { WorkerServices } from './services'

export const ensureTempDirectory = async (services: WorkerServices) => {
  const { fs, path, config } = services
  const tempDir = path.join(config.archiverTmpDir)
  await fs.mkdir(tempDir, { recursive: true })
}
