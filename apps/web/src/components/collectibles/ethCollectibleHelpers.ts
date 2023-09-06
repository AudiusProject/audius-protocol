import { gifPreview } from 'utils/imageProcessingUtil'

export const getFrameFromGif = async (url: string, name: string) => {
  const preview = await gifPreview(url)
  return URL.createObjectURL(preview)
}
