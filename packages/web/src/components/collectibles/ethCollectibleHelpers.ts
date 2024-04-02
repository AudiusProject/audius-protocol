import { gifPreview, imageToFrame } from 'utils/imageProcessingUtil'

export const getFrameFromGif = async (url: string) => {
  const preview = await gifPreview(url)
  return URL.createObjectURL(preview)
}

export const getFrameFromAnimatedWebp = async (url: string) => {
  const frame = await imageToFrame(url)
  return frame
}
