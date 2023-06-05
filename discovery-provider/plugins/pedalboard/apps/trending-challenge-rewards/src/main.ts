import App from "basekit/src/app";
import { SharedData, condition } from "./config";
import { onCondition } from "./app";
import { sdk } from "@audius/sdk";
import { initAudiusLibs } from "./libs";

export const main = async () => {
  const audiusSdk = sdk({ appName: "trending-challenge-rewards-plugin" });
  const libs = await initAudiusLibs();
  await new App<SharedData>({
    oracleEthAddress: "",
    AAOEndpoint: "",
    feePayerOverride: "",
    libs,
    sdk: audiusSdk,
    localEndpoint: "",
  })
    .cron(condition, onCondition)
    .run();
};
