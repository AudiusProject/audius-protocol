
import fs from 'fs-extra'
import { getEnv } from './config';

const OUTPUT_CSV_PREFIX = "output";

// creates a CSV file for the batch
export async function saveMappingToCSV(
  mapping: Record<string, string>,
  offset: number,
  spid: number
) {
  const { nodeEnv } = getEnv()
  const filename = `${nodeEnv}-csv/${OUTPUT_CSV_PREFIX}-${spid}-${offset}.csv`;
  console.log(`saving ${Object.keys(mapping).length} items to csv: ${filename}`);

  const stream = fs.createWriteStream(filename, { flags: 'a' })

  // console.log(mapping)
  stream.write('track_id,track_cid\n')
  for (const [trackId, copy320] of Object.entries(mapping)) {
    if (copy320 !== undefined && copy320 !== null) {
      stream.write(`${trackId},${copy320}\n`)
    }
  }

  stream.end()
}
