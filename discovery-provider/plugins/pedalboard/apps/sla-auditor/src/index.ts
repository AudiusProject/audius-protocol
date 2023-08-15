import { log } from "logger";
import App from "basekit/src/app";
import { audit } from "./audit";
import { SharedData, initSharedData } from "./config";
import { createTables } from "./db";

const main = async () => {
  const dataRes = await initSharedData();
  if (dataRes.err) {
    console.error("SETUP ERROR = ", dataRes);
    return;
  }
  const data = dataRes.unwrap();

  await new App<SharedData>({ appData: data })
    .task(createTables)
    .tick({ minutes: 10 }, audit)
    .run();
};

main().catch(log);
