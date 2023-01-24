import { expect, test } from '@jest/globals';
import { Processor } from '../main';
import * as sns from '../sns'

test("DM notification processor", async () => {
  const sendPushNotificationSpy = jest.spyOn(sns, 'sendPushNotification')
    .mockImplementation(() => Promise.resolve())

  console.log('start processor')
  const processor = new Processor()
  await processor.init()
  console.log('inserting')
  await clearAllTables(processor.discoveryDB)
  await clearAllTables(processor.identityDB)
  const user1 = getRandomID()
  const user2 = getRandomID()
  await createUser(processor.discoveryDB, { user_id: user1 })
  await createUser(processor.discoveryDB, { user_id: user2 })
  const message1 = "hi from user1"
  await insertMessage(processor.discoveryDB, user1, user2, message1)
})
