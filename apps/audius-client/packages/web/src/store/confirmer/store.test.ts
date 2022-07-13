import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'

import * as actions from 'store/confirmer/actions'
import reducer from 'store/confirmer/reducer'
import * as sagas from 'store/confirmer/sagas'

import { ConfirmationOptions } from './types'

const initialState = {
  confirm: {},
  complete: {},
  operationSuccessCallIdx: {}
}

describe('requestConfirmation', () => {
  it('makes success call', async () => {
    const confirm = jest.fn().mockResolvedValue(1)
    const success = jest.fn()

    const { storeState } = await expectSaga(sagas.watchRequestConfirmation)
      .withReducer(
        combineReducers({
          confirmer: reducer
        }),
        {
          confirmer: initialState
        }
      )
      .dispatch(actions.requestConfirmation('111', confirm, success))
      .put(actions._addConfirmationCall('111', confirm))
      .put(actions._setConfirmationResult('111', 1, 0))
      .put(actions._addCompletionCall('111', call(success, 1)))
      .put(actions._clearComplete('111', 0))
      .put(actions._clearConfirm('111'))
      .silentRun()
    expect(storeState.confirmer).toEqual(initialState)
    expect(confirm).toBeCalled()
    expect(success).toBeCalledWith(1)
  })

  it('chains calls', async () => {
    const confirm1 = jest.fn().mockResolvedValue(1)
    const success1 = jest.fn()

    const confirm2 = jest.fn().mockResolvedValue(2)
    const success2 = jest.fn()
    const fail2 = jest.fn()

    const { storeState } = await expectSaga(sagas.watchRequestConfirmation)
      .withReducer(
        combineReducers({
          confirmer: reducer
        }),
        {
          confirmer: initialState
        }
      )
      .dispatch(actions.requestConfirmation('111', confirm1, success1))
      .dispatch(
        actions.requestConfirmation(
          '111',
          confirm2,
          success2,
          fail2,
          (result: number) => result // pass previous result to this confirmation call
        )
      )
      .put(actions._addConfirmationCall('111', confirm1))
      .put(actions._addConfirmationCall('111', confirm2))
      .put(actions._setConfirmationResult('111', 1, 0))
      .put(actions._addCompletionCall('111', call(success1, 1)))
      .put(actions._setConfirmationResult('111', 2, 1))
      .put(actions._addCompletionCall('111', call(success2, 2)))
      .put(actions._clearComplete('111', 1))
      .put(actions._clearConfirm('111'))
      .silentRun()
    expect(storeState.confirmer).toEqual(initialState)
    expect(confirm1).toBeCalled()
    expect(success1).toBeCalledWith(1)
    expect(confirm2).toBeCalledWith(1)
    expect(success2).toBeCalledWith(2)
  })

  it('chains calls and uses results selector', async () => {
    const confirm1 = jest.fn().mockResolvedValue({ id: 1 })
    const success1 = jest.fn()

    const confirm2 = jest.fn().mockResolvedValue({ id: 2 })
    const success2 = jest.fn()
    const fail2 = jest.fn()

    const { storeState } = await expectSaga(sagas.watchRequestConfirmation)
      .withReducer(
        combineReducers({
          confirmer: reducer
        }),
        {
          confirmer: initialState
        }
      )
      .dispatch(actions.requestConfirmation('111', confirm1, success1))
      .dispatch(
        actions.requestConfirmation(
          '111',
          confirm2,
          success2,
          fail2,
          (result: { id: number }) => result.id // pass the previous result id to this confirmation call
        )
      )
      .put(actions._addConfirmationCall('111', confirm1))
      .put(actions._addConfirmationCall('111', confirm2))
      .put(actions._setConfirmationResult('111', { id: 1 }, 0))
      .put(actions._addCompletionCall('111', call(success1, { id: 1 })))
      .put(actions._setConfirmationResult('111', { id: 2 }, 1))
      .put(actions._addCompletionCall('111', call(success2, { id: 2 })))
      .put(actions._clearComplete('111', 1))
      .put(actions._clearConfirm('111'))
      .silentRun()
    expect(storeState.confirmer).toEqual(initialState)
    expect(confirm1).toBeCalled()
    expect(success1).toBeCalledWith({ id: 1 })
    expect(confirm2).toBeCalledWith(1)
    expect(success2).toBeCalledWith({ id: 2 })
  })

  it('makes fail call', async () => {
    const confirm = jest.fn((_) => {
      throw new Error('Error Message')
    })
    const success = jest.fn()
    const fail = jest.fn()

    const { storeState } = await expectSaga(sagas.watchRequestConfirmation)
      .withReducer(
        combineReducers({
          confirmer: reducer
        }),
        {
          confirmer: initialState
        }
      )
      .dispatch(actions.requestConfirmation('111', confirm, success, fail))
      .put(actions._addConfirmationCall('111', confirm))
      .put(
        actions._setConfirmationResult(
          '111',
          {
            error: true,
            message: 'Error Message',
            timeout: false
          },
          0
        )
      )
      .put(
        actions._addCompletionCall(
          '111',
          call(fail, { error: true, message: 'Error Message', timeout: false })
        )
      )
      .put(actions._clearComplete('111', 0))
      .put(actions._clearConfirm('111'))
      .silentRun()
    expect(storeState.confirmer).toEqual(initialState)
    expect(confirm).toBeCalled()
    expect(fail).toBeCalledWith({
      error: true,
      message: 'Error Message',
      timeout: false
    })
  })

  it('handles multiple chains', async () => {
    const confirm11 = jest.fn().mockResolvedValue(11)
    const success11 = jest.fn()

    const confirm12 = jest.fn().mockResolvedValue(12)
    const success12 = jest.fn()

    const confirm21 = jest.fn().mockResolvedValue(21)
    const success21 = jest.fn()

    const confirm22 = jest.fn().mockResolvedValue(22)
    const success22 = jest.fn()

    const { storeState } = await expectSaga(sagas.watchRequestConfirmation)
      .withReducer(
        combineReducers({
          confirmer: reducer
        }),
        {
          confirmer: initialState
        }
      )
      .dispatch(actions.requestConfirmation('111', confirm11, success11))
      .dispatch(actions.requestConfirmation('111', confirm12, success12))
      .dispatch(actions.requestConfirmation('222', confirm21, success21))
      .dispatch(actions.requestConfirmation('222', confirm22, success22))
      .put(actions._addConfirmationCall('111', confirm11))
      .put(actions._addConfirmationCall('111', confirm12))
      .put(actions._addConfirmationCall('222', confirm21))
      .put(actions._addConfirmationCall('222', confirm22))

      .put(actions._setConfirmationResult('111', 11, 0, true))
      .put(actions._addCompletionCall('111', call(success11, 11)))
      .put(actions._setConfirmationResult('111', 12, 1, true))
      .put(actions._addCompletionCall('111', call(success12, 12)))

      .put(actions._setConfirmationResult('222', 21, 0))
      .put(actions._addCompletionCall('222', call(success21, 21)))
      .put(actions._setConfirmationResult('222', 22, 1, true))
      .put(actions._addCompletionCall('222', call(success22, 22)))
      .put(actions._clearComplete('111', 1))
      .put(actions._clearConfirm('111'))
      .put(actions._clearComplete('222', 1))
      .put(actions._clearConfirm('222'))
      .silentRun()
    expect(storeState.confirmer).toEqual(initialState)
    expect(confirm11).toBeCalled()
    expect(success11).toBeCalledWith(11)
    expect(confirm12).toBeCalled()
    expect(success12).toBeCalledWith(12)

    expect(confirm21).toBeCalled()
    expect(success21).toBeCalledWith(21)
    expect(confirm22).toBeCalled()
    expect(success22).toBeCalledWith(22)
  })
})

