import BN from 'bn.js'
import clsx from 'clsx'
import DisplayAudio from 'components/DisplayAudio'
import MinimumDelegationAmountModal from 'components/MinimumDelegationAmountModal'
import OperatorCutModal from 'components/OperatorCutModal'
import UpdateStakeModal from 'components/UpdateStakeModal'
import { useCallback } from 'react'
import AudiusClient from 'services/Audius/AudiusClient'
import {
  useAccount,
  useAccountUser,
  useHasPendingDecreaseStakeTx,
  usePendingTransactions
} from 'store/account/hooks'
import { usePendingClaim } from 'store/cache/claims/hooks'
import { Address, Operator, Status } from 'types'
import { useModalControls } from 'utils/hooks'
import { accountPage } from 'utils/routes'
import styles from './ManageService.module.css'

import {
  Box,
  Divider,
  Flex,
  HarmonyTheme,
  Text,
  useTheme
} from '@audius/harmony'
import {
  IconArrowWhite,
  IconDeployerCut,
  IconMinimum,
  IconUser,
  IconValidationCheck
} from '@audius/stems'
import Button, { ButtonType } from 'components/Button'
import { Card } from 'components/Card/Card'
import ConfirmTransactionModal, {
  StandaloneBox
} from 'components/ConfirmTransactionModal'
import DelegatesModal from 'components/DelegatesModal'
import DelegatorsModal from 'components/DelegatorsModal'
import MyEstimatedRewards from 'components/MyEstimatedRewards'
import { PlainLink } from 'components/PlainLink/PlainLink'
import { TransactionStatusContent } from 'components/TransactionStatus/TransactionStatus'
import { ManageDelegation } from 'components/UpdateDelegationModal/UpdateDelegationModal'
import { useMakeClaim } from 'store/actions/makeClaim'
import { useUser, useUserDelegates } from 'store/cache/user/hooks'
import getActiveStake, { getTotalActiveDelegatedStake } from 'utils/activeStake'
import { TICKER } from 'utils/consts'
import { usePushRoute } from 'utils/effects'
import { RegisterNewServiceBtn } from './RegisterNewServiceBtn'

const messages = {
  ownerTitle: 'Your Nodes',
  nonOwnertitle: 'Operator’s Nodes',
  increase: 'Increase Stake',
  decrease: 'Decrease Stake',
  deployerCut: 'Deployer Cut',
  activeServices: 'Active Services',
  minimunDelegationAmount: 'Minimum Delegation Amount',
  aggregateContribution: 'Aggregate Contribution',
  contentNodes: 'Content Nodes',
  contentNodesSingular: 'Content Node',
  discoveryNodes: 'Discovery Nodes',
  discoveryNodesSingular: 'Discovery Node',
  delegators: 'Delegators',
  delegatorsSingular: 'Delegator',
  change: 'Change',
  manage: 'Manage',
  view: 'View',
  claim: 'Make Claim',
  claimForOperator: 'Claim For Operator',
  rewardsPool: `Estimated ${TICKER} Rewards Pool`,
  weekly: 'Weekly',
  annual: 'Annual',
  operatorStake: `Operator Stake (${TICKER})`,
  operatorServiceFee: 'Operator Service Fee',
  unclaimed: 'Unclaimed',
  rewardDistribution: 'Reward Distribution',
  registerNode: 'Register Node',
  delegatedAudio: `Your Delegated ${TICKER}`
}

interface ManageServiceProps {
  className?: string
  showViewActiveServices?: boolean
  showPendingTransactions?: boolean
  wallet: string
}

const DecreaseStake = ({ isDisabled }: { isDisabled: boolean }) => {
  const { isOpen, onClick, onClose } = useModalControls()
  const decreaseIcon = <IconArrowWhite className={styles.decreaseIcon} />
  return (
    <>
      <Button
        type={ButtonType.PRIMARY_ALT}
        onClick={onClick}
        leftIcon={decreaseIcon}
        text={messages.decrease}
        isDisabled={isDisabled}
        iconClassName={styles.stakeIcon}
        textClassName={styles.stakeBtnText}
        className={clsx(styles.modifyStakeBtn, {
          [styles.disabledBtn]: isDisabled
        })}
      />
      <UpdateStakeModal isOpen={isOpen} onClose={onClose} isIncrease={false} />
    </>
  )
}

