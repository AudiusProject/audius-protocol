import { useWeb3Modal, useWeb3ModalProvider } from '@web3modal/ethers/react'
import Button, { ButtonType } from 'components/Button'
import Modal from 'components/Modal'
import React from 'react'
import { getWalletChainId } from 'services/Audius/setup'
import {
  ETH_NETWORK_ID,
  decimalNetworkIdToHexNetworkId
} from 'utils/switchNetwork'
import styles from './MisconfiguredModal.module.css'

const messages = {
  misconfiguredTitle: 'Your Wallet is Misconfigured',
  okayBtn: 'OKAY',
  openExtensionBtn: 'Open Wallet',
  setEthereumMainnet:
    'Please make sure your wallet network is set to the Ethereum Mainnet.'
}

type OwnProps = {
  isOpen: boolean
  onClose: () => void
  isMisconfigured?: boolean
}

type ContentProps = {
  onClose: () => void
}

const MisconfiguredWalletContent = ({ onClose }: ContentProps) => {
  const { walletProvider } = useWeb3ModalProvider()
  const { open } = useWeb3Modal()

  const onSwitchNetwork = async () => {
    const chainId = await getWalletChainId(walletProvider)
    if (chainId !== ETH_NETWORK_ID && !!walletProvider) {
      walletProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: decimalNetworkIdToHexNetworkId(ETH_NETWORK_ID) }]
      })
    } else {
      open()
    }
  }
  return (
    <>
      <div className={styles.description}>
        <p>{messages.setEthereumMainnet}</p>
      </div>
      <div className={styles.btnContainer}>
        <Button
          text={messages.okayBtn}
          className={styles.okayBtn}
          type={ButtonType.PRIMARY_ALT}
          onClick={onClose}
        />

        <Button
          text={messages.openExtensionBtn}
          className={styles.openExtensionBtn}
          type={ButtonType.PRIMARY}
          onClick={onSwitchNetwork}
        />
      </div>
    </>
  )
}

type MisconfiguredModalProps = OwnProps

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
