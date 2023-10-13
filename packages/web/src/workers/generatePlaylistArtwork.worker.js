/* globals Jimp */

export default () => {
  /**
   * Given 4 images, return a new image with each image taking up the four corners
   */
  const generatePlaylistArtwork = ({ imageUrls }) => {
    const canvasWidth = 1000 // Adjust the width and height as per your requirements
    const canvasHeight = 1000
    const imageWidth = canvasWidth / 2
    const imageHeight = canvasHeight / 2

    const images = imageUrls.map((url) => Jimp.read(url))
    const newImage = new Jimp(canvasWidth, canvasHeight)

    images.unshift(newImage)

    Promise.all(images).then((images) => {
      let newImage = images.shift()

      if (images.length === 1) {
        newImage = images[0]
      } else {
        // Resize and position the images
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

      const mimeType = 'image/jpeg'
      newImage.getBufferAsync(mimeType).then((buffer) => {
        // eslint-disable-next-line
        let convertedBlob = new self.Blob([buffer], { type: mimeType })
        // eslint-disable-next-line
        postMessage(convertedBlob)
      })
    })
  }

  // eslint-disable-next-line
  self.addEventListener('message', (e) => {
    if (!e) return
    generatePlaylistArtwork(JSON.parse(e.data))
  })
}
