import { WorkerServices } from '../services'

export const createUtils = (services: WorkerServices) => {
  const { archiver, config, fetch, fs, fsSync, path, logger } = services
  const fileExists = async (path: string) => {
    return await fs.access(path).then(
      () => true,
      () => false
    )
  }

  const downloadFile = async ({
    url,
    filePath,
    jobId,
    signal
  }: {
    url: string
    filePath: string
    jobId: string
    signal?: AbortSignal
  }): Promise<string> => {
    logger.info({ jobId, url, filePath }, 'Downloading stem file')

    const { ok, body, statusText } = await fetch(url, {
      signal
    })

    if (!ok) {
      throw new Error(`Failed to download stem: ${statusText}`)
    }

    if (!body) {
      throw new Error('Response body is null')
    }

    const fileStream = fsSync.createWriteStream(filePath)
    await new Promise((resolve, reject) => {
      body.pipe(fileStream)
      body.on('error', reject)
      fileStream.on('finish', resolve)
    })

    return filePath
  }

  const removeTempFiles = async (jobId: string) => {
    const jobTempDir = path.join(config.archiverTmpDir, jobId)
    if (await fileExists(jobTempDir)) {
      await fs.rm(jobTempDir, { recursive: true, force: true })
    }
  }

  const createArchive = async ({
    files,
    jobId,
    archiveName,
    signal
  }: {
    files: string[]
    jobId: string
    archiveName: string
    signal?: AbortSignal
  }): Promise<string> => {
    const jobTempDir = path.join(config.archiverTmpDir, jobId)
    const outputPath = path.join(jobTempDir, archiveName)

    const output = fsSync.createWriteStream(outputPath)
    const archive = archiver('zip', {
      zlib: { level: 6 }
    })

    try {
      // Set up cancellation handler
      if (signal) {
        signal.addEventListener('abort', () => {
          archive.abort()
        })
      }

      // Listen for archive errors
      archive.on('error', (error: Error) => {
        throw error
      })

      // Pipe archive data to the output file
      archive.pipe(output)

      // Add each file to the archive with a flattened filename
      for (const file of files) {
        const filename = path.basename(file)
        archive.file(file, { name: filename })
      }

      // Wait for the output stream to finish
      // Archiver docs recommend attaching these listeners before calling finalize
      const finishPromise = new Promise((resolve, reject) => {
        output.on('close', resolve)
        output.on('error', reject)
      })

      // Finalize the archive
      await archive.finalize()
      await finishPromise

      return outputPath
    } finally {
      output.destroy()
      archive.destroy()
    }
  }

  return {
    createArchive,
    downloadFile,
    fileExists,
    removeTempFiles
  }
}