describe('requestConfirmation timeouts', () => {
  const timeout = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))

  it('fails on timeout', async () => {
    const confirm1 = async () => {
      await timeout(10)
      return 1
    }
    const success1 = jest.fn()
    const fail1 = jest.fn()

    const confirm2 = async () => {
      await timeout(200) // will timeout
      return 2
    }
    const success2 = jest.fn()
    const fail2 = jest.fn()

    const { storeState } = await expectSaga(sagas.watchRequestConfirmation)
      .withReducer(
        combineReducers({
          confirmer: reducer
        }),
        {
          confirmer: initialState
        }
      )
      .dispatch(
        actions.requestConfirmation(
          '111',
          confirm1,
          success1,
          fail1,
          (result: number) => result, // pass previous result to this confirmation call,
          100 // ms
        )
      )
      .dispatch(
        actions.requestConfirmation(
          '111',
          confirm2,
          success2,
          fail2,
          (result: number) => result, // pass previous result to this confirmation call
          100 // ms
        )
      )
      .put(actions._addConfirmationCall('111', confirm1))
      .put(actions._addConfirmationCall('111', confirm2))
      .put(actions._setConfirmationResult('111', 1, 0))
      .put(actions._addCompletionCall('111', call(success1, 1)))
      .put(
        actions._setConfirmationResult('111', { error: true, timeout: true }, 1)
      )
      .put(
        actions._addCompletionCall(
          '111',
          call(fail2, { error: true, timeout: true })
        )
      )
      .put(actions._clearComplete('111', 1))
      .put(actions._clearConfirm('111'))
      .silentRun()
    expect(storeState.confirmer).toEqual(initialState)
    expect(success1).toBeCalledWith(1)
    expect(fail2).toBeCalled()
  })
})

