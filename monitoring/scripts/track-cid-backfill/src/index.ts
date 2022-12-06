import { getTrackIdToCIDMapping } from "./content";
import { saveMappingToCSV, saveMissingBatch } from "./csv";
import { closeDBConnection, connectToDBAndRunMigrations } from "./db";
import { 
  dumpTrackIds,
  getAllContentNodes, 
  getTrackCount, 
  getTrackIdBatch 
} from "./queries";

const BATCH_SIZE = 10_000;



async function main() {
  await connectToDBAndRunMigrations();

  const contentNodes: {
    spid: number;
    endpoint: string;
  }[] = await getAllContentNodes();
  // const contentNodes = [
  //   {
  //     spid: 1,
  //     endpoint: "https://creatornode7.staging.audius.co",
  //   },
  // ];
  console.log(`[INFO] content nodes: ${contentNodes.length}`);

  await dumpTrackIds()

  const trackCount = await getTrackCount();
  console.log(`[INFO] track count: ${JSON.stringify(trackCount)}`);
  await Promise.all(
    contentNodes.map(async ({ spid, endpoint }) => {
      for (let offset = 0; offset < trackCount; offset += BATCH_SIZE) {
        const trackIdBatch = await getTrackIdBatch(offset, BATCH_SIZE);
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
            // continue-ing here may not be correct as it's possible that
            // getTrackIdToCIDMapping was canceled, or
            // getTrackIdToCIDMapping caught an error
            // so we save the missing batch in a csv to later be able to
            // try again for those batches
            await saveMissingBatch(offset, BATCH_SIZE)
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
