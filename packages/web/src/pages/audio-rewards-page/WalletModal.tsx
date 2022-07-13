import { ReactNode, useCallback } from 'react'

import { IconDiscord } from '@audius/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { ReactComponent as IconReceive } from 'assets/img/iconReceive.svg'
import { ReactComponent as IconSend } from 'assets/img/iconSend.svg'
import { Chain } from 'common/models/Chain'
import { BNWei, StringWei, WalletAddress } from 'common/models/Wallet'
import { FeatureFlags } from 'common/services/remote-config'
import { getAccountUser } from 'common/store/account/selectors'
import {
  getHasAssociatedWallets,
  getAssociatedWallets,
  getDiscordCode,
  getModalState,
  getModalVisible,
  getRemoveWallet,
  getSendData
} from 'common/store/pages/token-dashboard/selectors'
import {
  confirmSend,
  inputSendData,
  setModalVisibility
} from 'common/store/pages/token-dashboard/slice'
import { ModalState } from 'common/store/pages/token-dashboard/types'
import { getAccountBalance } from 'common/store/wallet/selectors'
import { Nullable } from 'common/utils/typeUtils'
import { stringWeiToBN, weiToString } from 'common/utils/wallet'
import SocialProof from 'components/social-proof/SocialProof'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { getFeatureEnabled } from 'services/remote-config/featureFlagHelpers'
import { isMobile } from 'utils/clientUtil'
import { useSelector } from 'utils/reducer'
import { AUDIUS_DISCORD_LINK } from 'utils/route'

import styles from './WalletModal.module.css'
import ConnectWalletsBody from './components/ConnectWalletsBody'
import DiscordModalBody from './components/DiscordModalBody'
import ErrorBody from './components/ErrorBody'
import MigrationModalBody from './components/MigrationModalBody'
import ReceiveBody from './components/ReceiveBody'
import RemoveWalletBody from './components/RemoveWalletBody'
import SendInputBody from './components/SendInputBody'
import SendInputConfirmation from './components/SendInputConfirmation'
import SendInputSuccess from './components/SendInputSuccess'
import SendingModalBody from './components/SendingModalBody'
import ModalDrawer from './components/modals/ModalDrawer'

const messages = {
  receive: 'Receive $AUDIO',
  receiveSPL: 'Receive SPL $AUDIO',
  send: 'Send $AUDIO',
  confirmSend: 'Send $AUDIO',
  sending: 'Your $AUDIO is Sending',
  sent: 'Your $AUDIO Has Been Sent',
  sendError: 'Uh oh! Something went wrong sending your $AUDIO.',
  discord: 'Launch the VIP Discord',
  connectOtherWallets: 'Connect Other Wallets',
  manageWallets: 'Manage Wallets',
  removeWallets: 'Remove Wallet',
  awaitConvertingEthToSolAudio: 'Hold On a Moment'
}

