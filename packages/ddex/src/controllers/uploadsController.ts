import type { Sql } from 'postgres'
import type { XmlProcessorService } from '../services/xmlProcessorService'
import { Request, Response } from 'express'
import multer from 'multer'
import decompress from 'decompress'
import { v4 as uuidv4 } from 'uuid'
import { ReleaseRow, XmlFileRow } from '../models/dbTypes'

const upload = multer({ storage: multer.memoryStorage() })

export const postUploadXml = (xmlProcessorService: XmlProcessorService) => {
  return async (req: Request, res: Response) => {
    upload.single('file')(req, res, async (err: any) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' })
      }

      try {
        const uploadedBy = req.body.uploadedBy
        const fileBuffer = req.file.buffer
        const fileType = req.file.mimetype

        // Save XML file to db, or unzip a ZIP file and save multiple XML files to db
        if (fileType === 'text/xml') {
          xmlProcessorService.addXmlFile(fileBuffer, uploadedBy)
        } else if (fileType === 'application/zip') {
          const files = await decompress(fileBuffer)
          const zipFileUUID = uuidv4()
          for (const file of files) {
            if (file.path.endsWith('.xml')) {
              xmlProcessorService.addXmlFile(file.data, uploadedBy, zipFileUUID)
            }
          }
        } else {
          return res.status(400).json({ error: 'Unsupported file type.' })
        }

        res.json({ message: 'File uploaded and processed successfully.' })
      } catch (error: any) {
        return res.status(500).json({ error: error.message })
      }
    })
  }
}

export const getUploads = (sql: Sql) => async (req: Request, res: Response) => {
  const { status, nextId, prevId, limit = '10' } = req.query

  const numericLimit = Number(limit)
  const numericNextId = Number(nextId || 0)
  const numericPrevId = Number(prevId || 0)

  if ((nextId && isNaN(numericNextId)) || (prevId && isNaN(numericPrevId))) {
    return res.status(400).json({ error: 'Invalid pagination parameters.' })
  }

  if (!Number.isInteger(numericLimit)) {
    return res.status(400).json({ error: 'Invalid limit.' })
  }

  try {
    let statusCondition = sql`true`
    if (
      status &&
      (status === 'success' || status === 'pending' || status === 'error')
    ) {
      statusCondition = sql`status = ${status}`
    }

    let cursorCondition = sql`true`
    if (numericNextId) cursorCondition = sql`id > ${numericNextId}`
    else if (numericPrevId) cursorCondition = sql`id < ${numericPrevId}`

    const uploads = await sql<XmlFileRow[]>`
      SELECT * FROM xml_files
      WHERE ${statusCondition}
      AND ${cursorCondition}
      ORDER BY id DESC
      LIMIT ${numericLimit}
    `

    let hasMoreNext = false
    let hasMorePrev = false
    if (uploads.length > 0) {
      const maxId = uploads[0].id
      const minId = uploads[uploads.length - 1].id

      const nextSet =
        await sql`SELECT id FROM xml_files WHERE id > ${maxId} LIMIT 1`
      hasMoreNext = nextSet.length > 0

      const prevSet =
        await sql`SELECT id FROM xml_files WHERE id < ${minId} LIMIT 1`
      hasMorePrev = prevSet.length > 0
    }

    res.json({ uploads, hasMoreNext, hasMorePrev })
  } catch (error) {
    console.error('Query error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getReleases =
  (sql: Sql) => async (req: Request, res: Response) => {
    const { status, nextCursor, prevCursor, limit = 10 } = req.query

    const numericLimit = Number(limit)
    if (!Number.isInteger(numericLimit)) {
      return res.status(400).json({ error: 'Invalid limit.' })
    }

    let statusCondition = sql`true`
    if (
      status &&
      (status === 'success' || status === 'processing' || status === 'error')
    ) {
      statusCondition = sql`status = ${status}`
    }

    let cursorCondition = sql`true`
    let orderBy = sql`ORDER BY release_date DESC, id DESC`
    if (nextCursor && typeof nextCursor === 'string') {
      const [nextDate, nextId] = nextCursor.split(',')
      cursorCondition = sql`(release_date, id) > (${nextDate}, ${nextId})`
      orderBy = sql`ORDER BY release_date ASC, id ASC`
    } else if (prevCursor && typeof prevCursor === 'string') {
      const [prevDate, prevId] = prevCursor.split(',')
      cursorCondition = sql`(release_date, id) < (${prevDate}, ${prevId})`
    }

    try {
      const releases = await sql<ReleaseRow[]>`
        SELECT * FROM releases
        WHERE ${statusCondition}
        AND ${cursorCondition}
        ${orderBy}
        LIMIT ${numericLimit}
      `

      let hasMoreNext = false
      let hasMorePrev = false
      if (releases.length > 0) {
        if (nextCursor && typeof nextCursor === 'string') releases.reverse()
        const maxRelease = releases[0]
        const minRelease = releases[releases.length - 1]

        const nextSet =
          await sql`SELECT id FROM releases WHERE (release_date, id) > (${maxRelease.release_date}, ${maxRelease.id}) LIMIT 1`
        hasMoreNext = nextSet.length > 0

        const prevSet =
          await sql`SELECT id FROM releases WHERE (release_date, id) < (${minRelease.release_date}, ${minRelease.id}) LIMIT 1`
        hasMorePrev = prevSet.length > 0
      }

      res.json({ releases, hasMoreNext, hasMorePrev })
    } catch (error) {
      console.error('Query error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
