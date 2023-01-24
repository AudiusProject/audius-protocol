import { Knex } from 'knex'
import { UserRow } from '../types/dn'

// Generate random ID betweeen 0 and 999
export function randID() {
  return Math.floor(Math.random() * 1000)
}

export async function clearAllTables(db: Knex) {

}

export async function createUser(db: Knex, metadata: UserRow) {
  await db.insert(metadata).into('users')
}

export async function createChat(db: Knex, user1: number, user2: number, timestamp: number): Promise<string> {

}

export async function readChat(db: Knex, userID: number, chatID: string, timestamp: number) {

}

export async function insertMessage(db: Knex,senderID: number, receiverID: number, chatID: string, messageID: number, message: string, timestamp: number) {

}

export async function insertReaction(db: Knex, senderID: number, receiverID: number, messageID: number, reaction: string, timestamp: number) {

}

export async function insertMobileDevice(db: Knex, userID: number) {

}

export async function insertMoibleSetting(db: Knex, userID: number) {

}
