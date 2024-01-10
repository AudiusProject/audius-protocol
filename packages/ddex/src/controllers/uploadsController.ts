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
        const uploadedBy = '' // TODO: Auth should tell us who's uploading this
        const fileBuffer = req.file.buffer
        const fileType = req.file.mimetype // Adjust based on how your file type is determined

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
    const uploads = await sql<XmlFileRow[]>`
        SELECT * FROM xml_files
        ${
          status &&
          (status === 'success' || status === 'pending' || status === 'error')
            ? sql` WHERE status = ${status}`
            : sql``
        }
        ${
          numericNextId
            ? sql` AND id < ${numericNextId} ORDER BY id DESC`
            : sql``
        }
        ${
          numericPrevId
            ? sql` AND id > ${numericPrevId} ORDER BY id ASC`
            : sql``
        }
        LIMIT ${numericLimit}
      `
    res.json(uploads)
  } catch (error) {
    console.error('Query error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getReleases =
  (sql: Sql) => async (req: Request, res: Response) => {
    const { status, nextCursor, prevCursor, limit = 10 } = req.query

    // Convert limit to a number and validate
    const numericLimit = Number(limit)
    if (!Number.isInteger(numericLimit)) {
      return res.status(400).json({ error: 'Invalid limit.' })
    }

    let whereConditions = sql``

    if (
      status &&
      (status === 'success' || status === 'processing' || status === 'error')
    ) {
      whereConditions = sql` WHERE status = ${status}`
    }

    if (nextCursor && typeof nextCursor === 'string') {
      const [nextDate, nextId] = nextCursor.split(',')
      whereConditions = sql`${whereConditions} AND (release_date, id) < (${nextDate}, ${nextId})`
    } else if (prevCursor && typeof prevCursor === 'string') {
      const [prevDate, prevId] = prevCursor.split(',')
      whereConditions = sql`${whereConditions} AND (release_date, id) > (${prevDate}, ${prevId})`
    }

    const orderBy =
      nextCursor || prevCursor
        ? sql` ORDER BY release_date ${nextCursor ? 'DESC' : 'ASC'}, id ${
            nextCursor ? 'DESC' : 'ASC'
          }`
        : sql` ORDER BY release_date DESC, id DESC`

    try {
      const releases = await sql<ReleaseRow[]>`
      SELECT * FROM releases
      ${whereConditions}
      ${orderBy}
      LIMIT ${numericLimit}
    `
      res.json(releases)
    } catch (error) {
      console.error('Query error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
