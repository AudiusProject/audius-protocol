import App from "basekit/src/app";
import { SharedData } from ".";

export const trpcServer = async (app: App<SharedData>) => {
    const { databaseUrl } = app.viewAppData()
}