const IncreaseStake = ({ isDisabled }: { isDisabled: boolean }) => {
  const increaseIcon = <IconArrowWhite className={styles.increaseIcon} />
  const { isOpen, onClick, onClose } = useModalControls()
  return (
    <>
      <Button
        onClick={onClick}
        type={ButtonType.PRIMARY_ALT}
        leftIcon={increaseIcon}
        text={messages.increase}
        isDisabled={isDisabled}
        iconClassName={styles.stakeIcon}
        textClassName={styles.stakeBtnText}
        className={clsx(styles.modifyStakeBtn, styles.increaseBtn, {
          [styles.disabledBtn]: isDisabled
        })}
      />
      <UpdateStakeModal isOpen={isOpen} onClose={onClose} isIncrease />
    </>
  )
}

const MinimumDelegationAmount = ({
  className,
  minimumDelegationAmount
}: {
  className?: string
  minimumDelegationAmount: BN
}) => {
  const { isOpen, onClick, onClose } = useModalControls()
  return (
    <div className={clsx({ [className!]: !!className })}>
      <div className={clsx(styles.actionIcon, styles.userWrapper)}>
        <IconMinimum className={clsx(styles.userIcon)} />
      </div>
      {messages.minimunDelegationAmount}
      <DisplayAudio
        className={styles.minDelgationAmount}
        amount={minimumDelegationAmount}
        label={TICKER}
      />
      <span className={styles.actionText} onClick={onClick}>
        {messages.change}
      </span>
      <MinimumDelegationAmountModal
        minimumDelegationAmount={minimumDelegationAmount}
        isOpen={isOpen}
        onClose={onClose}
      />
    </div>
  )
}

const ActiveServices = ({
  className,
  numberServices,
  showView = true
}: {
  className?: string
  numberServices: number
  showView?: boolean
}) => {
  const pushRoute = usePushRoute()
  const { wallet } = useAccount()
  const onClickView = useCallback(
    () => wallet && pushRoute(accountPage(wallet)),
    [pushRoute, wallet]
  )
  return (
    <div className={clsx({ [className!]: !!className })}>
      <IconValidationCheck className={clsx(styles.actionIcon)} />
      {`${numberServices} ${messages.activeServices}`}
      {showView && numberServices > 0 && (
        <span className={styles.actionText} onClick={onClickView}>
          {'View'}
        </span>
      )}
    </div>
  )
}

const Delegators = ({
  className,
  wallet,
  numberDelegators,
  moreText
}: {
  className?: string
  wallet: Address
  numberDelegators: number
  moreText: string
}) => {
  const { isOpen, onClick, onClose } = useModalControls()
  return (
    <div className={clsx({ [className!]: !!className })}>
      <div className={clsx(styles.actionIcon, styles.userWrapper)}>
        <IconUser className={styles.userIcon} />
      </div>
      {`${numberDelegators} Delegators`}
      {numberDelegators > 0 && (
        <span className={styles.actionText} onClick={onClick}>
          {moreText}
        </span>
      )}
      <DelegatorsModal wallet={wallet} isOpen={isOpen} onClose={onClose} />
    </div>
  )
}

const Delegates = ({
  className,
  wallet,
  numberDelegates,
  moreText
}: {
  className?: string
  wallet: Address
  numberDelegates: number
  moreText: string
}) => {
  const { isOpen, onClick, onClose } = useModalControls()
  return (
    <div className={clsx({ [className!]: !!className })}>
      <div className={clsx(styles.actionIcon, styles.userWrapper)}>
        <IconUser className={styles.userIcon} />
      </div>
      {`Delegating to ${numberDelegates} Operators`}
      {numberDelegates > 0 && (
        <span className={styles.actionText} onClick={onClick}>
          {moreText}
        </span>
      )}
      <DelegatesModal wallet={wallet} isOpen={isOpen} onClose={onClose} />
    </div>
  )
}

