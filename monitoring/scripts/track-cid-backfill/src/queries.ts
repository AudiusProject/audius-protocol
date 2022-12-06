import { QueryTypes } from "sequelize";
import { sequelizeConn } from "./db";

import fs from 'fs-extra'

// Fetch all content nodes
export async function getAllContentNodes(): Promise<
  { spid: number; endpoint: string }[]
> {
  const endpointsResp: unknown[] = await sequelizeConn.query(
    `
    SELECT cnode_sp_id as spid, endpoint
    FROM ursm_content_nodes
    WHERE is_current = TRUE; 
  `,
    {
      type: QueryTypes.SELECT,
    }
  );

  const endpoints = (endpointsResp as { endpoint: string; spid: number }[])!;

  return endpoints;
}

export async function getTrackCount() {
  const countResp: unknown[] = await sequelizeConn.query(
    `
    SELECT COUNT(*) 
    FROM tracks 
    WHERE is_current = TRUE
    AND track_cid is NULL; 
  `,
    {
      type: QueryTypes.SELECT,
    }
  );

  const count = parseInt((countResp[0] as { count: string }).count);

  return count;
}

// returns trackIds 
export async function getTrackIdBatch(
  offset: number,
  batchSize: number
): Promise<number[]> {
  console.log(`getting ${batchSize} items at offset ${offset}`);
  const batchResp: unknown[] = await sequelizeConn.query(
    `
    SELECT track_id
    FROM tracks
    WHERE is_current = TRUE
    AND track_cid is NULL
    ORDER BY created_at
    OFFSET :offset
    LIMIT :batchSize; 
    `, {
    type: QueryTypes.SELECT,
    replacements: { offset, batchSize },
  });

  const batch = (batchResp as { track_id: string }[]).map(obj => parseInt(obj.track_id));

  return batch;
}

export async function dumpTrackIds() {

  const trackIdsResp: unknown[] = await sequelizeConn.query(`
    SELECT track_id
    FROM tracks
    WHERE is_current = TRUE
    AND track_cid is NULL;
  `, {
    type: QueryTypes.SELECT
  })

  const trackIds = (trackIdsResp as { track_id: string }[]).map(blah => blah.track_id)

  const filename = `all_track_ids.csv`;
  console.log(`saving ${trackIds.length} items to csv: ${filename}`);

  const stream = fs.createWriteStream(filename, { flags: 'a' })

  // console.log(mapping)
  stream.write('TrackId\n')
  for (const trackId of trackIds) {
    stream.write(`${trackId}\n`)
  }

  stream.end()
}