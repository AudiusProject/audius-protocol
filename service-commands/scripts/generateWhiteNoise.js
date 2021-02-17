/**
 * Generates a random generateWhiteNoise mp3 file of given input size.
 *
 * Script usage: node generateWhiteNoise.js <size> <outFile>
 */

const { spawn } = require('child_process')
const ffmpeg = require('ffmpeg-static')

async function run() {
  try {
    const { size, outFile } = parseArgs()
    generateWhiteNoise(size, outFile)
  } catch (err) {
    console.error(err)
  }
}

/**
 * Process two command line args for filesize and filename.
 *
 * Defaults to 1 MB file size, and unix timestamp for filename if args are not provided.
 */
function parseArgs() {
  const args = process.argv.slice(2)
  const size = args[0] || 1000
  const outFile = args[1] || `whitenoise-${new Date().getTime()}.mp3`

  // check appropriate CLI usage
  if (!size || !outFile) {
    throw new Error(
      `Incorrect script usage for input size (${size}) and outFile (${outFile}).\nPlease follow the structure 'node generateWhiteNoise.js <size> <outFile>'`
    )
  }

  return { size, outFile }
}

/**
 * Generates mp3 file using ffmpeg from given filesize in KiB
 *
 * The generated mp3 file is guaranteed to be the same duration for same size.
 * It is also guaranteed to be random and unique across multiple runs.
 *
 * The output file is stored at the directory from which the script was called.
 *
 * Docs: https://ffmpeg.org/ffmpeg-all.html
 */
function generateWhiteNoise(size, outFile) {
  return new Promise((resolve, reject) => {
    const process = spawn(ffmpeg, [
      '-f', // audio/video filtering framework
      'lavfi', // provides generic audio filtering for audio/video signals
      '-i', // input flag
      `anoisesrc=d=${(1024 * size) / 8064}`, // generate a noise audio signal for the duration (d) of <size> KiB
      outFile, // output filepath
      '-y' // overwrite existing file
    ])

    process.stderr.on('data', data => {
      console.log(data.toString('utf8'))
    })
    process.on('close', code => {
      if (code) {
        reject(new Error(`ffmpeg process exited with code ${code}`))
      } else {
        resolve()
      }
    })
  })
}

run()
