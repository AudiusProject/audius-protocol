import { useState, useCallback, useEffect, useRef, useMemo } from 'react'

import { TabSlider, ButtonType } from '@audius/stems'
import BN from 'bn.js'
import clsx from 'clsx'

import Button from 'components/Button'
import ConfirmTransactionModal, {
  OperatorStaking,
  NewService
} from 'components/ConfirmTransactionModal'
import Modal from 'components/Modal'
import TextField from 'components/TextField'
import ValueSlider from 'components/ValueSlider'
import AudiusClient from 'services/Audius'
import { useAccountUser, useAccount } from 'store/account/hooks'
import { useRegisterService } from 'store/actions/registerService'
import { useServiceInfo } from 'store/cache/protocol/hooks'
import { ServiceType, Status } from 'types'
import getActiveStake from 'utils/activeStake'
import { TICKER } from 'utils/consts'
import { formatShortWallet } from 'utils/format'
import { useModalControls } from 'utils/hooks'
import { checkWeiNumber, parseWeiNumber } from 'utils/numeric'

import styles from './RegisterServiceModal.module.css'

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

type RegisterServiceModalProps = {
  isOpen: boolean
  onClose: () => void
  defaultServiceType?: ServiceType
  defaultEndpoint?: string
  defaultDelegateOwnerWallet?: string
}

const tabOptions = [
  { key: ServiceType.DiscoveryProvider, text: 'Discovery Node' },
  { key: ServiceType.ContentNode, text: 'Content Node' }
]

const RegisterServiceModal = ({
  isOpen,
  onClose,
  defaultServiceType,
  defaultEndpoint,
  defaultDelegateOwnerWallet
}: RegisterServiceModalProps) => {
  const [selectedTab, setSelectedTab] = useState(
    defaultServiceType || ServiceType.DiscoveryProvider
  )
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
  let availableStake: BN | undefined
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
  const calculatedMinStake = useMemo(() => {
    return selectedServiceInfo
      ? BN.max(
          selectedServiceInfo.minStake.sub(availableStake ?? new BN('0')),
          new BN('0')
        )
      : new BN('0')
  }, [selectedServiceInfo, availableStake])

  useEffect(() => {
    calculatedMinStakeRef.current = calculatedMinStake
  }, [calculatedMinStake])

  const [stakingBN, setStakingBN] = useState(calculatedMinStake)
  const [stakingAmount, setStakingAmount] = useState('')
  const [endpoint, setEndpoint] = useState(defaultEndpoint || '')
  const [delegateOwnerWallet, setDelegateOwnerWallet] = useState(
    defaultDelegateOwnerWallet || wallet || ''
  )

  useEffect(() => {
    if (isOpen && defaultDelegateOwnerWallet) {
      setDelegateOwnerWallet(defaultDelegateOwnerWallet)
    } else if (isOpen && wallet) {
      setDelegateOwnerWallet(wallet)
    }
  }, [isOpen, setDelegateOwnerWallet, wallet, defaultDelegateOwnerWallet])

  useEffect(() => {
    if (isOpen && selectedServiceInfo && calculatedMinStakeRef.current) {
      setStakingBN(calculatedMinStakeRef.current)
      const amount = AudiusClient.getAud(
        new BN(calculatedMinStakeRef.current as any)
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
    (selectedKey) => {
      if (selectedKey === selectedTab) return
      setSelectedTab(selectedKey)
      setEndpoint(defaultEndpoint || '')
    },
    [setSelectedTab, setEndpoint, selectedTab, defaultEndpoint]
  )

  const onUpdateStaking = useCallback(
    (value: string) => {
      setStakingAmount(value)
      if (checkWeiNumber(value)) {
        setStakingBN(parseWeiNumber(value)!)
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
    if (endpoint !== defaultEndpoint) setEndpoint('')
    onClose()
  }, [onClose, setEndpoint, endpoint, defaultEndpoint])

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
        placeholder={defaultDelegateOwnerWallet || wallet || ''}
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
