import { expect, jest, test } from '@jest/globals'
import { Processor } from '../../main'
import * as sendEmailFns from '../../email/notifications/sendEmail'
import { USDCTransfer } from '../../processNotifications/mappers/usdcTransfer'
import type { NotificationRow } from '../../types/dn'
import type { USDCTransferNotification } from '../../types/notifications'

jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({})),
  PublicKey: jest.fn().mockImplementation((v: string) => v)
}))

jest.mock('@solana/spl-token', () => ({
  getAccount: jest.fn()
}))

import {
  createUsers,
  setupTest,
  resetTests,
  setUserEmailAndSettings,
  createUSDCUserBank,
  CreateUSDCTransaction
} from '../../utils/populateDB'

describe('USDC Transfer', () => {
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

  test('Process push notification for manual USDC transfer', async () => {
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
        transaction_type: 'transfer',
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
      subject: 'Your USDC Transfer is Complete!'
    })
  })

  test('isInternalTransfer returns true when token owners match (mocked RPC)', async () => {
    type MinimalOwner = { toString: () => string }
    type MinimalAccount = { owner: MinimalOwner }
    type GetAccountFn = (c: unknown, p: unknown) => Promise<MinimalAccount>
    const mockedSplToken = jest.requireMock('@solana/spl-token') as unknown as {
      getAccount: unknown
    }
    const mockedGetAccount =
      mockedSplToken.getAccount as unknown as jest.MockedFunction<GetAccountFn>
    mockedGetAccount
      .mockResolvedValueOnce({ owner: { toString: () => 'OWNER_1' } })
      .mockResolvedValueOnce({ owner: { toString: () => 'OWNER_1' } })

    process.env.NOTIFICATIONS_SOLANA_RPC = 'https://dummy.unused'

    const notification: NotificationRow & {
      data: USDCTransferNotification
      user_ids: number[]
    } = {
      specifier: '1',
      group_id: 'g1',
      type: 'usdc_transfer',
      timestamp: new Date(Date.now()),
      user_ids: [1],
      data: {
        user_id: 1,
        signature: 'sig',
        change: -100,
        receiver_account: 'ReceiverATA111111111111111111111111111111',
        user_bank: 'UserBankATA1111111111111111111111111111111'
      }
    }

    const transfer = new USDCTransfer(
      processor.discoveryDB,
      processor.identityDB,
      notification
    )

    const result = await transfer.isInternalTransfer()
    expect(result).toBe(true)
    expect(mockedGetAccount).toHaveBeenCalledTimes(2)
  })
})
