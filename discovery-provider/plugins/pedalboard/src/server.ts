import express from 'express'
import App from './app'
import { Table } from './models'
import { Users } from './models'

export const server = async (self: App) => {
    const port = 3000
    const app = express()

    app.get('/health', async (_req, res) => {
        const db = self.getDnDb()
        const user = await db<Users>(Table.Users).where('user_id', '=', 1).andWhere('is_current', '=', true).first().catch(console.error);
        const db_status = !(user === undefined);
        res.json({
            health: 'amped 🎸',
            db_status: db_status ? "plugged in 🎙️" : "unplugged 🔌",
        })
    })

    app.listen(port, () => {
        console.log(`Health check listening on port ${port}`)
    })
}
