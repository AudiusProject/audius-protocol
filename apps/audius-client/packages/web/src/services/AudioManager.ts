import { put, call, fork, select } from 'redux-saga/effects'

import { Name } from 'common/models/Analytics'
import { User } from 'common/models/User'
import * as errorActions from 'common/store/errors/actions'
import { getModalVisibility, setVisibility } from 'common/store/ui/modals/slice'
import { Nullable } from 'common/utils/typeUtils'
import AudiusBackend from 'services/AudiusBackend'
import walletClient from 'services/wallet-client/WalletClient'
import { make } from 'store/analytics/actions'
import { setState as setAudioManagerReduxState } from 'store/audio-manager/slice'

export enum AudioManagerState {
  HasEthAudioInHedgehog = 'HAS_ETH_AUDIO_IN_HEDGEHOG',
  HasRequestedMoveEthAudioInHedgehog = 'HAS_REQUESTED_MOVE_ETH_AUDIO_IN_HEDGEHOG',
  TransferringEthAudioInHedgehogToSPLBankAccount = 'TRANSFERING_ETH_AUDIO_IN_HEDGEHOG_TO_SPL_BANK_ACCOUNT',
  ErrorTransferringEthAudioInHedgehogToSPLBankAccount = 'ERROR_TRANSFERING_ETH_AUDIO_IN_HEDGEHOG_TO_SPL_BANK_ACCOUNT',
  HasNoEthAudioInHedgehog = 'HAS_NO_ETH_AUDIO_IN_HEDGEHOG'
}

type AudioManagerProps = {
  requestTransferAudioToWAudio: Generator<any, boolean, unknown>
}

class AudioManager {
  state: Nullable<AudioManagerState>
  requestTransferAudioToWAudio: Generator<any, boolean, unknown>
  constructor({ requestTransferAudioToWAudio }: AudioManagerProps) {
    this.state = null
    this.requestTransferAudioToWAudio = requestTransferAudioToWAudio

    this.getInitState = this.getInitState.bind(this)
    this.updateState = this.updateState.bind(this)
    this.updateStatePhase = this.updateStatePhase.bind(this)
    this.updateStateMovAudioToWAudio = this.updateStateMovAudioToWAudio.bind(
      this
    )
  }

  *getInitState() {
    const user: User = yield call(AudiusBackend.getAccount)
    if (user.balance === '0') {
      yield call(
        this.updateStatePhase,
        AudioManagerState.HasNoEthAudioInHedgehog
      )
      this.state = AudioManagerState.HasNoEthAudioInHedgehog
      return this.state
    }
    yield call(this.updateStatePhase, AudioManagerState.HasEthAudioInHedgehog)
    return this.state
  }

  *updateState() {
    switch (this.state) {
      case AudioManagerState.HasEthAudioInHedgehog:
        yield call(this.updateStateMovAudioToWAudio)
        break
      default:
    }
  }

  *updateStateMovAudioToWAudio() {
    const account: User = yield call(AudiusBackend.getAccount)
    yield put(
      make(Name.TRANSFER_AUDIO_TO_WAUDIO_REQUEST, { from: account?.wallet })
    )

    yield call(
      this.updateStatePhase,
      AudioManagerState.HasRequestedMoveEthAudioInHedgehog
    )

    // @ts-ignore
    yield call(this.requestTransferAudioToWAudio)
    yield call(
      this.updateStatePhase,
      AudioManagerState.TransferringEthAudioInHedgehogToSPLBankAccount
    )
    try {
      yield fork(this.closeTimeoutConfirmAudioToWAudioModal)
      yield call(this.transferAudioToWAudio)
      yield call(
        this.updateStatePhase,
        AudioManagerState.HasNoEthAudioInHedgehog
      )
      yield put(
        make(Name.TRANSFER_AUDIO_TO_WAUDIO_SUCCESS, { from: account?.wallet })
      )
    } catch (error) {
      yield call(
        this.updateStatePhase,
        AudioManagerState.ErrorTransferringEthAudioInHedgehogToSPLBankAccount
      )
      yield put(
        make(Name.TRANSFER_AUDIO_TO_WAUDIO_FAILURE, { from: account?.wallet })
      )

      yield put(
        errorActions.handleError({
          message: 'Error Transferring AUDIO to WAUDIO',
          shouldRedirect: false,
          shouldReport: true,
          additionalInfo: { errorMessage: error.message },
          level: errorActions.Level.Critical
        })
      )
    }
  }

  *updateStatePhase(state: AudioManagerState) {
    this.state = state
    yield put(setAudioManagerReduxState({ state }))
  }

  async transferAudioToWAudio() {
    const balance = await walletClient.getCurrentBalance(true /** bustCache */)
    await AudiusBackend.transferAudioToWAudio(balance)
  }

  *closeTimeoutConfirmAudioToWAudioModal() {
    const WAITING_TIMEOUT = 2 /* sec */ * 1000 /* ms */
    const timeout = new Promise(resolve => setTimeout(resolve, WAITING_TIMEOUT))
    yield timeout
    const isModalOpen: ReturnType<typeof getModalVisibility> = yield select(
      getModalVisibility,
      'ConfirmAudioToWAudio'
    )
    if (isModalOpen)
      yield put(
        setVisibility({ modal: 'ConfirmAudioToWAudio', visible: false })
      )
  }
}

export default AudioManager
