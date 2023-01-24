import type { Response } from "node-fetch";

import fetch from "node-fetch";
import retry from "async-retry";

async function makeRequest(
  url: string,
  batch: number[],
  retries: number,
  log: boolean,
  additionalInfo: object
): Promise<{
  response?: Response;
  attemptCount: number;
  canceled: boolean;
}> {
  const additionalInfoMsg = additionalInfo
    ? ` ${JSON.stringify(additionalInfo)}`
    : "";

  let attemptCount = 1;
  console.log(`[DEBUG] making request`);
  try {
    const response = await retry(
      async () =>
        fetch(url, {
          method: "POST",
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify({
            trackIds: batch,
          }),
        }),
      {
        retries,
        factor: 4,
        minTimeout: 30_000,
        onRetry: () => {
          attemptCount++;
        },
      }
    );
    if (log)
      console.debug(
        `\t[makeRequest Success] (${url}) - ${attemptCount} attempts - ${additionalInfoMsg}`
      );
    return { response, attemptCount, canceled: false };
  } catch (e: any) {
    const errorMsg = `[makeRequest Error] (${url}) - ${attemptCount} attempts - ${additionalInfoMsg} - ${e.message}`;
    console.error(`\t${errorMsg}`);
    throw new Error(`${errorMsg}`);
  }
}

export async function getTrackIdToCIDMapping(
  endpoint: string,
  batch: number[]
): Promise<Record<string, string>> {
  // {
  //   trackId: copy320CID,
  // }
  console.log(`getting mapping to ${batch.length} items`);
  const route = "/batch_id_to_cid";

  try {
    const fullURL = `${endpoint}${route}`;

    // if (signatureSpID && signatureSPDelegatePrivateKey) {
    //     axiosReqObj.params = generateSPSignatureParams(signatureSpID, signatureSPDelegatePrivateKey)
    // }

    const numTrackIdsInBatch = batch.length;
    const additionalInfo = { numTrackIdsInBatch };
    const batchResp = await makeRequest(
      fullURL,
      batch,
      1,
      false,
      additionalInfo
    );

    if (batchResp.canceled) {
      console.log(
        `[${endpoint}:getTrackIdToCIDMapping canceled] - ${endpoint}${route} - numTrackIds ${batch.length}`
      );
      return {};
    }

    if (batchResp.response?.status !== 200) {
      console.log(`[ERROR] bad things - ${await batchResp.response?.json()}`);
      throw new Error("the response failed");
    }

    const body = await batchResp.response?.json();
    // console.log(`[INFO] response object: ${JSON.stringify(body.data)}`);
    const mappingResponse: Record<string, string> = body.data as Record<
      string,
      string
    >;

    return mappingResponse;
  } catch (e: any) {
    console.error(
      `[${endpoint}:getTrackIdToCIDMapping Error] - ${endpoint}${route} - numTracks ${batch.length} - ${e.message}`
    );
    return {};
  }
}