it('handles parallelization', async () => {
  const confirm11 = jest.fn().mockResolvedValue(11)
  const success11 = jest.fn()

  const confirm12 = jest.fn().mockResolvedValue(12)
  const success12 = jest.fn()

  const confirm13 = jest.fn().mockResolvedValue(13)
  const success13 = jest.fn()

  const confirm14 = jest.fn().mockResolvedValue(14)
  const success14 = jest.fn()

  const confirmationOptions = {
    operationId: 'test',
    parallelizable: true
  } as ConfirmationOptions
  const { storeState } = await expectSaga(sagas.watchRequestConfirmation)
    .withReducer(
      combineReducers({
        confirmer: reducer
      }),
      {
        confirmer: initialState
      }
    )
    .dispatch(
      actions.requestConfirmation(
        '111',
        confirm11,
        success11,
        undefined,
        undefined,
        undefined,
        confirmationOptions
      )
    )
    .dispatch(
      actions.requestConfirmation(
        '111',
        confirm12,
        success12,
        undefined,
        undefined,
        undefined,
        confirmationOptions
      )
    )
    .dispatch(
      actions.requestConfirmation(
        '111',
        confirm13,
        success13,
        undefined,
        undefined,
        undefined,
        confirmationOptions
      )
    )
    .dispatch(
      actions.requestConfirmation(
        '111',
        confirm14,
        success14,
        undefined,
        undefined,
        undefined,
        confirmationOptions
      )
    )
    .put(actions._addConfirmationCall('111', confirm11, confirmationOptions))
    .put(actions._addConfirmationCall('111', confirm13, confirmationOptions))
    .put(actions._addConfirmationCall('111', confirm14, confirmationOptions))
    .put(actions._setConfirmationResult('111', 11, 0, false))
    .put(actions._addCompletionCall('111', call(success11, 11)))
    .put(actions._setConfirmationResult('111', 12, 1, false))
    .put(actions._addCompletionCall('111', call(success12, 12)))
    .put(actions._setConfirmationResult('111', 13, 2, false))
    .put(actions._addCompletionCall('111', call(success13, 13)))
    .put(actions._setConfirmationResult('111', 14, 3, false))
    .put(actions._addCompletionCall('111', call(success14, 14)))
    .put(actions._clearComplete('111', 3))
    .put(actions._clearConfirm('111'))
    .silentRun()
  expect(storeState.confirmer).toEqual(initialState)
  expect(confirm11).toBeCalled()
  expect(success11).toBeCalledWith(11)
  expect(confirm12).toBeCalled()
  expect(success12).toBeCalledWith(12)
  expect(confirm13).toBeCalled()
  expect(success13).toBeCalledWith(13)
  expect(confirm14).toBeCalled()
  expect(success14).toBeCalledWith(14)
})

