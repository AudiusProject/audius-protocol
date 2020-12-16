/**
 * Generates a random whitenoise mp3 file of given input size.
 *
 * Script usage: node whitenoise.js <size> <outFile>
 */

const { spawn } = require('child_process')
const ffmpeg = require('ffmpeg-static')

async function run() {
  try {
    const { size, outFile } = parseArgs()
    whitenoise(size, outFile)
  } catch (err) {
    console.error(err.message)
  }
}

/**
 * Process two command line args for filesize and filename.
 *
 * Defaults to 1 KiB file size, and unix timestamp for filename if args are not provided.
 */
function parseArgs() {
  const args = process.argv.slice(2)
  const size = args[0] || 1
  const outFile = args[1] || `whitenoise-${new Date().getTime()}.mp3`

  // check appropriate CLI usage
  if (!size || !outFile) {
    const errorMessage = `Incorrect script usage for input size (${size}) and outFile (${outFile}).\nPlease follow the structure 'node whitenoise.js <size> <outFile>'`
    throw new Error(errorMessage)
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
 * See https://ffmpeg.org/ffmpeg-filters.html#anoisesrc for more information.
 */
function whitenoise(size, outFile) {
  return new Promise((resolve, reject) => {
    const process = spawn(ffmpeg, [
      '-f',
      'lavfi',
      '-i',
      `anoisesrc=d=${(1024 * size) / 8064}`, // generate a noise audio signal for the duration of <size> KiB
      outFile,
      '-y'
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
