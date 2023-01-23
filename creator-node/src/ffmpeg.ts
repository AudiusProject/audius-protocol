import type { LogContext } from './utils'

import config from './config'
import fs from 'fs-extra'
import path from 'path'
import { logger as genericLogger } from './logging'
import { spawn } from 'child_process'
import ffmpegPath from 'ffmpeg-static'
// The typing for the ffmpeg-static model is incorrect
// so this line is here to fix that
const ffmpeg = (ffmpegPath as unknown as { path: string }).path
const uuid = require('uuid/v4')

/**
 * Segments file into equal size chunks without re-encoding.
 * Try to segment as mp3 and error on failure 
 * @date 01-27-2022
 * @param {Object} params
 * @param {string} params.fileDir the directory of the uploaded track artifact
 * @param {string} params.fileName the uploaded track artifact filename
 * @param {LogContext} params.logContext the log context used to instantiate a logger
 * @returns {Promise<Object>} response in the structure 
  {
    segments: {
      fileNames: segmentFileNames {string[]}: the segment file names only, 
      filePaths: segmentFilePaths {string[]}: the segment file paths 
    },
    m3u8FilePath {string}: the m3u8 file path 
  }
 */
export function segmentFile(
  fileDir: string,
  fileName: string,
  { logContext }: { logContext: LogContext }
) {
  const logger = genericLogger.child(logContext)

  return new Promise((resolve, reject) => {
    const absolutePath = path.resolve(fileDir, fileName)
    logger.info(`Segmenting file ${absolutePath}...`)

    const m3u8FilePath = path.resolve(fileDir, fileName.split('.')[0] + '.m3u8')

    // https://ffmpeg.org/ffmpeg-formats.html#hls-2
    const args = [
      '-i',
      absolutePath,
      '-ar',
      config.get('sampleRate'),
      '-b:a',
      config.get('bitRate'),
      '-hls_time',
      config.get('hlsTime'),
      '-hls_segment_type',
      config.get('hlsSegmentType'), // `fmp4` for MPEG-DASH - hls 7+ only
      '-hls_list_size',
      0, // write all segments to one m3u8 file
      '-hls_base_url',
      'segments/', // path hack - adds `segments` dir to m3u8 file entries
      '-hls_segment_filename',
      path.resolve(fileDir, 'segments', 'segment%05d.ts'),
      // "-vn" flag required to allow track uploading with album art
      // https://stackoverflow.com/questions/20193065/how-to-remove-id3-audio-tag-image-or-metadata-from-mp3-with-ffmpeg
      '-vn', // skip inclusion of video, process only the audio file without "video"
      m3u8FilePath
    ]
    logger.debug(`Spawning: ffmpeg ${args}`)
    const proc = spawn(ffmpeg, args)

    // capture output
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (data) => (stdout += data.toString()))
    proc.stderr.on('data', (data) => (stderr += data.toString()))

    proc.on('close', (code) => {
      async function asyncFn() {
        if (code === 0) {
          const segmentFileNames = await fs.readdir(fileDir + '/segments')
          const segmentFilePaths = segmentFileNames.map((filename) =>
            path.resolve(fileDir, 'segments', filename)
          )

          resolve({
            segments: {
              fileNames: segmentFileNames,
              filePaths: segmentFilePaths
            },
            m3u8FilePath
          })
        } else {
          logger.error('Error when processing file with ffmpeg')
          logger.error('Command stdout:', stdout, '\nCommand stderr:', stderr)
          reject(new Error('FFMPEG Error'))
        }
      }
      asyncFn()
    })
  })
}

/**
 * Call `ffmpeg -i <filepath>` to get audio file information with ffmpeg
 * NOTE - ffmpeg requires an output file always, but for our purposes we don't need one
 * For now function always resolves using stderr, which is where the current command pipes output
 * This function can be made more robust by either adding an output file to the ffmpeg command, or using ffprobe-static instead
 */
export async function getFileInformation(filePath: string) {
  return new Promise((resolve) => {
    const proc = spawn(ffmpeg, ['-i', filePath])

    // capture output
    let stderr = ''
    proc.stderr.on('data', (data) => (stderr += data.toString()))

    proc.on('close', () => {
      resolve(stderr)
    })
  })
}

/**
 * Transcode file into 320kbps mp3 and store in same directory.
 * @date 01-27-2022
 * @param fileDir the directory of the uploaded track artifact
 * @param fileName the uploaded track artifact filename
 * @param logContext the log context used to instantiate a logger
 * @returns the path to the newly created transcoded file
 */
export async function transcodeFileTo320(
  fileDir: string,
  fileName: string,
  { logContext }: { logContext: LogContext }
): Promise<string> {
  const logger = genericLogger.child(logContext)

  const sourcePath = path.resolve(fileDir, fileName)
  const destinationPath = path.resolve(
    fileDir,
    fileName.split('.')[0] + '-dl.mp3'
  )
  logger.info(
    `Transcoding file at ${sourcePath} and saving to ${destinationPath}...`
  )

  // Exit if dl-copy file already exists at target path
  if (await fs.pathExists(destinationPath)) {
    logger.info(`Downloadable copy already exists at ${destinationPath}.`)
    return destinationPath
  }

  return new Promise((resolve, reject) => {
    // https://ffmpeg.org/ffmpeg-formats.html#hls-2
    const args = [
      '-i',
      sourcePath,
      '-metadata',
      `fileName="${fileName}"`,
      '-metadata',
      `uuid="${uuid()}"`,
      '-ar',
      '48000', // TODO - move to configs
      '-b:a',
      '320k',
      // "-vn" flag required to allow track uploading with album art
      // https://stackoverflow.com/questions/20193065/how-to-remove-id3-audio-tag-image-or-metadata-from-mp3-with-ffmpeg
      '-vn', // skip inclusion of video, process only the audio file without "video"
      destinationPath
    ]
    const proc = spawn(ffmpeg, args)

    // capture output
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (data) => (stdout += data.toString()))
    proc.stderr.on('data', (data) => (stderr += data.toString()))

    proc.on('close', (code) => {
      async function asyncFn() {
        if (code === 0) {
          if (await fs.pathExists(destinationPath)) {
            logger.info(`Transcoded file ${destinationPath}`)
            resolve(destinationPath)
          } else {
            const logMsg =
              'Error when processing file with ffmpeg' +
              `\nCommand stdout: ${stdout}` +
              `\nCommand stderr: ${stderr}`
            logger.error(logMsg)
            reject(new Error(`FFMPEG Error: ${logMsg}`))
          }
        } else {
          const logMsg =
            'Error when processing file with ffmpeg' +
            `\nCommand stdout: ${stdout}` +
            `\nCommand stderr: ${stderr}`
          logger.error(logMsg)
          reject(new Error(`FFMPEG Error: ${logMsg}`))
        }
      }
      asyncFn()
    })
  })
}
