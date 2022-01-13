import jsmediatags from 'jsmediatags'

import * as schemas from 'schemas'
import { resizeImage } from 'utils/imageProcessingUtil'

const ALLOWED_MAX_AUDIO_SIZE_BYTES = 250 * 1000 * 1000

const ALLOWED_AUDIO_FILE_EXTENSIONS = [
  'mp2',
  'mp3',
  // mp4
  'mp4',
  'm4a',
  'm4p',
  'm4b',
  'm4r',
  'm4v',
  // wave file extensiosn
  'wav',
  'wave',
  // flac file extensiosn
  'flac',
  // aiff file extensiosn
  'aif',
  'aiff',
  'aifc',
  // Ogg file extensiosn
  'ogg',
  'ogv',
  'oga',
  'ogx',
  'ogm',
  'spx',
  'opus',
  // aac
  '3gp',
  'aac',
  // amr
  'amr',
  '3ga',
  // amrwb
  'awb',
  // xwma
  'xwma',
  // webm
  'webm',
  // mpegts
  'ts',
  'tsv',
  'tsa'
]

const ALLOWED_AUDIO_FILE_MIME = /^audio/

const readMediaTags = (file: File): Promise<any> => {
  return new Promise(function (resolve, reject) {
    jsmediatags.read(file, {
      onSuccess: function (tag: any) {
        let tags
        if (tag && tag.tags) {
          tags = tag.tags
        }
        resolve(tags)
      },
      onError: function (error) {
        reject(error)
      }
    })
  })
}

const createArtwork = async (selectedFiles: File[]) => {
  const file = selectedFiles[0]
  const convertedBlob = await resizeImage(file)
  if (!convertedBlob) throw new Error(`Unable to process image file`)
  const artwork = new File([convertedBlob], 'Artwork')
  const createdUrl = URL.createObjectURL(convertedBlob)
  return { file: artwork, url: createdUrl }
}

export const processFiles = (
  selectedFiles: File[],
  isStem: boolean,
  handleInvalid: (fileName: string, errorType: 'size' | 'type') => void
) => {
  return selectedFiles.map(async file => {
    if (file.size > ALLOWED_MAX_AUDIO_SIZE_BYTES) {
      handleInvalid(file.name, 'size')
      return null
    }
    // Check file extension (heuristic for failure)
    if (
      !ALLOWED_AUDIO_FILE_EXTENSIONS.some(ext =>
        file.name.trim().toLowerCase().endsWith(ext)
      )
    ) {
      handleInvalid(file.name, 'type')
      return null
    }
    // If the mime type is somehow undefined or it doesn't begin with audio/ reject.
    // Backend will try to match on mime again and if it's not an audio/ match, it'll error
    if (file.type && !file.type.match(ALLOWED_AUDIO_FILE_MIME)) {
      handleInvalid(file.type, 'type')
      return null
    }
    const title = file.name.replace(/\.[^/.]+$/, '') // strip file extension
    let artwork = { file: null, url: '' }
    try {
      const tags = await readMediaTags(file)
      if (tags && tags.picture) {
        const dataArray = new Uint8Array(tags.picture.data)
        const blob = new window.Blob([dataArray])
        const artworkFile = new File([blob], 'Artwork', {
          type: tags.picture.format
        })
        // @ts-ignore
        artwork = await createArtwork([artworkFile])
      }
    } catch (error) {
      // Unable to read tags, but continue on anyways
      console.warn(
        `Unable to parse tags from uploaded track: ${title}\n NOTE: if a picture was attached to the track, it will not be added`,
        error
      )
    }
    const audio = new Audio()
    // @ts-ignore
    audio.src = file.preview
    return {
      file: file,
      preview: audio,
      metadata: schemas.newTrackMetadata({
        title: title,
        artwork: artwork
      })
    }
  })
}
