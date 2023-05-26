import { log } from "logger";
import App from "basekit/src/app";
import { SharedData, condition } from "./config";
import {
  getChallengesDisbursementsUserbanks,
  getChallengesDisbursementsUserbanksFriendly,
  getStartBlock,
} from "queries";

export const main = async () => {
  await new App<SharedData>({})
    .cron(condition, async (app) => {
      const startBlock = await getStartBlock(app.getDnDb());
      const challengesDisbursementsUserbanks =
        await getChallengesDisbursementsUserbanks(app.getDnDb());
      log(`Not Friendly: ${JSON.stringify(challengesDisbursementsUserbanks)}`);
      const challengesDisbursementsUserbanksFriendly =
        await getChallengesDisbursementsUserbanksFriendly(app.getDnDb());
      log(
        `Friendly: ${JSON.stringify(challengesDisbursementsUserbanksFriendly)}`
      );
    })
    .run();
};
