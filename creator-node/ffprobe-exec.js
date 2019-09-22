var exec = require('child_process').exec
const ffprobe = require('./src/ffprobe')

const SEGMENT_REGEXP = /(segment[0-9]*.ts)/
async function run(){
  exec(`find ./file_storage/1fdb0979-fc9d-456a-9129-5d279e12c9a6/segments/. -maxdepth 1 -iname '*.ts' -print -exec ffprobe -v quiet -of csv=p=0 -show_entries format=duration {} \\;`, (err, stdout, stderr) => {
    if (err) {
      return;
    }

    if(stderr){
      console.error(stderr)
    }
    
    // the entire stdout (buffered)
    if(stdout){
      const segmentDurations = {}
      const resultsArr = stdout.split('\n')
      for (let i = 0; i < resultsArr.length-2; i+=2){
        const segmentName = (resultsArr[i].match(SEGMENT_REGEXP)[0])
        const duration = Number(resultsArr[i+1])
        segmentDurations[segmentName] = duration
      }

      console.log(segmentDurations)
      return segmentDurations
    }
    else return null
  });
  
}

run()