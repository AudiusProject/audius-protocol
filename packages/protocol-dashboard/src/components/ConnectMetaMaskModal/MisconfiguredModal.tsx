import React, { useEffect, useState } from 'react'

import { useDisconnect, useWeb3ModalProvider } from '@web3modal/ethers/react'

import Button, { ButtonType } from 'components/Button'
import Modal from 'components/Modal'
import { getWalletChainId } from 'services/Audius/setup'
import { CHAIN_ID } from 'utils/eth'
import { decimalNetworkIdToHexNetworkId } from 'utils/switchNetwork'

import styles from './MisconfiguredModal.module.css'

const messages = {
  misconfiguredTitle: 'Your Wallet is Misconfigured',
  okayBtn: 'OKAY',
  openExtensionBtn: 'Open Wallet',
  disconnectBtn: 'Disconnect',
  setEthereumMainnet:
    'Please make sure your wallet network is set to the Ethereum Mainnet.',
  tryDisconnecting: 'Please try disconnecting and connecting your wallet again.'
}

type ContentProps = {
  onClose: () => void
}

const MisconfiguredWalletContent = ({ onClose }: ContentProps) => {
  const { walletProvider } = useWeb3ModalProvider()
  const { disconnect } = useDisconnect()
  const [chainMismatched, setChainMismatched] = useState(false)

  useEffect(() => {
    const checkChainId = async () => {
      const chainId = await getWalletChainId(walletProvider)
      if (chainId !== CHAIN_ID) {
        setChainMismatched(true)
      }
    }
    if (walletProvider) {
      checkChainId()
    }
  }, [walletProvider])

  const handleOpenWallet = () => {
    if (chainMismatched && walletProvider) {
      walletProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: decimalNetworkIdToHexNetworkId(CHAIN_ID) }]
      })
    } else {
      disconnect()
    }
  }
  return (
    <>
      <div className={styles.description}>
        <p>
          {chainMismatched
            ? messages.setEthereumMainnet
            : messages.tryDisconnecting}
        </p>
      </div>
      <div className={styles.btnContainer}>
        <Button
          text={messages.okayBtn}
          className={styles.okayBtn}
          type={ButtonType.PRIMARY_ALT}
          onClick={onClose}
        />

        <Button
          text={
            chainMismatched ? messages.openExtensionBtn : messages.disconnectBtn
          }
          className={styles.openExtensionBtn}
          type={ButtonType.PRIMARY}
          onClick={handleOpenWallet}
        />
      </div>
    </>
  )
}

type MisconfiguredModalProps = {
  isOpen: boolean
  onClose: () => void
  isMisconfigured?: boolean
}

const MisconfiguredModal: React.FC<MisconfiguredModalProps> = ({
  isOpen,
  onClose
}: MisconfiguredModalProps) => {
  return (
    <Modal
      title={messages.misconfiguredTitle}
      className={styles.container}
      isOpen={isOpen}
      onClose={onClose}
      isCloseable={true}
    >
      <MisconfiguredWalletContent onClose={onClose} />
    </Modal>
  )
}

export default MisconfiguredModal
