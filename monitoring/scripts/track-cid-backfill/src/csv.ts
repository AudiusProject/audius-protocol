
import fs from 'fs-extra'
import * as path from 'path'
import { getEnv } from './config';

const OUTPUT_CSV_PREFIX = "output";

// creates a CSV file for the batch
export async function saveMappingToCSV(
  mapping: Record<string, string>,
  offset: number,
  spid: number
) {
  const { nodeEnv } = getEnv()
  const filename = `${nodeEnv || 'local'}-csv/${OUTPUT_CSV_PREFIX}-${spid}-${offset}.csv`;
  console.log(`saving ${Object.keys(mapping).length} items to csv: ${filename}`);

  const filepath = path.join(__dirname, '..', filename)
  const stream = fs.createWriteStream(filepath, { flags: 'a' })

  stream.write('track_id,track_cid\n')
  for (const [trackId, copy320] of Object.entries(mapping)) {
    if (copy320 !== undefined && copy320 !== null) {
      stream.write(`${trackId},${copy320}\n`)
    }
  }

  stream.end()
}

// creates a file for the missing batch
export async function saveMissingBatch(
  offset: number,
  batchSize: number,
  spid: number
) {
  const { nodeEnv } = getEnv()
  const filename = `${nodeEnv || 'local'}-missing-batches/missing-batches.txt`;
  console.log(`saving missing batch for spid ${spid} for offset ${offset} and batch size ${batchSize} in file: ${filename}`);

  const filepath = path.join(__dirname, '..', filename)
  const stream = fs.createWriteStream(filepath, { flags: 'a' })
  stream.write(`${spid},${offset},${batchSize}\n`)
  stream.end()
}
