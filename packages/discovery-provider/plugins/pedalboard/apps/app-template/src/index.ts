import { log } from '@pedalboard/logger'
import App from '@pedalboard/basekit/src/app'
import moment from 'moment'

type SharedData = {}

const main = async () => {
  await new App<SharedData>({})
    .tick({ seconds: 5 }, async (_app) => {
      console.log(`tick ${moment().calendar()}`)
    })
    .run()
}

;(async () => {
  await main().catch(log)
})()
