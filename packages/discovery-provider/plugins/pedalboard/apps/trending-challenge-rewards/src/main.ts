import { App } from '@pedalboard/basekit'
import { SharedData, condition, initSharedData } from './config'
import { disburseTrendingRewards } from './app'
import { establishSlackConnection, initSlack } from './slack'
import { announceTopFiveTrending } from './trending'

export const main = async () => {
  const dataRes = await initSharedData()
  if (dataRes.err) {
    console.error('SETUP ERROR = ', dataRes)
    return
  }
  const data = dataRes.unwrap()

  await new App<SharedData>({ appData: data })
    .cron(condition, disburseTrendingRewards)
    .cron(condition, announceTopFiveTrending)
    .task(establishSlackConnection)
    .run()
}
