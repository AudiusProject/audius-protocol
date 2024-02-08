import React, { ReactNode, useCallback, useEffect } from 'react'
import Modal from 'components/Modal'
import Button, { ButtonType } from 'components/Button'
import styles from './ConnectMetaMaskModal.module.css'
import {
  ETH_NETWORK_ID,
  decimalNetworkIdToHexNetworkId
} from 'utils/switchNetwork'

const messages = {
  connectTitle: 'Connect MetaMask to Continue',
  misconfiguredTitle: 'Your MetaMask is Misconfigured',
  description: 'Please sign in with MetaMask to continue.',
  okayBtn: 'OKAY',
  openMetaMaskBtn: 'Open MetaMask',
  chooseMetaMaskOnPhantom:
    'Please choose MetaMask as the extension you want to connect with.',
  ifNoPopupWindow:
    'If you do not see the prompt to select your extension, open Phantom and ',
  setMetaMaskDefault: 'set MetaMask as your default app wallet',
  setMetaMaskDefaultSuffix: ' in your Phantom settings.',
  openPhantomPrompt: 'It looks like you have Phantom installed - make sure to ',
  openPhantomPromptAddition:
    'It looks like you have Phantom installed, so make sure to also ',
  setMetaMaskDefaultAdditionSuffix: ' in your Phantom settings.',
  setEthereumMainnet:
    'Please make sure you set the network on MetaMask to Ethereum Mainnet.'
}

type OwnProps = {
  isOpen: boolean
  onClose: () => void
  isMisconfigured?: boolean
}

type ConnectMetaMaskContentProps = {
  onClose: () => void
}
const ConnectMetaMaskContent = ({ onClose }: ConnectMetaMaskContentProps) => {
  const onOpenMetaMask = useCallback(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_requestAccounts' })
    }
  }, [])
  const isPhantomInstalled = window.phantom?.solana?.isPhantom

  const isSelectingExtensionOnPhantom =
    isPhantomInstalled && window.ethereum.isSelectingExtension
  let description: ReactNode
  if (isPhantomInstalled) {
    if (isSelectingExtensionOnPhantom) {
      description = (
        <>
          <p>{messages.chooseMetaMaskOnPhantom}</p>
          <p>
            {messages.ifNoPopupWindow}
            <a
              className={styles.externalLink}
              target="_blank"
              rel="noreferrer"
              href="https://help.phantom.app/hc/en-us/articles/12182813094163-How-to-use-Phantom-Extension-Alongside-Other-Crypto-Wallets"
            >
              {messages.setMetaMaskDefault}
            </a>
            {messages.setMetaMaskDefaultSuffix}
          </p>
        </>
      )
    } else {
      description = (
        <>
          <p>{messages.description}</p>
          <p>
            {messages.openPhantomPrompt}
            <a
              className={styles.externalLink}
              target="_blank"
              rel="noreferrer"
              href="https://help.phantom.app/hc/en-us/articles/12182813094163-How-to-use-Phantom-Extension-Alongside-Other-Crypto-Wallets"
            >
              {messages.setMetaMaskDefault}
            </a>
            {messages.setMetaMaskDefaultSuffix}
          </p>
        </>
      )
    }
  } else {
    description = messages.description
  }

  return (
    <>
      <div className={styles.description}>{description}</div>
      <div className={styles.btnContainer}>
        <Button
          text={messages.okayBtn}
          className={styles.okayBtn}
          type={ButtonType.PRIMARY_ALT}
          onClick={onClose}
        />

        <Button
          text={messages.openMetaMaskBtn}
          className={styles.openMetaMaskBtn}
          type={ButtonType.PRIMARY}
          onClick={onOpenMetaMask}
        />
      </div>
    </>
  )
}

const MisconfiguredMetaMaskContent = ({
  onClose
}: ConnectMetaMaskContentProps) => {
  const isPhantomInstalled =
    window.phantom?.solana?.isPhantom || !!window.ethereum.isPhantom

  const onOpenMetaMask = async () => {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: decimalNetworkIdToHexNetworkId(ETH_NETWORK_ID) }]
    })
  }
  return (
    <>
      <div className={styles.description}>
        <p>{messages.setEthereumMainnet}</p>
        {isPhantomInstalled ? (
          <p>
            {messages.openPhantomPromptAddition}{' '}
            <a
              className={styles.externalLink}
              target="_blank"
              rel="noreferrer"
              href="https://help.phantom.app/hc/en-us/articles/12182813094163-How-to-use-Phantom-Extension-Alongside-Other-Crypto-Wallets"
            >
              {messages.setMetaMaskDefault}
            </a>
            {messages.setMetaMaskDefaultAdditionSuffix}
          </p>
        ) : null}
      </div>
      <div className={styles.btnContainer}>
        <Button
          text={messages.okayBtn}
          className={styles.okayBtn}
          type={ButtonType.PRIMARY_ALT}
          onClick={onClose}
        />

        <Button
          text={messages.openMetaMaskBtn}
          className={styles.openMetaMaskBtn}
          type={ButtonType.PRIMARY}
          onClick={onOpenMetaMask}
        />
      </div>
    </>
  )
}

type ConnectMetaMaskModalProps = OwnProps

const ConnectMetaMaskModal: React.FC<ConnectMetaMaskModalProps> = ({
  isOpen,
  onClose,
  isMisconfigured
}: ConnectMetaMaskModalProps) => {
  return (
    <Modal
      title={
        isMisconfigured ? messages.misconfiguredTitle : messages.connectTitle
      }
      className={styles.container}
      isOpen={isOpen}
      onClose={onClose}
      isCloseable={true}
    >
      {isMisconfigured ? (
        <MisconfiguredMetaMaskContent onClose={onClose} />
      ) : (
        <ConnectMetaMaskContent onClose={onClose} />
      )}
    </Modal>
  )
}

export default ConnectMetaMaskModal
