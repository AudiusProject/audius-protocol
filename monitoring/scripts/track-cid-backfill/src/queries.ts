import { QueryTypes } from "sequelize";
import { sequelizeConn } from "./db";

import fs from 'fs-extra'

export const prodContentNodes = [
  {
      endpoint: "https://creatornode.audius.co",
      spid: 1,
    },
    {
      endpoint: "https://creatornode2.audius.co",
      spid: 2,
    },
    {
      endpoint: "https://creatornode3.audius.co",
      spid: 3,
    },
    {
      endpoint: "https://content-node.audius.co",
      spid: 4,
    },
    {
      endpoint: "https://audius-content-1.figment.io",
      spid: 5,
    },
    {
      endpoint: "https://creatornode.audius.prod-us-west-2.staked.cloud",
      spid: 7,
    },
    {
      endpoint: "https://audius-content-2.figment.io",
      spid: 8,
    },
    {
      endpoint: "https://audius-content-3.figment.io",
      spid: 9,
    },
    {
      endpoint: "https://audius-content-4.figment.io",
      spid: 10,
    },
    {
      endpoint: "https://audius-content-5.figment.io",
      spid: 11,
    },
    {
      endpoint: "https://creatornode.audius1.prod-us-west-2.staked.cloud",
      spid: 12,
    },
    {
      endpoint: "https://creatornode.audius2.prod-us-west-2.staked.cloud",
      spid: 13,
    },
    {
      endpoint: "https://creatornode.audius3.prod-us-west-2.staked.cloud",
      spid: 14,
    },
    {
      endpoint: "https://creatornode.audius4.prod-us-west-2.staked.cloud",
      spid: 15,
    },
    {
      endpoint: "https://creatornode.audius5.prod-us-west-2.staked.cloud",
      spid: 16,
    },
    {
      endpoint: "https://creatornode.audius6.prod-us-west-2.staked.cloud",
      spid: 19,
    },
    {
      endpoint: "https://audius-content-6.figment.io",
      spid: 21,
    },
    {
      endpoint: "https://audius-content-7.figment.io",
      spid: 22,
    },
    {
      endpoint: "https://audius-content-8.figment.io",
      spid: 23,
    },
    {
      endpoint: "https://usermetadata.audius.co",
      spid: 27,
    },
    {
      endpoint: "https://creatornode.audius7.prod-us-west-2.staked.cloud",
      spid: 28,
    },
    {
      endpoint: "https://audius-content-9.figment.io",
      spid: 29,
    },
    {
      endpoint: "https://audius-content-10.figment.io",
      spid: 30,
    },
    {
      endpoint: "https://audius-content-11.figment.io",
      spid: 31,
    },
    {
      endpoint: "https://audius.prod.capturealpha.io",
      spid: 33,
    },
    {
      endpoint: "https://content.grassfed.network",
      spid: 35,
    },
    {
      endpoint: "https://blockdaemon-audius-content-01.bdnodes.net",
      spid: 36,
    },
    {
      endpoint: "https://audius-content-1.cultur3stake.com",
      spid: 37,
    },
    {
      endpoint: "https://audius-content-2.cultur3stake.com",
      spid: 38,
    },
    {
      endpoint: "https://audius-content-3.cultur3stake.com",
      spid: 39,
    },
    {
      endpoint: "https://audius-content-4.cultur3stake.com",
      spid: 40,
    },
    {
      endpoint: "https://audius-content-5.cultur3stake.com",
      spid: 41,
    },
    {
      endpoint: "https://audius-content-6.cultur3stake.com",
      spid: 42,
    },
    {
      endpoint: "https://audius-content-7.cultur3stake.com",
      spid: 43,
    },
    {
      endpoint: "https://blockdaemon-audius-content-02.bdnodes.net",
      spid: 44,
    },
    {
      endpoint: "https://blockdaemon-audius-content-03.bdnodes.net",
      spid: 45,
    },
    {
      endpoint: "https://blockdaemon-audius-content-04.bdnodes.net",
      spid: 46,
    },
    {
      endpoint: "https://blockdaemon-audius-content-05.bdnodes.net",
      spid: 47,
    },
    {
      endpoint: "https://blockdaemon-audius-content-06.bdnodes.net",
      spid: 48,
    },
    {
      endpoint: "https://blockdaemon-audius-content-07.bdnodes.net",
      spid: 49,
    },
    {
      endpoint: "https://blockdaemon-audius-content-08.bdnodes.net",
      spid: 50,
    },
    {
      endpoint: "https://blockdaemon-audius-content-09.bdnodes.net",
      spid: 51,
    },
    {
      endpoint: "https://audius-content-8.cultur3stake.com",
      spid: 52,
    },
    {
      endpoint: "https://blockchange-audius-content-01.bdnodes.net",
      spid: 53,
    },
    {
      endpoint: "https://blockchange-audius-content-02.bdnodes.net",
      spid: 54,
    },
    {
      endpoint: "https://blockchange-audius-content-03.bdnodes.net",
      spid: 55,
    },
    {
      endpoint: "https://audius-content-9.cultur3stake.com",
      spid: 56,
    },
    {
      endpoint: "https://audius-content-10.cultur3stake.com",
      spid: 57,
    },
    {
      endpoint: "https://audius-content-11.cultur3stake.com",
      spid: 58,
    },
    {
      endpoint: "https://audius-content-12.cultur3stake.com",
      spid: 59,
    },
    {
      endpoint: "https://audius-content-13.cultur3stake.com",
      spid: 60,
    },
    {
      endpoint: "https://audius-content-14.cultur3stake.com",
      spid: 61,
    },
    {
      endpoint: "https://audius-content-15.cultur3stake.com",
      spid: 62,
    },
    {
      endpoint: "https://audius-content-16.cultur3stake.com",
      spid: 63,
    },
    {
      endpoint: "https://audius-content-17.cultur3stake.com",
      spid: 64,
    },
    {
      endpoint: "https://audius-content-18.cultur3stake.com",
      spid: 65,
    },
    {
      endpoint: "https://audius-content-12.figment.io",
      spid: 66,
    },
    {
      endpoint: "https://cn0.mainnet.audiusindex.org",
      spid: 67,
    },
    {
      endpoint: "https://cn1.mainnet.audiusindex.org",
      spid: 68,
    },
    {
      endpoint: "https://cn2.mainnet.audiusindex.org",
      spid: 69,
    },
    {
      endpoint: "https://cn3.mainnet.audiusindex.org",
      spid: 70,
    },
    {
      endpoint: "https://audius-content-13.figment.io",
      spid: 72,
    },
    {
      endpoint: "https://audius-content-14.figment.io",
      spid: 73,
    },
    {
      endpoint: "https://cn4.mainnet.audiusindex.org",
      spid: 74,
    }
  ]

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