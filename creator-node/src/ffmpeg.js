const config = require('./config')
const fs = require('fs')
const path = require('path')
const ffmpeg = require('ffmpeg-static').path
const spawn = require('child_process').spawn

/** Segments file into equal size chunks without re-encoding
 *  Try to segment as mp3 and error on failure
 */
function segmentFile (req, fileDir, fileName, trackName) {
  return new Promise((resolve, reject) => {
    const absolutePath = path.resolve(fileDir, fileName)

    // https://ffmpeg.org/ffmpeg-formats.html#hls-2
    const args = [
      '-i', absolutePath,
      '-ar', config.get('sampleRate'),
      '-b:a', config.get('bitRate'),
      '-hls_time', config.get('hlsTime'),
      '-hls_segment_type', config.get('hlsSegmentType'), // `fmp4` for MPEG-DASH - hls 7+ only
      '-hls_list_size', 0, // write all segments to one m3u8 file
      '-hls_base_url', 'segments/', // path hack - adds `segments` dir to m3u8 file entries
      '-hls_segment_filename', path.resolve(fileDir, 'segments', 'segment%03d.ts'),
      // "-vn" flag required to allow track uploading with album art
      // https://stackoverflow.com/questions/20193065/how-to-remove-id3-audio-tag-image-or-metadata-from-mp3-with-ffmpeg
      '-vn',
      path.resolve(fileDir, trackName.split('.')[0] + '.m3u8')
    ]
    const proc = spawn(ffmpeg, args)

    // capture output
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (data) => (stdout += data.toString()))
    proc.stderr.on('data', (data) => (stderr += data.toString()))

    proc.on('close', (code) => {
      if (code === 0) {
        const segmentFilePaths = fs.readdirSync(fileDir + '/segments')
        resolve(segmentFilePaths)
      } else {
        req.logger.error('Error when processing file with ffmpeg')
        req.logger.error('Command stdout:', stdout, '\nCommand stderr:', stderr)
        reject(new Error('FFMPEG Error'))
      }
    })
  })
}

module.exports = { segmentFile }
