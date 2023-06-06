import App from "basekit/src/app";
import { SharedData, condition } from "./config";
import { onCondition } from "./app";
import { sdk } from "@audius/sdk";
import { initAudiusLibs } from "./libs";

export const main = async () => {
  const audiusSdk = sdk({ appName: "trending-challenge-rewards-plugin" });
  const libs = await initAudiusLibs();
  // default to true if undefined, otherwise explicitly state false to not do dry run
  const dryRun = !((process.env.dryRun || "true").toLocaleLowerCase() === "false")
  await new App<SharedData>({
    oracleEthAddress: "",
    AAOEndpoint: "",
    feePayerOverride: "",
    libs,
    sdk: audiusSdk,
    localEndpoint: "",
    dryRun
  })
    .cron(condition, onCondition)
    .run();
};
