import { log } from "logger";
import App from "basekit/src/app";
import { Docker, dockerCommand } from 'docker-cli-js';

export type SharedData = {};

const main = async () => {
  await new App<SharedData>({})
    .tick({ seconds: 5 }, async (app) => {
      const data = await dockerCommand('ps')
      console.log('data = ', data);
    })
    .run();
};

(async () => {
  await main().catch(log);
})();
