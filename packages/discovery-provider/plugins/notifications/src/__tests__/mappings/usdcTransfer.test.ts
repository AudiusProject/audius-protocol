const getAccountInfoMock: jest.MockedFunction<
  (pubkey: unknown) => Promise<{ data: Buffer } | null>
> = jest.fn()

jest.mock('@solana/web3.js', () => {
  const actual = jest.requireActual('@solana/web3.js') as Record<
    string,
    unknown
  >
  class MockConnection {
    getAccountInfo = getAccountInfoMock
  }
  class MockPublicKey {
    private _v: string
    constructor(v: string) {
      this._v = String(v)
    }
    toString() {
      return this._v
    }
  }
  return Object.assign({}, actual, {
    Connection: MockConnection,
    PublicKey: MockPublicKey
  })
})

jest.mock('@solana/spl-token', () => ({
  AccountLayout: { decode: jest.fn() }
}))

import { expect, jest, test } from '@jest/globals'
import { Processor } from '../../main'
// no direct import of USDCTransfer needed for these tests
import * as sendEmailFns from '../../email/notifications/sendEmail'
import {} from '@solana/web3.js'

import {
  createUsers,
  setupTest,
  resetTests,
  setUserEmailAndSettings,
  createUSDCUserBank,
  CreateUSDCTransaction
} from '../../utils/populateDB'
import { PublicKey } from '@solana/web3.js'

describe('USDC Transfer', () => {
  let processor: Processor

  const sendTransactionalEmailSpy = jest
    .spyOn(sendEmailFns, 'sendTransactionalEmail')
    .mockImplementation(() => Promise.resolve(true))

  beforeEach(async () => {
    const setup = await setupTest()
    processor = setup.processor
    process.env.NOTIFICATIONS_SOLANA_RPC = 'https://dummy.unused'
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

  test('when token owners match, no notification is sent', async () => {
    getAccountInfoMock
      .mockResolvedValueOnce({ data: Buffer.from([]) })
      .mockResolvedValueOnce({ data: Buffer.from([]) })

    const splToken = jest.requireMock('@solana/spl-token') as {
      AccountLayout: {
        decode: jest.Mock<(data: Buffer) => { owner: PublicKey }>
      }
    }
    splToken.AccountLayout.decode
      .mockImplementationOnce(() => ({ owner: new PublicKey('OWNER_1') }))
      .mockImplementationOnce(() => ({ owner: new PublicKey('OWNER_1') }))

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
        tx_metadata: 'RECEIVER_1',
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

    expect(getAccountInfoMock).toHaveBeenCalledTimes(2)
    expect(splToken.AccountLayout.decode).toHaveBeenCalledTimes(2)
    expect(sendTransactionalEmailSpy).toHaveBeenCalledTimes(0)
  })

  test('when token owners do not match, a notification is sent', async () => {
    getAccountInfoMock
      .mockResolvedValueOnce({ data: Buffer.from([]) })
      .mockResolvedValueOnce({ data: Buffer.from([]) })

    const splToken = jest.requireMock('@solana/spl-token') as {
      AccountLayout: {
        decode: jest.Mock<(data: Buffer) => { owner: PublicKey }>
      }
    }
    splToken.AccountLayout.decode
      .mockImplementationOnce(() => ({ owner: new PublicKey('OWNER_1') }))
      .mockImplementationOnce(() => ({ owner: new PublicKey('OWNER_2') }))

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
        tx_metadata: 'RECEIVER_2',
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

    expect(getAccountInfoMock).toHaveBeenCalledTimes(2)
    expect(splToken.AccountLayout.decode).toHaveBeenCalledTimes(2)
    expect(sendTransactionalEmailSpy).toHaveBeenCalledTimes(1)
  })
})
