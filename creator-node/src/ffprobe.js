const ffprobeStatic = require('ffprobe-static')
var JSONStream = require('JSONStream')
var Deferred = require('deferential')
var bl = require('bl')
var spawn = require('child_process').spawn

async function getTrackDuration (fileDir) {
  try {
    const resp = await getInfo(fileDir, { path: ffprobeStatic.path })
    const duration = +(resp.streams[0].duration) // + --> attempt cast to Number
    if (isNaN(duration)) throw new Error(`Invalid return value from FFProbe: ${duration}`)
    return duration
  } catch (e) {
    // If the error is the text below, it means the segment doesn't have any
    // data. In that case, just return null so we skip adding the segment
    // Format mp3 detected only with low score of 5, misdetection possible!
    if (e.message.indexOf('Format mp3 detected only with low score of') >= 0) {
      return null
    } else throw e
  }
}

// Function vendored from ffprobe npm module
// https://github.com/eugeneware/ffprobe/blob/master/index.js
async function getInfo (filePath, opts, cb) {
  var params = []
  params.push('-show_streams', '-f', 'mpegts', '-print_format', 'json', filePath)

  var d = Deferred()
  var info
  var stderr

  var ffprobe = spawn(opts.path, params)
  ffprobe.once('close', function (code) {
    if (!code) {
      d.resolve(info)
    } else {
      d.reject(new Error(stderr))
    }
  })

  ffprobe.stderr.pipe(bl(function (err, data) {
    if (err) d.reject(err)
    else stderr = data.toString()
  }))

  ffprobe.stdout
    .pipe(JSONStream.parse())
    .once('data', function (data) {
      info = data
    })

  return d.nodeify(cb)
}

module.exports = { getTrackDuration }
