import express from 'express'
import { MESSAGE_HEADER, SIGNATURE_HEADER } from '../constants'
import {
  getOrCreateStemsArchiveJob,
  getStemsArchiveJob
} from '../jobs/createStemsArchive'
import { logger } from '../logger'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { basename } from 'path'

const router = express.Router()

router.post('/:trackId', async (req, res) => {
  try {
    const { trackId } = req.params
    const userId = req.query.userId as string
    const messageHeader = req.header(MESSAGE_HEADER)
    const signatureHeader = req.header(SIGNATURE_HEADER)

    if (!userId || !messageHeader || !signatureHeader) {
      return res.status(400).json({
        error: 'Missing required parameters'
      })
    }

    const jobId = await getOrCreateStemsArchiveJob({
      trackId: parseInt(trackId),
      userId: parseInt(userId),
      messageHeader,
      signatureHeader
    })

    res.status(200).json({ jobId })
  } catch (error) {
    logger.error({ error }, 'Failed to create stems archive job')
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params
    const job = await getStemsArchiveJob(jobId)

    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { returnvalue: _, ...rest } = job

    res.status(200).json(rest)
  } catch (error) {
    logger.error({ error }, 'Failed to get stems archive job')
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/download/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params
    const job = await getStemsArchiveJob(jobId)

    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    if (job.state !== 'completed') {
      return res.status(400).json({ error: 'Job is not completed' })
    }

    const { returnvalue } = job
    if (!returnvalue) {
      return res.status(400).json({ error: 'Job has no return value' })
    }

    const { outputFile } = returnvalue
    const filename = basename(outputFile)

    const stats = await stat(outputFile)

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', stats.size)

    createReadStream(outputFile)
      .on('error', (error) => {
        logger.error({ error, jobId }, 'Failed to stream archive file')
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream archive file' })
        }
      })
      .pipe(res)
  } catch (error) {
    logger.error({ error }, 'Failed to get stems archive')
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
})

export default router
