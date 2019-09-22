const ffprobeStatic = require('ffprobe-static')
var exec = require('child_process').exec
// const ffprobe = require('./src/ffprobe')

const SEGMENT_REGEXP = /(segment[0-9]*.ts)/

async function getSegmentsDuration (req, segmentPath) {
  req.logger.error('getSegmentsDuration')
  req.logger.error(segmentPath)
  let cmd = `find ${segmentPath}/ -maxdepth 1 -iname '*.ts' -print -exec ${ffprobeStatic.path} -v quiet -of csv=p=0 -show_entries format=duration {} \\;`

  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        req.logger.error(err)
        reject(new Error(err))
        return
      }
      req.logger.error('FINISHED')
      req.logger.error(stdout)
      req.logger.error(stderr)

      // the entire stdout (buffered)
      if (stdout) {
        req.logger.error('STD OUT FOUND')
        const segmentDurations = {}
        const resultsArr = stdout.split('\n')
        req.logger.error(resultsArr)
        for (let i = 0; i < resultsArr.length - 2; i += 2) {
          const segmentName = (resultsArr[i].match(SEGMENT_REGEXP)[0])
          const duration = Number(resultsArr[i + 1])
          segmentDurations[segmentName] = duration
        }

        req.logger.error(segmentDurations)
        resolve(segmentDurations)
      } else { reject(new Error('Failed')) }
    })
  })
}

module.exports = { getSegmentsDuration }
