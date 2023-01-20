import { expect, test } from '@jest/globals';
import { Processor } from '../main';
import * as sns from '../sns'
import { clearAllTables, createUser, insertFollow, insertMobileDevice, insertMobileSetting } from '../utils/populateDB';


test("Start processor", async () => {
  const sendPushNotificationSpy = jest.spyOn(sns, 'sendPushNotification')
    .mockImplementation(() => Promise.resolve())

  console.log('start processor')
  const processor = new Processor()
  await processor.init()
  console.log('inserting')
  await clearAllTables(processor.discoveryDB)
  await clearAllTables(processor.identityDB)
  await createUser(processor.discoveryDB, { user_id: 1 })
  await createUser(processor.discoveryDB, { user_id: 2 })
  await insertFollow(processor.discoveryDB, 1, 2)
  await insertMobileSetting(processor.identityDB, 2)
  await insertMobileDevice(processor.identityDB, 2)
  await new Promise(resolve => setTimeout(resolve, 10))

  const pending = processor.listener.takePending()
  expect(pending?.appNotifications).toHaveLength(1)
  // Assert single pending
  await processor.appNotifications.process(pending.appNotifications)

  expect(sendPushNotificationSpy).toHaveBeenCalledWith({
    type: 'ios',
    targetARN: 'arn:2',
    badgeCount: 0
  }, {
    title: 'Follow',
    body: 'user_1 followed you',
    data: {}
  })

  await processor.listener.close()

});
