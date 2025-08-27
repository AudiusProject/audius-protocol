import { ReactNode, useCallback } from 'react'

import {
  useAudioBalance,
  useCurrentAccountUser,
  useQueryContext
} from '@audius/common/api'
import {
  Chain,
  WalletAddress,
  SolanaWalletAddress,
  StringWei
} from '@audius/common/models'
import {
  tokenDashboardPageSelectors,
  tokenDashboardPageActions,
  TokenDashboardPageModalState
} from '@audius/common/store'
import { Nullable } from '@audius/common/utils'
import { AUDIO, AudioWei } from '@audius/fixed-decimal'
import { IconSend } from '@audius/harmony'
import cn from 'classnames'
import { useDispatch } from 'react-redux'
import { useAsync } from 'react-use'

import ResponsiveModal from 'components/modal/ResponsiveModal'
import SocialProof from 'components/social-proof/SocialProof'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { useSelector } from 'utils/reducer'

import styles from './WalletModal.module.css'
import ErrorBody from './components/ErrorBody'
import MigrationModalBody from './components/MigrationModalBody'
import SendInputBody from './components/SendInputBody'
import SendInputConfirmation from './components/SendInputConfirmation'
import SendInputSuccess from './components/SendInputSuccess'
import SendingModalBody from './components/SendingModalBody'
const { getModalState, getModalVisible, getSendData } =
  tokenDashboardPageSelectors
const { confirmSend, inputSendData, setModalVisibility } =
  tokenDashboardPageActions

const messages = {
  send: 'Send $AUDIO',
  confirmSend: 'Send $AUDIO',
  sending: 'Your $AUDIO is Sending',
  sent: 'Your $AUDIO Has Been Sent',
  sendError: 'Uh oh! Something went wrong sending your $AUDIO.',
  connectedWallets: 'Connected Wallets',
  removeWallets: 'Remove Wallet',
  awaitConvertingEthToSolAudio: 'Hold On a Moment'
}

export const TitleWrapper = ({
  children,
  label
}: {
  children: ReactNode
  label: string
}) => {
  return (
    <div className={styles.titleWrapper}>
      {children}
      {label}
    </div>
  )
}

const titlesMap = {
  SEND: {
    INPUT: () => (
      <TitleWrapper label={messages.send}>
        <IconSend className={styles.sendIconWrapper} />
      </TitleWrapper>
    ),
    AWAITING_CONFIRMATION: () => (
      <TitleWrapper label={messages.confirmSend}>
        <IconSend className={styles.sendIconWrapper} />
      </TitleWrapper>
    ),
    AWAITING_CONVERTING_ETH_AUDIO_TO_SOL: () => (
      <>
        <i className={cn('emoji warning', styles.converting)} />
        {messages.awaitConvertingEthToSolAudio}
      </>
    ),
    CONFIRMED_SEND: () => messages.sent,
    SENDING: () => (
      <TitleWrapper label={messages.send}>
        <IconSend className={styles.sending} />
      </TitleWrapper>
    ),
    ERROR: () => messages.sendError
  }
}

const getTitle = (state: TokenDashboardPageModalState) => {
  if (!state?.stage) return ''
  switch (state.stage) {
    case 'SEND':
      return titlesMap.SEND[state.flowState.stage]()
  }
}

/**
 * Common title across modals
 */
export const ModalBodyTitle = ({ text }: { text: string }) => {
  return <div className={styles.title}>{text}</div>
}

export const ModalBodyWrapper = ({
  children,
  className
}: {
  className?: string
  children: ReactNode
}) => {
  return (
    <div className={cn(styles.modalContainer, { [className!]: !!className })}>
      {children}
    </div>
  )
}

type ModalContentProps = {
  modalState: TokenDashboardPageModalState
  onInputSendData: (
    amount: AudioWei,
    wallet: WalletAddress,
    chain: Chain
  ) => void
  onConfirmSend: () => void
  onClose: () => void
}

