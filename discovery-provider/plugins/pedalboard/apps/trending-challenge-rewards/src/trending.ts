import { Knex } from "knex"

export const queryTopFiveTrending = async (discoveryDb: Knex): Promise<void> => {
    
}

export const gatherTwitterHandles = async (identityDb: Knex, discoveryDb: Knex, blockchainUserIds: number[]): Promise<Map<number, string>> => {
    // check identity for twitter handle
    // if not found, get audius handle from discovery
    // insert into map of blockchainUserId => display handle
    return new Map()
}

export const composeTweet = (): string[] => {
    return []
}
