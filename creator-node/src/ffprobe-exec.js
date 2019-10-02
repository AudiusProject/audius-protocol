const ffprobeStatic = require('ffprobe-static')
const path = require('path')
const fs = require('fs')
var exec = require('child_process').exec

const SEGMENT_REGEXP = /(segment[0-9]*.ts)/

// Retrieve segment durations for an entire directory in a single child process
// Standard output is parsed and returned as a dictionary of <segmentName, duration>
async function getSegmentsDuration (req, segmentPath, filename, filedir) {
  let cmd = `find ${segmentPath}/ -maxdepth 1 -iname '*.ts' -print -exec ${ffprobeStatic.path} -v quiet -of csv=p=0 -show_entries format=duration {} \\;`

  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        req.logger.error(err)
        reject(new Error(err))
        return
      }

      req.logger.error('---------')
      req.logger.error('getSegmentsDuration')
      let splitResults = filename.split('.')
      req.logger.error(splitResults)
      let fileRandomName = splitResults[0]
      let manifestPath = path.join(filedir, `${fileRandomName}.m3u8`)
      req.logger.error(manifestPath)
      let manifestContents = fs.readFileSync(manifestPath)
      req.logger.error(manifestContents)
      let splitManifest = manifestContents.toString().split('\n')
      req.logger.error(splitManifest)

      let newSegmentDurations = {}
      req.logger.error('<<<<<<<<<<<')
      for (let i = 0; i < splitManifest.length; i += 1) {
        let matchedResults = splitManifest[i].match(SEGMENT_REGEXP)
        if (matchedResults === null) {
          continue
        }
        let segmentName = matchedResults[0]
        req.logger.error(matchedResults)
        let durationString = splitManifest[i - 1]
        let durationSplit = durationString.split(':')
        req.logger.error(durationSplit)
        let duration = parseFloat(durationSplit[1])
        newSegmentDurations[segmentName] = duration
      }
      req.logger.error('<<<<<<<<<<<')

      // the entire stdout (buffered)
      if (stdout) {
        const segmentDurations = {}
        const resultsArr = stdout.split('\n')
        /*
        for (let i = 0; i < resultsArr.length - 2; i += 2) {
          let matchedResults = resultsArr[i].match(SEGMENT_REGEXP)
          if (matchedResults === null) {
            req.logger.error(cmd)
            req.logger.error(stdout)
            req.logger.error(resultsArr[i])
            req.logger.error(`NULL no matched results for ${resultsArr[i]}`)
            continue
          }
          const segmentName = (matchedResults[0])
          const duration = Number(resultsArr[i + 1])
          segmentDurations[segmentName] = duration
        }
        */

        for (let i = 0; i < resultsArr.length; i += 1) {
          let matchedResults = resultsArr[i].match(SEGMENT_REGEXP)
          if (matchedResults === null) {
            continue
          }

          let parsedDuration = parseFloat(resultsArr[i + 1])
          if (!parsedDuration) {
            parsedDuration = 0
          }

          const segmentName = (matchedResults[0])
          const duration = Number(parsedDuration)
          segmentDurations[segmentName] = duration
        }

        req.logger.error(newSegmentDurations)
        req.logger.error(segmentDurations)
        req.logger.error('---------')

        resolve(newSegmentDurations)
      } else { reject(new Error('Failed')) }
    })
  })
}

module.exports = { getSegmentsDuration }
