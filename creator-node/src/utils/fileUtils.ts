import isMp3 from 'is-mp3'
import readChunk from 'read-chunk'

const ffmpegCharCodes = Array.from('FFmpeg').map(s => s.charCodeAt(0))

export const isMp3File = async (path: string) => {
  try {
    const chunk1 = await readChunk(path, 0, 3)
    if (isMp3(chunk1)) {
      return true
    }

    // For track segments, return true if the extracted bytes read 'FFmpeg'.
    const chunk2 = await readChunk(path, 25, 6)
    return ffmpegCharCodes.every((code, i) => code === chunk2[i])
  } catch (e) {
    return false
  }
}
