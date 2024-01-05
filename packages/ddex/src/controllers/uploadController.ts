import type { XmlProcessorService } from '../services/xmlProcessorService'
import { Request, Response } from 'express'
import multer from 'multer'
import decompress from 'decompress'
import { v4 as uuidv4 } from 'uuid'

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
        const fileBuffer = req.file.buffer
        const fileType = req.file.mimetype // Adjust based on how your file type is determined

        // Save XML file to db, or unzip a ZIP file and save multiple XML files to db
        if (fileType === 'text/xml') {
          xmlProcessorService.addXmlFile(fileBuffer)
        } else if (fileType === 'application/zip') {
          const files = await decompress(fileBuffer)
          const zipFileUUID = uuidv4()
          for (const file of files) {
            if (file.path.endsWith('.xml')) {
              xmlProcessorService.addXmlFile(file.data, zipFileUUID)
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
