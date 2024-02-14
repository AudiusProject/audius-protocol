import { uuid } from '@audius/common/utils'
import Jimp from 'jimp'
import RNFetchBlob from 'rn-fetch-blob'

const {
  fs: { dirs, writeFile }
} = RNFetchBlob

const canvasWidth = 1000 // Adjust the width and height as per your requirements
const canvasHeight = 1000
const imageWidth = canvasWidth / 2
const imageHeight = canvasHeight / 2

const mimeType = Jimp.MIME_JPEG

export async function generatePlaylistArtwork(imageUrls: string[]) {
  const images = await Promise.all(
    imageUrls.map((imageUrl) => Jimp.read(imageUrl))
  )

  let newImage: Jimp

  if (images.length === 1) {
    newImage = images[0]
  } else {
    newImage = new Jimp(canvasWidth, canvasHeight)

    for (let i = 0; i < 4; i++) {
      const image = images[i]
      if (image) {
        image.resize(imageWidth, imageHeight)

        // Calculate the x and y position based on the quadrant
        const x = i % 2 === 0 ? 0 : imageWidth
        const y = i < 2 ? 0 : imageHeight

        // Composite the image onto the canvas
        newImage.composite(image, x, y)
      }
    }
  }

  const fileName = uuid()
  const url = `${dirs.CacheDir}/${fileName}.jpg`
  const imageContents = await newImage.getBase64Async(mimeType)
  const [, base64Contents] = imageContents.split(',')
  await writeFile(url, base64Contents, 'base64')

  return {
    url,
    file: { uri: url, name: fileName, type: mimeType } as unknown as File
  }
}
