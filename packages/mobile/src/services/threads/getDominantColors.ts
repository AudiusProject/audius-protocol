import type { Color } from '@audius/common'
import { Thread } from 'react-native-threads'

const dominantColorsThread = new Thread('threads/dominantColors.thread.js')

export const getDominantColors = (imageUrl: string) => {
  dominantColorsThread.postMessage(imageUrl)

  return new Promise<Color[]>((resolve) => {
    dominantColorsThread.onmessage = (dominantColorsStr: string) => {
      const dominantColors = JSON.parse(dominantColorsStr)
      resolve(dominantColors)
    }
  })
}
