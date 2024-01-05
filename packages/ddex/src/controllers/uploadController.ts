import { Request, Response } from 'express'
import fs from 'fs'
import { DOMParser } from 'linkedom'
import multer from 'multer'
import type {
  AudiusSdk as AudiusSdkType,
  Genre,
  UploadTrackRequest,
} from '@audius/sdk/dist/sdk/index.d.ts'

const upload = multer({ dest: 'uploads/' })

const queryAll = (node: any, ...fields: string[]) => {
  for (const field of fields) {
    const hits = node.querySelectorAll(field)
    if (hits.length) return Array.from(hits)
  }
  return []
}

const firstValue = (node: any, ...fields: string[]) => {
  for (const field of fields) {
    const hit = node.querySelector(field)
    if (hit) return hit.textContent.trim()
  }
}

const processXml = async (document: any, audiusSdk: AudiusSdkType) => {
  // extract SoundRecording
  const trackNodes = queryAll(document, 'SoundRecording', 'track')

  for (const trackNode of Array.from(trackNodes)) {
    const releaseDateValue = firstValue(
      trackNode,
      'OriginalReleaseDate',
      'originalReleaseDate'
    )
    const title = firstValue(trackNode, 'TitleText', 'trackTitle')
    const tt = {
      title,

      // todo: need to normalize genre
      // genre: firstValue(trackNode, "Genre", "trackGenre"),
      genre: 'Metal' as Genre,

      // todo: need to parse release date if present
      releaseDate: new Date(releaseDateValue as string | number | Date),
      // releaseDate: new Date(),

      isUnlisted: false,
      isPremium: false,
      fieldVisibility: {
        genre: true,
        mood: true,
        tags: true,
        share: true,
        play_count: true,
        remixes: true,
      },
      description: '',
      license: 'Attribution ShareAlike CC BY-SA',
    }
    const artistName = firstValue(trackNode, 'ArtistName', 'artistName')
    const { data: users } = await audiusSdk.users.searchUsers({
      query: artistName,
    })
    if (!users || users.length === 0) {
      throw new Error(`Could not find user ${artistName}`)
    }
    const userId = users[0].id
    const uploadTrackRequest: UploadTrackRequest = {
      userId: userId,
      // TODO replace with actual img file from upload request
      coverArtFile: {
        buffer: await fs.promises.readFile('examples/clipper.jpg'),
        name: 'todo_file_name',
      },
      metadata: tt,
      onProgress: (progress: any) => console.log('Progress:', progress),
      // TODO replace with actual audio file from upload request
      trackFile: {
        buffer: await fs.promises.readFile('examples/snare.wav'),
        name: 'todo_track_file_name',
      },
    }
    console.log('uploading track...')
    const result = await audiusSdk.tracks.uploadTrack(uploadTrackRequest)
    console.log(result)
  }

  // todo
  // extract Release
  // for (const releaseNode of queryAll(document, "Release", "release")) {
  // }
}

export const postUploadXml =
  (dbService: any, audiusSdk: AudiusSdkType) =>
  (req: Request, res: Response) => {
    upload.single('file')(req, res, async (err: any) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' })
      }

      try {
        const filePath = req.file.path
        const xmlText = await fs.promises.readFile(filePath)
        const document = new DOMParser().parseFromString(
          xmlText.toString(),
          'text/xml'
        )
        await processXml(document, audiusSdk)

        // TODO: Persist the upload in DB

        res.json({ message: 'File uploaded and processed successfully.' })
      } catch (err: any) {
        return res.status(500).json({ error: err })
      }
    })
  }
