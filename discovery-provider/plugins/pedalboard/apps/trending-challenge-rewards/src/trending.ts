import App from "basekit/src/app"
import { Knex } from "knex"
import { SharedData } from "./config"

export const announceTopFiveTrending = async (app: App<SharedData>) => {
    
}

const queryTopFiveTrending = async (discoveryDb: Knex): Promise<void> => {

}

const gatherTwitterHandles = async (identityDb: Knex, discoveryDb: Knex, blockchainUserIds: number[]): Promise<Map<number, string>> => {
    // check identity for twitter handle
    // if not found, get audius handle from discovery
    // insert into map of blockchainUserId => display handle
    return new Map()
}

const composeTweet = (): string[] => {
    return []
}
