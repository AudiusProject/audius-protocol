import express from 'express'
import App from '../src/app'
import { Table } from '../src/models'
import { Users } from '../src/models'
import { SharedData } from 'scripts/sandbox'

export const server = async (app: App<SharedData>) => {
    const port = 3000
    const server = express()

    server.get('/health', async (_req, res) => {
        const db = app.getDnDb()
        const user = await db<Users>(Table.Users).where('user_id', '=', 1).andWhere('is_current', '=', true).first().catch(console.error);
        const db_status = !(user === undefined);
        const sharedData = app.viewAppData()
        res.json({
            health: 'amped 🎸',
            db_status: db_status ? "plugged in 🎙️" : "unplugged 🔌",
            counter_count: sharedData.counterCount,
            user_updates: sharedData.userUpdateCount,
            track_updates: sharedData.trackUpdateCount
        })
    })

    server.listen(port, () => {
        console.log(`Health check listening on port ${port}`)
    })
}
