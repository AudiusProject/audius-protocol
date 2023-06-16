import App from "basekit/src/app";
import { SharedData } from ".";
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { appRouter } from "./prisma/routers";

export const trpcServer = async (app: App<SharedData>) => {
    const { trpcPort } = app.viewAppData()
    const server = createHTTPServer({ router: appRouter })
    server.listen(trpcPort)
}
