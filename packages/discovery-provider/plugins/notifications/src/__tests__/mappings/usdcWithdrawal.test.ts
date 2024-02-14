import { expect, jest, test } from '@jest/globals'
import { Processor } from '../../main'
import * as sendEmailFns from '../../email/notifications/sendEmail'

import {
  createUsers,
  setupTest,
  resetTests,
  setUserEmailAndSettings,
  createUSDCUserBank,
  CreateUSDCTransaction
} from '../../utils/populateDB'

describe('USDC Withdrawal', () => {
  let processor: Processor

  const sendTransactionalEmailSpy = jest
    .spyOn(sendEmailFns, 'sendTransactionalEmail')
    .mockImplementation(() => Promise.resolve(true))

  beforeEach(async () => {
    const setup = await setupTest()
    processor = setup.processor
  })

  afterEach(async () => {
    await resetTests(processor)
  })

  test('Process push notification for USDC withdrawal', async () => {
    await createUsers(processor.discoveryDB, [{ user_id: 1 }])
    await createUSDCUserBank(processor.discoveryDB, [
      {
        ethereum_address: '0x1',
        bank_account: '0x123',
        signature: '4'
      }
    ])
    await CreateUSDCTransaction(processor.discoveryDB, [
      {
        transaction_type: 'withdrawal',
        method: 'send',
        user_bank: '0x123',
        slot: 5,
        signature: '5',
        change: '100',
        balance: '100'
      }
    ])
    await setUserEmailAndSettings(processor.identityDB, 'live', 1)

    const pending = processor.listener.takePending()
    expect(pending?.appNotifications).toHaveLength(1)
    await processor.appNotificationsProcessor.process(pending.appNotifications)

    expect(sendTransactionalEmailSpy).toHaveBeenCalledWith({
      email: 'user_1@gmail.com',
      html: expect.anything(),
      subject: 'Your Withdrawal Has Been Started'
    })
  })
})
