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
 * Process command line args, defaults to 1 KiB file size, and unix timestamp for filename
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
 * Generate mp3 file using ffmpeg from given filesize in KiB
 */
function whitenoise(size, outFile) {
  return new Promise((resolve, reject) => {
    const process = spawn(ffmpeg, [
      '-f',
      'lavfi',
      '-i',
      `anoisesrc=d=${(1024 * size) / 8064}`,
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
