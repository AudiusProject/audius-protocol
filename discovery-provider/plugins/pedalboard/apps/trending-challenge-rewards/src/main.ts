import App from "basekit/src/app";
import { SharedData, condition, initAudiusLibs } from "./config";
import { onDisburse } from "./app";
import { sdk } from "@audius/sdk";

export const main = async () => {
  const audiusSdk = sdk({ appName: "trending-challenge-rewards-plugin" })
  const libs = await initAudiusLibs()
  await new App<SharedData>({
    oracleEthAddress: "",
    AAOEndpoint: "",
    feePayerOverride: "",
    libs,
    sdk: audiusSdk
  })
    .cron(condition, onDisburse)
    .run();
};
