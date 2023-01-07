import { getTrackIdToCIDMapping } from "./content";
import { saveMappingToCSV, saveMissingBatch } from "./csv";
import { closeDBConnection, verifyDBConnection } from "./db";
import { 
  // dumpTrackIds,
  // getAllContentNodes,
  // getTrackCount,
  getTrackIdBatch,
  prodContentNodes
} from "./queries";

import fs from 'fs-extra'

const BATCH_SIZE = 60_000;

async function readMissingTrackIds(): Promise<number[]> {
  const missingTrackIdsFile = await (await fs.readFile('./missing_cids.csv')).toString()

  const missingTrackIds = missingTrackIdsFile.split('\n')
  missingTrackIds.shift()

  return missingTrackIds.map(trackId => parseInt(trackId))
}

async function main() {
  await verifyDBConnection();

  const missingTrackIds = await readMissingTrackIds()

  console.log(`MISSING IDS: ${missingTrackIds.length}`)

  // conscontentNodes: {
  //   spid: number;
  //   endpoint: string;
  // }[] = await getAllContentNodes();
  // const contentNodes = [
  //   {
  //     spid: 1,
  //     endpoint: "https://creatornode7.staging.audius.co",
  //   },
  // ];
  const contentNodes = prodContentNodes
  console.log(`[INFO] content nodes: ${contentNodes.length}`);
  const sortedContentNodes = contentNodes.sort((x,y) => x.spid - y.spid)

  // await dumpTrackIds()

  // const trackCount = await getTrackCount();
  // console.log(`[INFO] track count: ${JSON.stringify(trackCount)}`);
  await Promise.all(
    sortedContentNodes.map(async ({ spid, endpoint }) => {
      for (let offset = 0; offset < missingTrackIds.length; offset += BATCH_SIZE) {
        const trackIdBatch = await getTrackIdBatch(missingTrackIds, offset, BATCH_SIZE);
        try {
          // In batches, get trackId=>copy320cid mapping
          console.log(
            `[INFO] ${endpoint} : ${offset} : ${trackIdBatch.length}`
          );
          const mapping = await getTrackIdToCIDMapping(endpoint, trackIdBatch);

          console.log(
            `[INFO] ${endpoint} - mapping length ${Object.keys(mapping).length}`
          );

          if (Object.keys(mapping).length === 0) {
            // immediately continue-ing here may not be correct as it's possible that
            // getTrackIdToCIDMapping was canceled, or
            // getTrackIdToCIDMapping caught an error
            // so we save the missing batch in a csv to later be able to
            // try again for those batches
            await saveMissingBatch(offset, BATCH_SIZE, spid)
            continue;
          }

          // // Save each batch to a CSV file (so if something breaks we have a stopping point)
          await saveMappingToCSV(mapping, offset, spid);
        } catch (e: any) {
          console.log(
            `[ERROR:${spid}] ${endpoint} - offset { ${offset} }: ${e}`
          );
          throw e;
        }
      }
    })
  );

  await closeDBConnection();
}

main().catch((e) => console.log(e));
