import App from "basekit/src/app";
import { SharedData, condition, initSharedData } from "./config";
import { onCondition } from "./app";

export const main = async () => {
  const dataRes = await initSharedData()
  if (dataRes.err) {
    console.error(dataRes)
    return
  }
  const data = dataRes.unwrap()
  await new App<SharedData>(data)
    .cron(condition, onCondition)
    .run();
};