const TitleWrapper = ({
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

const AddWalletTitle = () => {
  const hasMultipleWallets = useSelector(getHasAssociatedWallets)
  return (
    <>
      {hasMultipleWallets
        ? messages.manageWallets
        : messages.connectOtherWallets}
    </>
  )
}

const titlesMap = {
  CONNECT_WALLETS: {
    ADD_WALLET: () => <AddWalletTitle />,
    REMOVE_WALLET: () => messages.removeWallets,
    ERROR: () => messages.sendError
  },
  RECEIVE: {
    KEY_DISPLAY: () => {
      const useSolSPLAudio = getFeatureEnabled(
        FeatureFlags.ENABLE_SPL_AUDIO
      ) as boolean
      return (
        <TitleWrapper
          label={useSolSPLAudio ? messages.receiveSPL : messages.receive}>
          <IconReceive className={styles.receiveWrapper} />
        </TitleWrapper>
      )
    }
  },
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
  },
  DISCORD: () =>
    isMobile() ? (
      <div className={styles.discordDrawerTitle}>{messages.discord}</div>
    ) : (
      <TitleWrapper label={messages.discord}>
        <IconDiscord />
      </TitleWrapper>
    )
}

const getTitle = (state: ModalState) => {
  if (!state?.stage) return ''
  switch (state.stage) {
    case 'CONNECT_WALLETS':
      return titlesMap.CONNECT_WALLETS[state.flowState.stage]()
    case 'RECEIVE':
      return titlesMap.RECEIVE[state.flowState.stage]()
    case 'SEND':
      return titlesMap.SEND[state.flowState.stage]()
    case 'DISCORD_CODE':
      return titlesMap.DISCORD()
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
  modalState: ModalState
  onInputSendData: (amount: BNWei, wallet: WalletAddress, chain: Chain) => void
  onConfirmSend: () => void
  onClose: () => void
  onLaunchDiscord: () => void
}

const ModalContent = ({
  modalState,
  onInputSendData,
  onConfirmSend,
  onClose,
  onLaunchDiscord
}: ModalContentProps) => {
  const balance: BNWei =
    useSelector(getAccountBalance) ?? stringWeiToBN('0' as StringWei)
  const account = useSelector(getAccountUser)
  const amountPendingTransfer = useSelector(getSendData)
  const discordCode = useSelector(getDiscordCode)
  const useSolSPLAudio = getFeatureEnabled(
    FeatureFlags.ENABLE_SPL_AUDIO
  ) as boolean

  if (!modalState || !account || (useSolSPLAudio && !account.userBank)) {
    return null
  }

  // @ts-ignore
  // TODO: user models need to have wallets
  const wallet = account.wallet as WalletAddress

  const solWallet = account.userBank!

  // This silly `ret` dance is to satisfy
  // TS's no-fallthrough rule...
  let ret: Nullable<JSX.Element> = null

  switch (modalState.stage) {
    case 'CONNECT_WALLETS': {
      const claimStage = modalState.flowState
      switch (claimStage.stage) {
        case 'ADD_WALLET':
          ret = <ConnectWalletsBody />
          break
        case 'REMOVE_WALLET':
          ret = <RemoveWalletBody />
          break
      }
      break
    }
    case 'RECEIVE': {
      ret = <ReceiveBody wallet={wallet} solWallet={solWallet} />
      break
    }
    case 'SEND': {
      const sendStage = modalState.flowState
      switch (sendStage.stage) {
        case 'INPUT':
          ret = (
            <SendInputBody
              currentBalance={balance}
              onSend={onInputSendData}
              wallet={wallet}
              solWallet={solWallet}
            />
          )
          break
        case 'AWAITING_CONFIRMATION':
          if (!amountPendingTransfer) return null
          ret = (
            <SendInputConfirmation
              amountToTransfer={amountPendingTransfer.amount}
              recipientAddress={amountPendingTransfer.recipientWallet}
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
              amountToTransfer={amountPendingTransfer.amount}
              recipientAddress={amountPendingTransfer.recipientWallet}
            />
          )
          break
        case 'CONFIRMED_SEND':
          if (!amountPendingTransfer) return null
          ret = (
            <SendInputSuccess
              sentAmount={amountPendingTransfer.amount}
              recipientAddress={amountPendingTransfer.recipientWallet}
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
    case 'DISCORD_CODE': {
      ret = (
        <DiscordModalBody
          discordCode={discordCode}
          onClickLaunch={onLaunchDiscord}
        />
      )
      break
    }
  }
  return ret
}

const shouldAllowDismiss = (modalState: Nullable<ModalState>) => {
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
      modalState.stage === 'CONNECT_WALLETS' &&
      modalState.flowState.stage === 'REMOVE_WALLET'
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
    amount: BNWei,
    wallet: WalletAddress,
    chain: Chain
  ) => {
    const stringWei = weiToString(amount)
    dispatch(inputSendData({ amount: stringWei, wallet, chain }))
  }

  const onConfirmSend = () => {
    dispatch(confirmSend())
  }

  const onLaunchDiscord = () => {
    window.open(AUDIUS_DISCORD_LINK, '_blank')
  }

  const { status } = useSelector(getAssociatedWallets)
  const removeWallets = useSelector(getRemoveWallet)
  const isWalletConfirming =
    removeWallets.status === 'Confirming' ||
    status === 'Connecting' ||
    status === 'Confirming'
  const allowDismiss = !isWalletConfirming && shouldAllowDismiss(modalState)

  const wm = useWithMobileStyle(styles.mobile)

  return (
    <>
      <ModalDrawer
        isOpen={modalVisible}
        onClose={onClose}
        bodyClassName={cn(styles.modalBody, {
          [styles.wallets]: modalState?.stage === 'CONNECT_WALLETS',
          [styles.convertingEth]:
            modalState &&
            'flowState' in modalState &&
            modalState.flowState?.stage ===
              'AWAITING_CONVERTING_ETH_AUDIO_TO_SOL'
        })}
        showTitleHeader
        title={getTitle(modalState)}
        showDismissButton={allowDismiss}
        dismissOnClickOutside={allowDismiss}
        contentHorizontalPadding={24}
        useGradientTitle={false}>
        <div
          className={wm(styles.modalContainer, {
            [styles.sendModalContainer]: modalState?.stage === 'SEND'
          })}>
          <ModalContent
            modalState={modalState}
            onInputSendData={onInputSendData}
            onConfirmSend={onConfirmSend}
            onClose={onClose}
            onLaunchDiscord={onLaunchDiscord}
          />
        </div>
      </ModalDrawer>
      {/* On social proof success, open the wallet modal and confirm send */}
      <SocialProof onSuccess={openAndConfirmSend} />
    </>
  )
}

export default WalletModal