it('handles squashable calls', async () => {
  const confirm11 = jest.fn().mockResolvedValue(11)
  const success11 = jest.fn()

  const confirm12 = jest.fn().mockResolvedValue(12)
  const success12 = jest.fn()

  const confirm13 = jest.fn().mockResolvedValue(13)
  const success13 = jest.fn()

  const confirm14 = jest.fn().mockResolvedValue(14)
  const success14 = jest.fn()

  const confirmationOptions = {
    operationId: 'test',
    squashable: true
  } as ConfirmationOptions
  const { storeState } = await expectSaga(sagas.watchRequestConfirmation)
    .withReducer(
      combineReducers({
        confirmer: reducer
      }),
      {
        confirmer: initialState
      }
    )
    .dispatch(
      actions.requestConfirmation(
        '111',
        confirm11,
        success11,
        undefined,
        undefined,
        undefined,
        confirmationOptions
      )
    )
    .dispatch(
      actions.requestConfirmation(
        '111',
        confirm12,
        success12,
        undefined,
        undefined,
        undefined,
        confirmationOptions
      )
    )
    .dispatch(
      actions.requestConfirmation(
        '111',
        confirm13,
        success13,
        undefined,
        undefined,
        undefined,
        confirmationOptions
      )
    )
    .dispatch(
      actions.requestConfirmation(
        '111',
        confirm14,
        success14,
        undefined,
        undefined,
        undefined,
        confirmationOptions
      )
    )
    .put(actions._addConfirmationCall('111', confirm11, confirmationOptions))
    .put(actions._addConfirmationCall('111', confirm12, confirmationOptions))
    .put(actions._addConfirmationCall('111', confirm13, confirmationOptions))
    .put(actions._addConfirmationCall('111', confirm14, confirmationOptions))
    .put(actions._setConfirmationResult('111', 11, 0, true))
    .put(actions._addCompletionCall('111', call(success11, 11)))
    .put(actions._setConfirmationResult('111', 14, 3, true))
    .put(actions._addCompletionCall('111', call(success14, 14)))
    .put(actions._clearConfirm('111'))
    .silentRun()
  expect(storeState.confirmer).toEqual(initialState)
  expect(confirm11).toBeCalled()
  expect(success11).toBeCalledWith(11)
  expect(confirm14).toBeCalled()
  expect(success14).toBeCalledWith(14)
})

it('only calls the success call of the last function to resolve if `useOnlyLastSuccessCall` is passed', async () => {
  const confirm11 = jest.fn().mockResolvedValue(11)
  const success11 = jest.fn()

  const confirm12 = jest.fn().mockResolvedValue(12)
  const success12 = jest.fn()

  const confirmationOptions = {
    operationId: 'test',
    useOnlyLastSuccessCall: true
  } as ConfirmationOptions
  const { storeState } = await expectSaga(sagas.watchRequestConfirmation)
    .withReducer(
      combineReducers({
        confirmer: reducer
      }),
      {
        confirmer: initialState
      }
    )
    .dispatch(
      actions.requestConfirmation(
        '111',
        confirm11,
        success11,
        undefined,
        undefined,
        undefined,
        confirmationOptions
      )
    )
    .dispatch(
      actions.requestConfirmation(
        '111',
        confirm12,
        success12,
        undefined,
        undefined,
        undefined,
        confirmationOptions
      )
    )
    .put(actions._addConfirmationCall('111', confirm11, confirmationOptions))
    .put(actions._addConfirmationCall('111', confirm12, confirmationOptions))
    .put(actions._setConfirmationResult('111', 11, 0, true))
    .put(actions._setOperationSuccessCall('111', 'test', call(success11, 11)))
    .put(actions._setConfirmationResult('111', 12, 1, true))
    .put(actions._setOperationSuccessCall('111', 'test', call(success12, 12)))
    .put(actions._clearComplete('111', 1))
    .put(actions._clearConfirm('111'))
    .silentRun()
  expect(storeState.confirmer).toEqual(initialState)
  expect(confirm11).toBeCalled()
  expect(success11).not.toBeCalled()
  expect(confirm12).toBeCalled()
  expect(success12).toBeCalledWith(12)
})
