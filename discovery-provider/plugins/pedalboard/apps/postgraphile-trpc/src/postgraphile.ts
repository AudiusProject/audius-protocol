import App from "basekit/src/app";
import { SharedData } from ".";
import express from "express"
import { postgraphile } from "postgraphile"

export const postgraphileServer = async (app: App<SharedData>) => {
    const { databaseUrl, postgraphilePort } = app.viewAppData()
    const expressApp = express()
    expressApp.use(
        postgraphile(
            databaseUrl,
            "public",
            {
                watchPg: true,
                graphiql: true,
                enhanceGraphiql: true,
            }
        )
    )
    expressApp.listen(postgraphilePort)
}
