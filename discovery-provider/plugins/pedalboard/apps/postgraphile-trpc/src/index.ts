import App from "basekit/src/app";
import { postgraphileServer } from "./postgraphile";
import { trpcServer } from "./trpc";

export type SharedData = {
  databaseUrl: string,
  postgraphilePort: number,
  trpcPort: number
};

const main = async () => {
  const config = {
    databaseUrl: "postgresql://postgres:postgres@localhost:5432/audius_discovery",
    postgraphilePort: 8998,
    trpcPort: 8999
  }
  await new App<SharedData>(config)
    .task(postgraphileServer)
    .task(trpcServer)
    .run();
};

(async () => await main().catch(console.error))();
