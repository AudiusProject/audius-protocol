import App from "basekit/src/app";
import { SharedData, condition, initSharedData } from "./config";
import { onCondition } from "./app";
import { initSlack } from "./slack";

export const main = async () => {
  const dataRes = await initSharedData();
  if (dataRes.err) {
    console.error("SETUP ERROR = ", dataRes);
    return;
  }
  const data = dataRes.unwrap();

  await new App<SharedData>(data)
    .cron(condition, onCondition)
    .task(async (app) => {
      const slack = initSlack(app).unwrap();
      const port = process.env.SLACK_SOCKET_PORT || 3008;
      await slack.start(port);
      console.log("slack connection established ⚡️");
    })
    .run();
};
