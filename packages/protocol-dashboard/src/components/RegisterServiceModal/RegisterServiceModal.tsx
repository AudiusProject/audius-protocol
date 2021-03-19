import React, { useState, useCallback, useEffect, useRef } from 'react'
import clsx from 'clsx'
import BN from 'bn.js'
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
import getActiveStake from 'utils/activeStake'

const messages = {
  staking: `Staking Amount ${TICKER}`,
  stakingPlaceholder: `200,000 ${TICKER}`,
  dpEndpoint: 'Discovery Node Service Endpoint',
  dpEndpointPlaceholder: 'https://discoverynode.audius.co',
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
  { key: ServiceType.DiscoveryProvider, text: 'Discovery Node' },
  { key: ServiceType.ContentNode, text: 'Content Node' }
]

const RegisterServiceModal: React.FC<RegisterServiceModalProps> = ({
  isOpen,
  onClose
}: RegisterServiceModalProps) => {
  const [selectedTab, setSelectedTab] = useState(ServiceType.DiscoveryProvider)
  const { wallet } = useAccount()
  const serviceInfo = useServiceInfo()
  const { user } = useAccountUser()
  const calculatedMinStakeRef = useRef<BN>()

  // Check how much available stake the SP can use for registration
  // This computation is as follows:
  //
  // AVAILABLE_STAKE = ACTIVE_STAKE - USED_STAKE
  //   where
  //    ACTIVE_STAKE = amount that we have staked in audius
  //    USED_STAKE = # of services we have * minstake for each service
  let availableStake = new BN('0')
  if (
    user &&
    'serviceProvider' in user &&
    serviceInfo.contentNode &&
    serviceInfo.discoveryProvider
  ) {
    let usedStake = new BN('0')

    if ('contentNodes' in user) {
      const numContentNodes = new BN(user.contentNodes.length)
      usedStake = usedStake.add(
        numContentNodes.mul(serviceInfo.contentNode.minStake)
      )
    }
    if ('discoveryProviders' in user) {
      const numDiscoveryNodes = new BN(user.discoveryProviders.length)
      usedStake = usedStake.add(
        numDiscoveryNodes.mul(serviceInfo.discoveryProvider.minStake)
      )
    }

    const activeStake = getActiveStake(user)
    availableStake = activeStake.sub(usedStake)
  }

  const selectedServiceInfo =
    selectedTab === ServiceType.DiscoveryProvider
      ? serviceInfo.discoveryProvider
      : serviceInfo.contentNode

  // Our calculated min stake is the service type min stake MINUS
  // the "unused/available" stake we have in the system already.
  const calculatedMinStake = selectedServiceInfo
    ? BN.max(selectedServiceInfo.minStake.sub(availableStake), new BN('0'))
    : new BN('0')
  useEffect(() => {
    calculatedMinStakeRef.current = calculatedMinStake
  }, [calculatedMinStake])

  const [stakingBN, setStakingBN] = useState(calculatedMinStake)
  const [stakingAmount, setStakingAmount] = useState('')
  const [endpoint, setEndpoint] = useState('')
  const [delegateOwnerWallet, setDelegateOwnerWallet] = useState(wallet || '')

  useEffect(() => {
    if (isOpen && wallet) {
      setDelegateOwnerWallet(wallet)
    }
  }, [isOpen, setDelegateOwnerWallet, wallet])

  useEffect(() => {
    if (isOpen && selectedServiceInfo && calculatedMinStakeRef.current) {
      setStakingBN(calculatedMinStakeRef.current)
      const amount = AudiusClient.getAud(
        Utils.toBN(calculatedMinStakeRef.current)
      )
      setStakingAmount(amount.toString())
    }
  }, [
    isOpen,
    selectedTab,
    selectedServiceInfo,
    setStakingBN,
    setStakingAmount,
    calculatedMinStakeRef
  ])

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
      wallet={user.wallet}
    />
  )
  const bottomBox = (
    <NewService
      serviceType={selectedTab}
      delegateOwnerWallet={delegateOwnerWallet || user?.wallet}
    />
  )

  const min = calculatedMinStake
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