const ManageService = (props: ManageServiceProps) => {
  const wallet = props.wallet

  const { status: accountUserStatus, user: accountUser } = useAccountUser()
  const { user: serviceUser, status: serviceUserStatus } = useUser({ wallet })
  const { status: userDelegatesStatus, delegates } = useUserDelegates({
    wallet
  })
  const { color } = useTheme() as HarmonyTheme
  const activeStake = getActiveStake(serviceUser)
  const totalActiveDelegated = getTotalActiveDelegatedStake(serviceUser)
  const aggregateContribution = activeStake.add(totalActiveDelegated)

  const isServiceProvider =
    serviceUserStatus === Status.Success && 'serviceProvider' in serviceUser

  const pendingTx = usePendingTransactions()
  const hasPendingTx =
    pendingTx.status === Status.Success &&
    Array.isArray(pendingTx.transactions) &&
    pendingTx.transactions?.length !== 0
  const numDiscoveryNodes =
    isServiceProvider && (serviceUser as Operator).discoveryProviders.length
  const numContentNodes =
    isServiceProvider && (serviceUser as Operator).contentNodes.length
  const numDelegators = isServiceProvider
    ? (serviceUser as Operator).delegators.length
    : 0
  const deployerCut = isServiceProvider
    ? (serviceUser as Operator).serviceProvider.deployerCut
    : null
  const isOwner =
    accountUserStatus === Status.Success && wallet === accountUser?.wallet
  const hasPendingDecreaseTx = useHasPendingDecreaseStakeTx()
  let increaseStakeDisabled = !isServiceProvider
  const decreaseStakeDisabled =
    !isServiceProvider ||
    (hasPendingDecreaseTx.status === Status.Success &&
      hasPendingDecreaseTx.hasPendingDecreaseTx)
  const pendingClaim = usePendingClaim(wallet)

  const deployerStake =
    (serviceUser as Operator)?.serviceProvider?.deployerStake ?? new BN('0')
  const maxAccountStake =
    (serviceUser as Operator)?.serviceProvider?.maxAccountStake ?? new BN('0')
  if (deployerStake.isZero() || deployerStake.gte(maxAccountStake))
    increaseStakeDisabled = true

  const { isOpen, onClick, onClose } = useModalControls()
  const { status: claimStatus, error, makeClaim } = useMakeClaim()

  const onConfirm = useCallback(() => {
    makeClaim(serviceUser.wallet)
  }, [serviceUser?.wallet, makeClaim])

  const makeClaimBox = <StandaloneBox> {messages.claim} </StandaloneBox>

  return (
    <Card direction="column">
      <Flex
        pv="l"
        ph="xl"
        borderBottom="default"
        justifyContent="space-between"
        alignItems="center"
        w="100%"
      >
        <Text variant="heading" size="s">
          {isOwner ? messages.ownerTitle : messages.nonOwnertitle}
        </Text>
        <Flex gap="xl" alignItems="center">
          {isOwner ? (
            <RegisterNewServiceBtn customText={messages.registerNode} />
          ) : null}
          <Box css={{ textAlign: 'end' }}>
            <Text variant="heading" size="m" color="accent">
              {AudiusClient.displayShortAud(aggregateContribution)}
            </Text>
            <Text variant="body" size="m" strength="strong" color="subdued">
              {messages.aggregateContribution}
            </Text>
          </Box>
        </Flex>
      </Flex>
      <Flex pv="l" ph="xl" gap="2xl" alignItems="stretch">
        <Flex direction="column" alignItems="stretch" gap="s">
          <Card ph="l" backgroundColor="surface1" h="100%">
            <Flex gap="s" alignItems="center" h="100%">
              <Text variant="heading" size="s">
                {numContentNodes}
              </Text>
              <Text variant="body" size="l" strength="strong" color="subdued">
                {numContentNodes === 1
                  ? messages.contentNodesSingular
                  : messages.contentNodes}
              </Text>
            </Flex>
          </Card>
          <Card ph="l" backgroundColor="surface1" h="100%">
            <Flex gap="s" alignItems="center" h="100%">
              <Text variant="heading" size="s">
                {numDiscoveryNodes}
              </Text>
              <Text variant="body" size="l" strength="strong" color="subdued">
                {numDiscoveryNodes === 1
                  ? messages.discoveryNodesSingular
                  : messages.discoveryNodes}
              </Text>
            </Flex>
          </Card>
          <Card ph="l" backgroundColor="surface1" h="100%">
            <Flex gap="s" alignItems="center" h="100%">
              <Text variant="heading" size="s">
                {numDelegators}
              </Text>
              <Text variant="body" size="l" strength="strong" color="subdued">
                {numDelegators === 1
                  ? messages.delegatorsSingular
                  : messages.delegators}
              </Text>
            </Flex>
          </Card>
        </Flex>
        <Flex direction="column" gap="xl" css={{ flexGrow: 1 }}>
          <Flex direction="column" gap="l">
            <Text variant="body" size="l" strength="strong" color="subdued">
              {messages.rewardsPool}
            </Text>
            <Flex direction="column" gap="m">
              <MyEstimatedRewards wallet={wallet} />
            </Flex>
          </Flex>
          <Divider css={{ borderColor: color.neutral.n100 }} />
          <Flex direction="column" gap="m">
            <Flex gap="s">
              <Text variant="heading" size="s">
                {AudiusClient.displayShortAud(activeStake)}
              </Text>
              <Text variant="body" size="l" strength="strong" color="subdued">
                {messages.operatorStake}
              </Text>
            </Flex>
            <Flex gap="s">
              <Text variant="heading" size="s">
                {deployerCut}%
              </Text>
              <Text variant="body" size="l" strength="strong" color="subdued">
                {messages.operatorServiceFee}
              </Text>
            </Flex>
            {pendingClaim.status !== Status.Success ||
            !pendingClaim.hasClaim ? null : (
              <>
                <Flex gap="l">
                  <Flex gap="s">
                    <Text variant="heading" size="s">
                      {messages.unclaimed}
                    </Text>
                    <Text
                      variant="body"
                      size="l"
                      strength="strong"
                      color="subdued"
                    >
                      {messages.rewardDistribution}
                    </Text>
                  </Flex>
                  <PlainLink onClick={onClick}>
                    {isOwner ? messages.claim : messages.claimForOperator}
                  </PlainLink>
                </Flex>
                <ConfirmTransactionModal
                  isOpen={isOpen}
                  onClose={onClose}
                  withArrow={false}
                  topBox={makeClaimBox}
                  onConfirm={onConfirm}
                  status={claimStatus}
                  error={error}
                />
              </>
            )}
          </Flex>
        </Flex>
      </Flex>
      {props.showPendingTransactions && hasPendingTx && isOwner ? (
        <Box p="xl" borderTop="default">
          <TransactionStatusContent />
        </Box>
      ) : null}
      {userDelegatesStatus === Status.Success && !delegates.isZero() ? (
        <Flex
          alignItems="center"
          justifyContent="space-between"
          p="xl"
          borderTop="default"
        >
          <Box css={{ flexGrow: 1, maxWidth: 226 }}>
            <ManageDelegation delegates={delegates} wallet={wallet} />
          </Box>
          <Flex direction="column" alignItems="flex-end">
            <Text variant="heading" size="m" color="accent">
              {AudiusClient.displayShortAud(delegates)}
            </Text>
            <Text variant="body" size="l" color="subdued" strength="strong">
              {messages.delegatedAudio}
            </Text>
          </Flex>
        </Flex>
      ) : null}
    </Card>
  )
}

export default ManageService
