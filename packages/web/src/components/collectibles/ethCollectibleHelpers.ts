import { gifPreview, imageToFrame } from 'utils/imageProcessingUtil'

export const getFrameFromGif = async (url: string) => {
  const preview = await gifPreview(url)
  // In certain situations, we may be blocked from getting a frame from the gif
  // due to CORS issues, so bail out and just return the url.
  if (preview.size === 0) {
    return url
  }
  return URL.createObjectURL(preview)
}

export const getFrameFromAnimatedWebp = async (url: string) => {
  const frame = await imageToFrame(url)
  return frame
}