const ModalContent = ({
  modalState,
  onInputSendData,
  onConfirmSend,
  onClose
}: ModalContentProps) => {
  const { accountBalance: balance } = useAudioBalance()

  const { data: erc_wallet } = useCurrentAccountUser({
    select: (user) => user?.erc_wallet
  })
  const sendData = useSelector(getSendData)
  const amountPendingTransfer = AUDIO(BigInt(sendData?.amount ?? 0)).value
  const recipientWalletAddress = sendData?.recipientWallet ?? ''
  const { audiusSdk } = useQueryContext()

  const { value: solWallet } = useAsync(async () => {
    if (!erc_wallet) return null
    const sdk = await audiusSdk()
    const userBank = await sdk.services.claimableTokensClient.deriveUserBank({
      ethWallet: erc_wallet,
      mint: 'wAUDIO'
    })
    return userBank.toString() as SolanaWalletAddress
  }, [erc_wallet])

  if (!modalState || !erc_wallet || !solWallet) {
    return null
  }

  // This silly `ret` dance is to satisfy
  // TS's no-fallthrough rule...
  let ret: Nullable<JSX.Element> = null

  switch (modalState.stage) {
    case 'SEND': {
      const sendStage = modalState.flowState
      switch (sendStage.stage) {
        case 'INPUT':
          ret = (
            <SendInputBody
              currentBalance={balance}
              onSend={onInputSendData}
              wallet={erc_wallet}
              solWallet={solWallet}
            />
          )
          break
        case 'AWAITING_CONFIRMATION':
          if (!amountPendingTransfer) return null
          ret = (
            <SendInputConfirmation
              amountToTransfer={amountPendingTransfer}
              recipientAddress={recipientWalletAddress}
              onSend={onConfirmSend}
              balance={balance}
            />
          )
          break
        case 'AWAITING_CONVERTING_ETH_AUDIO_TO_SOL':
          ret = <MigrationModalBody />
          break
        case 'SENDING':
          if (!amountPendingTransfer) return null
          ret = (
            <SendingModalBody
              amountToTransfer={amountPendingTransfer}
              recipientAddress={recipientWalletAddress}
            />
          )
          break
        case 'CONFIRMED_SEND':
          if (!amountPendingTransfer) return null
          ret = (
            <SendInputSuccess
              sentAmount={amountPendingTransfer}
              recipientAddress={recipientWalletAddress}
              balance={balance}
            />
          )
          break

        case 'ERROR':
          ret = <ErrorBody error={sendStage.error} onClose={onClose} />
          break
      }
      break
    }
  }
  return ret
}

const shouldAllowDismiss = (
  modalState: Nullable<TokenDashboardPageModalState>
) => {
  // Do not allow dismiss while
  // 1. In the process of sending tokens
  // 2. In the process of removing a connected wallet
  // 3. In the process of transfering audio from eth to sol
  if (!modalState) return true
  return (
    !(
      modalState.stage === 'SEND' && modalState.flowState.stage === 'SENDING'
    ) &&
    !(
      modalState.stage === 'SEND' &&
      modalState.flowState.stage === 'AWAITING_CONVERTING_ETH_AUDIO_TO_SOL'
    )
  )
}

const WalletModal = () => {
  const modalVisible = useSelector(getModalVisible)
  const modalState = useSelector(getModalState)

  const dispatch = useDispatch()
  const onClose = useCallback(() => {
    dispatch(setModalVisibility({ isVisible: false }))
  }, [dispatch])

  const openAndConfirmSend = useCallback(() => {
    dispatch(setModalVisibility({ isVisible: true }))
    dispatch(confirmSend())
  }, [dispatch])

  const onInputSendData = (
    amount: AudioWei,
    wallet: WalletAddress,
    chain: Chain
  ) => {
    const stringWei = amount.toString() as StringWei
    dispatch(inputSendData({ amount: stringWei, wallet }))
  }

  const onConfirmSend = () => {
    dispatch(confirmSend())
  }

  const allowDismiss = shouldAllowDismiss(modalState)

  const wm = useWithMobileStyle(styles.mobile)

  return (
    <>
      <ResponsiveModal
        isOpen={modalVisible}
        onClose={onClose}
        title={getTitle(modalState)}
        showDismissButton={allowDismiss}
        dismissOnClickOutside={allowDismiss}
        className={cn(styles.modalBody, {
          [styles.convertingEth]:
            modalState &&
            'flowState' in modalState &&
            modalState.flowState?.stage ===
              'AWAITING_CONVERTING_ETH_AUDIO_TO_SOL'
        })}
      >
        <div
          className={wm(styles.modalContainer, {
            [styles.sendModalContainer]: modalState?.stage === 'SEND'
          })}
        >
          <ModalContent
            modalState={modalState}
            onInputSendData={onInputSendData}
            onConfirmSend={onConfirmSend}
            onClose={onClose}
          />
        </div>
      </ResponsiveModal>
      {/* On social proof success, open the wallet modal and confirm send */}
      <SocialProof onSuccess={openAndConfirmSend} />
    </>
  )
}

export default WalletModal
