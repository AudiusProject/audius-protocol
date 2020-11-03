import React, { useState, useCallback, useEffect } from 'react'
import clsx from 'clsx'
import { Utils } from '@audius/libs'
import { TabSlider, ButtonType } from '@audius/stems'

import { useRegisterService } from 'store/actions/registerService'
import { useServiceInfo } from 'store/cache/protocol/hooks'
import AudiusClient from 'services/Audius'
import Modal from 'components/Modal'
import Button from 'components/Button'
import ValueSlider from 'components/ValueSlider'
import TextField from 'components/TextField'
import styles from './RegisterServiceModal.module.css'
import { ServiceType, Status } from 'types'
import { checkWeiNumber, parseWeiNumber } from 'utils/numeric'
import ConfirmTransactionModal, {
  OperatorStaking,
  NewService
} from 'components/ConfirmTransactionModal'
import { useAccountUser, useAccount } from 'store/account/hooks'
import { formatShortWallet } from 'utils/format'
import { TICKER } from 'utils/consts'
import { useModalControls } from 'utils/hooks'

const messages = {
  staking: `Staking Amount ${TICKER}`,
  stakingPlaceholder: `200,000 ${TICKER}`,
  dpEndpoint: 'Discovery Provider Service Endpoint',
  dpEndpointPlaceholder: 'https://discoveryprovider.audius.co',
  cnEndpoint: 'Content Node Service Endpoint',
  cnEndpointPlaceholder: 'https://contentnode.audius.co',
  delegate: 'Delegate Owner Wallet',
  registerService: 'Register Service'
}

type OwnProps = {
  isOpen: boolean
  onClose: () => void
}

type RegisterServiceModalProps = OwnProps

const tabOptions = [
  { key: ServiceType.DiscoveryProvider, text: 'Discovery Provider' },
  { key: ServiceType.ContentNode, text: 'Content Node' }
]

const RegisterServiceModal: React.FC<RegisterServiceModalProps> = ({
  isOpen,
  onClose
}: RegisterServiceModalProps) => {
  const [selectedTab, setSelectedTab] = useState(ServiceType.DiscoveryProvider)
  const { wallet } = useAccount()
  const serviceInfo = useServiceInfo()
  const selectedServiceInfo =
    selectedTab === ServiceType.DiscoveryProvider
      ? serviceInfo.discoveryProvider
      : serviceInfo.contentNode
  const [stakingBN, setStakingBN] = useState(
    selectedServiceInfo?.minStake ?? Utils.toBN('0')
  )
  const [stakingAmount, setStakingAmount] = useState('')
  const [endpoint, setEndpoint] = useState('')
  const [delegateOwnerWallet, setDelegateOwnerWallet] = useState(wallet || '')

  const { user } = useAccountUser()
  useEffect(() => {
    if (isOpen && wallet) {
      setDelegateOwnerWallet(wallet)
    }
  }, [isOpen, setDelegateOwnerWallet, wallet])

  useEffect(() => {
    if (isOpen && selectedServiceInfo) {
      setStakingBN(selectedServiceInfo.minStake)
      const amount = AudiusClient.getAud(
        Utils.toBN(selectedServiceInfo.minStake)
      )
      setStakingAmount(amount.toString())
    }
  }, [isOpen, selectedTab, selectedServiceInfo, setStakingBN, setStakingAmount])

  const onSelectTab = useCallback(
    selectedKey => {
      setSelectedTab(selectedKey)
      setEndpoint('')
    },
    [setSelectedTab, setEndpoint]
  )

  const onUpdateStaking = useCallback(
    (value: string) => {
      setStakingAmount(value)
      if (checkWeiNumber(value)) {
        setStakingBN(parseWeiNumber(value))
      }
    },
    [setStakingAmount]
  )

  const {
    isOpen: isConfirmModalOpen,
    onClick: onOpenConfirm,
    onClose: onCloseConfirm
  } = useModalControls()

  const onRegister = useCallback(() => {
    // TODO: validate each field
    onOpenConfirm()
  }, [onOpenConfirm])

  const { status, registerService, error } = useRegisterService(
    !isConfirmModalOpen
  )

  const onConfirm = useCallback(() => {
    registerService(selectedTab, endpoint, stakingBN, delegateOwnerWallet)
  }, [registerService, selectedTab, endpoint, stakingBN, delegateOwnerWallet])

  useEffect(() => {
    if (status === Status.Success) {
      setDelegateOwnerWallet('')
      setEndpoint('')
      onCloseConfirm()
      onClose()
    }
  }, [status, onClose, onCloseConfirm, setEndpoint, setDelegateOwnerWallet])

  const onCloseRegisterModal = useCallback(() => {
    setEndpoint('')
    onClose()
  }, [onClose, setEndpoint])

  const topBox = user && (
    <OperatorStaking
      image={user.image}
      name={user.name || formatShortWallet(user.wallet)}
      amount={stakingBN}
    />
  )
  const bottomBox = (
    <NewService
      serviceType={selectedTab}
      delegateOwnerWallet={delegateOwnerWallet || user?.wallet}
    />
  )

  const min = selectedServiceInfo?.minStake
  const max = selectedServiceInfo?.maxStake

  return (
    <Modal
      title={'Register New Service'}
      className={styles.container}
      isOpen={isOpen}
      onClose={onCloseRegisterModal}
      isCloseable={true}
      dismissOnClickOutside={!isConfirmModalOpen}
    >
      <TabSlider
        className={styles.tabSliderContainer}
        options={tabOptions}
        selected={selectedTab}
        onSelectOption={onSelectTab}
      />
      <ValueSlider
        min={min}
        max={max}
        value={stakingBN}
        className={styles.slider}
      />
      <TextField
        value={stakingAmount}
        isNumeric
        label={messages.staking}
        onChange={onUpdateStaking}
        placeholder={messages.stakingPlaceholder}
        className={clsx(styles.input, {
          [styles.invalid]:
            min && max && (stakingBN.gt(max) || stakingBN.lt(min))
        })}
      />
      <TextField
        value={endpoint}
        onChange={setEndpoint}
        label={
          selectedTab === ServiceType.DiscoveryProvider
            ? messages.dpEndpoint
            : messages.cnEndpoint
        }
        placeholder={
          selectedTab === ServiceType.DiscoveryProvider
            ? messages.dpEndpointPlaceholder
            : messages.cnEndpointPlaceholder
        }
        className={styles.input}
      />
      <TextField
        value={delegateOwnerWallet}
        onChange={setDelegateOwnerWallet}
        label={messages.delegate}
        placeholder={wallet || ''}
        className={styles.input}
      />
      <Button
        text={messages.registerService}
        type={ButtonType.PRIMARY}
        onClick={onRegister}
      />
      <ConfirmTransactionModal
        isOpen={isConfirmModalOpen}
        onClose={onCloseConfirm}
        onConfirm={onConfirm}
        topBox={topBox}
        bottomBox={bottomBox}
        status={status}
        error={error}
      />
    </Modal>
  )
}

export default RegisterServiceModal
