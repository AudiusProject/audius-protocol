const ffprobeStatic = require('ffprobe-static')
const exec = require('child_process').exec

const SEGMENT_REGEXP = /(segment[0-9]*.ts)/

// Retrieve segment durations for an entire directory in a single child process
// Standard output is parsed and returned as a dictionary of <segmentName, duration>
async function getSegmentsDuration(req, segmentPath) {
  const cmd = `find ${segmentPath}/ -maxdepth 1 -iname '*.ts' -print -exec ${ffprobeStatic.path} -v quiet -of csv=p=0 -show_entries format=duration {} \\;`

  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        req.logger.error(err)
        reject(new Error(err))
        return
      }

      // the entire stdout (buffered)
      if (stdout) {
        const segmentDurations = {}
        const resultsArr = stdout.split('\n')
        for (let i = 0; i < resultsArr.length - 2; i += 2) {
          const matchedResults = resultsArr[i].match(SEGMENT_REGEXP)
          if (matchedResults === null) {
            req.logger.error(stdout)
            req.logger.error(`NULL no matched results for ${resultsArr[i]}`)
            continue
          }
          const segmentName = matchedResults[0]
          const duration = Number(resultsArr[i + 1])
          segmentDurations[segmentName] = duration
        }

        resolve(segmentDurations)
      } else {
        reject(new Error('Failed'))
      }
    })
  })
}

module.exports = { getSegmentsDuration }
