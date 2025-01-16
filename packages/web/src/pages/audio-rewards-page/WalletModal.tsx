import { ReactNode, useCallback } from 'react'

import { useAudiusQueryContext } from '@audius/common/audius-query'
import {
  Chain,
  StringWei,
  BNWei,
  WalletAddress,
  SolanaWalletAddress
} from '@audius/common/models'
import {
  accountSelectors,
  tokenDashboardPageSelectors,
  tokenDashboardPageActions,
  walletSelectors,
  TokenDashboardPageModalState
} from '@audius/common/store'
import { stringWeiToBN, weiToString, Nullable } from '@audius/common/utils'
import {
  IconReceive,
  IconSend,
  IconWallet,
  Modal,
  ModalHeader,
  ModalTitle
} from '@audius/harmony'
import cn from 'classnames'
import { useDispatch } from 'react-redux'
import { useAsync } from 'react-use'

import SocialProof from 'components/social-proof/SocialProof'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { useSelector } from 'utils/reducer'

import styles from './WalletModal.module.css'
import ConnectWalletsBody from './components/ConnectWalletsBody'
import ErrorBody from './components/ErrorBody'
import MigrationModalBody from './components/MigrationModalBody'
import ReceiveBody from './components/ReceiveBody'
import RemoveWalletBody from './components/RemoveWalletBody'
import SendInputBody from './components/SendInputBody'
import SendInputConfirmation from './components/SendInputConfirmation'
import SendInputSuccess from './components/SendInputSuccess'
import SendingModalBody from './components/SendingModalBody'
import ModalDrawer from './components/modals/ModalDrawer'
const { getAccountBalance } = walletSelectors
const {
  getAssociatedWallets,
  getModalState,
  getModalVisible,
  getRemoveWallet,
  getSendData
} = tokenDashboardPageSelectors
const { confirmSend, inputSendData, setModalVisibility } =
  tokenDashboardPageActions
const getAccountUser = accountSelectors.getAccountUser

const messages = {
  receiveSPL: 'Receive SPL $AUDIO',
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
  CONNECT_WALLETS: {
    ADD_WALLET: () => messages.connectedWallets,
    REMOVE_WALLET: () => messages.removeWallets,
    ERROR: () => messages.sendError
  },
  RECEIVE: {
    KEY_DISPLAY: () => {
      return (
        <TitleWrapper label={messages.receiveSPL}>
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
  }
}

const getTitle = (state: TokenDashboardPageModalState) => {
  if (!state?.stage) return ''
  switch (state.stage) {
    case 'CONNECT_WALLETS':
      return titlesMap.CONNECT_WALLETS[state.flowState.stage]()
    case 'RECEIVE':
      return titlesMap.RECEIVE[state.flowState.stage]()
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
  onInputSendData: (amount: BNWei, wallet: WalletAddress, chain: Chain) => void
  onConfirmSend: () => void
  onClose: () => void
}

const ModalContent = ({
  modalState,
  onInputSendData,
  onConfirmSend,
  onClose
}: ModalContentProps) => {
  const balance: BNWei =
    useSelector(getAccountBalance) ?? stringWeiToBN('0' as StringWei)
  const account = useSelector(getAccountUser)
  const amountPendingTransfer = useSelector(getSendData)
  const { audiusSdk } = useAudiusQueryContext()

  const { value: solWallet } = useAsync(async () => {
    if (!account?.erc_wallet) return null
    const sdk = await audiusSdk()
    const userBank = await sdk.services.claimableTokensClient.deriveUserBank({
      ethWallet: account.erc_wallet,
      mint: 'wAUDIO'
    })
    return userBank.toString() as SolanaWalletAddress
  }, [account?.erc_wallet])

  if (!modalState || !account || !solWallet) {
    return null
  }

  const wallet = account.erc_wallet as WalletAddress

  // This silly `ret` dance is to satisfy
  // TS's no-fallthrough rule...
  let ret: Nullable<JSX.Element> = null

  switch (modalState.stage) {
    case 'CONNECT_WALLETS': {
      const claimStage = modalState.flowState
      switch (claimStage.stage) {
        case 'ADD_WALLET':
          ret = <ConnectWalletsBody onClose={onClose} />
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
    dispatch(inputSendData({ amount: stringWei, wallet }))
  }

  const onConfirmSend = () => {
    dispatch(confirmSend())
  }

  const { status } = useSelector(getAssociatedWallets)
  const removeWallets = useSelector(getRemoveWallet)
  const isWalletConfirming =
    removeWallets.status === 'Confirming' ||
    status === 'Connecting' ||
    status === 'Confirming'
  const allowDismiss = !isWalletConfirming && shouldAllowDismiss(modalState)

  const wm = useWithMobileStyle(styles.mobile)

  if (modalState?.stage === 'CONNECT_WALLETS') {
    return (
      <Modal
        size='small'
        isOpen={modalVisible}
        // Disable because web3Modal mounts outside of this component
        // and selecting a provider will close this modal
        dismissOnClickOutside={false}
        onClose={onClose}
      >
        <ModalHeader onClose={onClose}>
          <ModalTitle title={getTitle(modalState)} icon={<IconWallet />} />
        </ModalHeader>
        <ModalContent
          modalState={modalState}
          onInputSendData={onInputSendData}
          onConfirmSend={onConfirmSend}
          onClose={onClose}
        />
      </Modal>
    )
  }

  return (
    <>
      <ModalDrawer
        isOpen={modalVisible}
        onClose={onClose}
        bodyClassName={cn(styles.modalBody, {
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
        useGradientTitle={false}
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
      </ModalDrawer>
      {/* On social proof success, open the wallet modal and confirm send */}
      <SocialProof onSuccess={openAndConfirmSend} />
    </>
  )
}

export default WalletModal
