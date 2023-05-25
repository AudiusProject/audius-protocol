import { App } from "app";
import { Tracks } from "storage/src/models";

type SharedData = {};

const main = async () => {
  await new App<SharedData>({})
    .listen<Tracks>("tracks", async (app, msg) => {})
    .run();
};

(async () => {
  await main();
})();
