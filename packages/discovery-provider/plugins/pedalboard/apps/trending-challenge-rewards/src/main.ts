import cron from "node-cron"
import { App } from '@pedalboard/basekit'
import { SharedData, initSharedData } from './config'
import { disburseTrendingRewards } from './rewards'
import { establishSlackConnection } from './slack'
import { announceTopFiveTrending } from './trending'


const onDemandRun = async (app: App<SharedData>) => {
  // Run on demand only if dryRun is true
  const { dryRun } = app.viewAppData()
  if (dryRun) {
    await disburseTrendingRewards(app)
  }
}

export const main = async () => {
  const data = await initSharedData()

  await new App<SharedData>({ appData: data })
    .task(establishSlackConnection)
    .task(onDemandRun)
    .run()

  
}

// Friday at 12:05 pm PST, extra five minutes for trending to calculate
cron.schedule('5 12 * * 5', () => {
  initSharedData().then((data) => {
    // make new appdata instance to satisfy types
    const appData = new App<SharedData>({ appData: data })
    appData.updateAppData((data) => {
      data.dryRun = false
      return data
    })
    announceTopFiveTrending(appData).catch(e => console.error("Announcement failed: ", e))
    disburseTrendingRewards(appData).catch(e => console.error("Disbursment failed: ", e))
  })
}, {
    timezone: "America/Los_Angeles"
});
