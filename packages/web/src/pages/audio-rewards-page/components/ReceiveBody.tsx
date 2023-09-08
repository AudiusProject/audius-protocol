import { useEffect } from 'react'

import {
  SolanaWalletAddress,
  WalletAddress,
  FeatureFlags,
  createUserBankIfNeeded,
  solanaSelectors
} from '@audius/common'
import { Button, ButtonType, LogoSol } from '@audius/stems'
import cn from 'classnames'

import { useSelector } from 'common/hooks/useSelector'
import { useLocalStorage } from 'hooks/useLocalStorage'
import { track } from 'services/analytics'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { getFeatureEnabled } from 'services/remote-config/featureFlagHelpers'

import { ModalBodyWrapper } from '../WalletModal'

import ClickableAddress from './ClickableAddress'
import styles from './ReceiveBody.module.css'

const { getFeePayer } = solanaSelectors

type ReceiveBodyProps = {
  wallet: WalletAddress
  solWallet: SolanaWalletAddress
}

const messages = {
  warning: 'PROCEED WITH CAUTION',
  warning2: 'If $AUDIO is sent to the wrong address it will be lost.',
  warning3: "Don't attempt to send tokens other than $AUDIO to this address.",
  splWarning1: (
    <>
      {'You can only send Solana (SPL) '}
      <b className={styles.audio}>{'$AUDIO'}</b> {' tokens to this address.'}
    </>
  ),
  splWarning2: 'Be sure to send your $AUDIO to the correct address!',
  splWarning3: 'Be careful, tokens are easy to lose and impossible to recover.',
  understand: 'I UNDERSTAND',
  yourAddress: 'YOUR ADDRESS',
  clickableSPLAddressTitle: 'YOUR SPL $AUDIO ADDRESS'
}

const useLocalStorageClickedReceiveUnderstand = (): [boolean, () => void] => {
  const key = 'receiveSPLAudioUnderstand'
  const [hasClickedUnderstand, setHasClickedUnderstand] = useLocalStorage(
    key,
    false
  )
  const onClickUnderstand = () => {
    setHasClickedUnderstand(true)
  }
  return [hasClickedUnderstand, onClickUnderstand]
}

const useCreateUserbankIfNeeded = () => {
  const feePayerOverride = useSelector(getFeePayer)

  useEffect(() => {
    if (!feePayerOverride) return
    createUserBankIfNeeded(audiusBackendInstance, {
      recordAnalytics: track,
      feePayerOverride
    })
  }, [feePayerOverride])
}

const ReceiveBody = ({ wallet, solWallet }: ReceiveBodyProps) => {
  const useSolSPLAudio = getFeatureEnabled(
    FeatureFlags.ENABLE_SPL_AUDIO
  ) as boolean
  const [hasClickedUnderstand, onClickUnderstand] =
    useLocalStorageClickedReceiveUnderstand()

  useCreateUserbankIfNeeded()

  const renderReceiveEth = () => {
    return (
      <>
        <div className={styles.warning}>{messages.warning}</div>
        <div className={styles.description}>
          <div>{messages.warning2}</div>
          <div>{messages.warning3}</div>
        </div>
        <ClickableAddress address={wallet} />
      </>
    )
  }

  const renderSolAudioHeader = () => {
    return (
      <div className={styles.solClickableHeader}>
        <div className={styles.iconSolContainer}>
          <LogoSol className={styles.iconSolHeader} />
        </div>
        <span>{messages.clickableSPLAddressTitle}</span>
      </div>
    )
  }
  const renderReceiveSol = () => {
    return (
      <>
        <div className={styles.warning}>{messages.warning}</div>
        <div className={styles.description}>
          <LogoSol className={styles.chainIconSol} />
          <ul className={styles.splWarning}>
            <li>{messages.splWarning1}</li>
            <li>{messages.splWarning2}</li>
            <li>{messages.splWarning3}</li>
          </ul>
        </div>
        {hasClickedUnderstand ? (
          <ClickableAddress
            label={renderSolAudioHeader()}
            address={solWallet}
          />
        ) : (
          <Button
            text={messages.understand}
            onClick={onClickUnderstand}
            textClassName={styles.understandText}
            type={ButtonType.PRIMARY_ALT}
          />
        )}
      </>
    )
  }

  return (
    <ModalBodyWrapper
      className={cn(styles.container, {
        [styles.solContainer]: useSolSPLAudio
      })}
    >
      {useSolSPLAudio ? renderReceiveSol() : renderReceiveEth()}
    </ModalBodyWrapper>
  )
}

export default ReceiveBody
