import { AudiusLibs } from "@audius/sdk";
import App from "basekit/src/app";
import { SharedData } from "config";
import { log } from "logger";
import {
    ChallengeDisbursementUserbank,
    ChallengeDisbursementUserbankFriendly,
    getChallengesDisbursementsUserbanks,
    getChallengesDisbursementsUserbanksFriendly,
    getStartBlock,
  } from "queries";

export const onDisburse = async (app: App<SharedData>) => {
    const db = app.getDnDb()
    const startBlockRes = await getStartBlock(db)
    log(`${JSON.stringify(startBlockRes)}`)
}

const gatherTableOfChallenges = async (app: App<SharedData>, specifier: string) => {
    const db = app.getDnDb()
    const startBlockRes = await getStartBlock(db)
    log(`${JSON.stringify(startBlockRes)}`)
    const startBlock = startBlockRes[startBlockRes.length - 1]
}
