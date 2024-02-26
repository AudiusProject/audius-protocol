import BN from 'bn.js'
import clsx from 'clsx'
import DisplayAudio from 'components/DisplayAudio'
import MinimumDelegationAmountModal from 'components/MinimumDelegationAmountModal'
import OperatorCutModal from 'components/OperatorCutModal'
import Paper from 'components/Paper'
import TransactionStatus from 'components/TransactionStatus'
import UpdateStakeModal from 'components/UpdateStakeModal'
import React, { useCallback } from 'react'
import {
  useAccount,
  useAccountUser,
  useHasPendingDecreaseStakeTx
} from 'store/account/hooks'
import { usePendingClaim } from 'store/cache/claims/hooks'
import { Address, Operator, Status } from 'types'
import { useModalControls } from 'utils/hooks'
import { accountPage } from 'utils/routes'
import styles from './ManageService.module.css'

import {
  IconArrowWhite,
  IconDeployerCut,
  IconMinimum,
  IconUser,
  IconValidationCheck
} from '@audius/stems'
import Button, { ButtonType } from 'components/Button'
import ConfirmTransactionModal, {
  StandaloneBox
} from 'components/ConfirmTransactionModal'
import DelegatesModal from 'components/DelegatesModal'
import DelegatorsModal from 'components/DelegatorsModal'
import Loading from 'components/Loading'
import { useMakeClaim } from 'store/actions/makeClaim'
import { TICKER } from 'utils/consts'
import { usePushRoute } from 'utils/effects'
import { RegisterNewServiceBtn } from './RegisterNewServiceBtn'

const messages = {
  title: 'Manage Your Account & Services',
  increase: 'Increase Stake',
  decrease: 'Decrease Stake',
  deployerCut: 'Deployer Cut',
  activeServices: 'Active Services',
  minimunDelegationAmount: 'Minimum Delegation Amount',
  change: 'Change',
  manage: 'Manage',
  view: 'View',
  claim: 'Make Claim'
}

interface ManageServiceProps {
  className?: string
  showViewActiveServices?: boolean
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

const DeployerCut = ({
  className,
  cut
}: {
  className?: string
  cut: number
}) => {
  const { isOpen, onClick, onClose } = useModalControls()
  return (
    <div className={clsx({ [className!]: !!className })}>
      <div className={clsx(styles.actionIcon, styles.userWrapper)}>
        <IconDeployerCut className={clsx(styles.deployerCutIcon)} />
      </div>
      {`${messages.deployerCut} ${cut}%`}
      <span className={styles.actionText} onClick={onClick}>
        {messages.change}
      </span>
      <OperatorCutModal cut={cut} isOpen={isOpen} onClose={onClose} />
    </div>
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

const ManageService: React.FC<ManageServiceProps> = (
  props: ManageServiceProps
) => {
  const { status: userStatus, user: accountUser } = useAccountUser()

  const isServiceProvider =
    userStatus === Status.Success && 'serviceProvider' in accountUser

  const hasPendingDecreaseTx = useHasPendingDecreaseStakeTx()
  let increaseStakeDisabled = !isServiceProvider
  const decreaseStakeDisabled =
    !isServiceProvider ||
    (hasPendingDecreaseTx.status === Status.Success &&
      hasPendingDecreaseTx.hasPendingDecreaseTx)
  const pendingClaim = usePendingClaim(accountUser?.wallet)

  const deployerStake =
    (accountUser as Operator)?.serviceProvider?.deployerStake ?? new BN('0')
  const maxAccountStake =
    (accountUser as Operator)?.serviceProvider?.maxAccountStake ?? new BN('0')
  if (deployerStake.isZero() || deployerStake.gte(maxAccountStake))
    increaseStakeDisabled = true

  const { isOpen, onClick, onClose } = useModalControls()
  const { status, error, makeClaim } = useMakeClaim()

  const onConfirm = useCallback(() => {
    makeClaim(accountUser.wallet)
  }, [accountUser, makeClaim])

  const makeClaimBox = <StandaloneBox> {messages.claim} </StandaloneBox>

  return (
    <Paper
      className={clsx(styles.container, {
        [props.className!]: !!props.className
      })}
    >
      <h3 className={styles.title}>{messages.title}</h3>
      <div className={styles.manageAccountContainer}>
        {accountUser ? (
          <>
            <div className={styles.manageBtns}>
              {pendingClaim.status !==
              Status.Success ? null : pendingClaim.hasClaim ? (
                <div>
                  <Button
                    className={styles.btn}
                    onClick={onClick}
                    textClassName={styles.btnText}
                    iconClassName={styles.btnIcon}
                    text={messages.claim}
                    type={ButtonType.GREEN}
                  />
                  <ConfirmTransactionModal
                    isOpen={isOpen}
                    onClose={onClose}
                    withArrow={false}
                    topBox={makeClaimBox}
                    onConfirm={onConfirm}
                    status={status}
                    error={error}
                  />
                </div>
              ) : (
                <div className={styles.btnContainer}>
                  {isServiceProvider && (
                    <div>
                      <IncreaseStake isDisabled={increaseStakeDisabled} />
                      <DecreaseStake isDisabled={decreaseStakeDisabled} />
                    </div>
                  )}
                </div>
              )}
            </div>
            {isServiceProvider && (
              <div className={styles.actionsContainer}>
                <RegisterNewServiceBtn />
                <ActiveServices
                  className={styles.accountAction}
                  showView={props.showViewActiveServices}
                  numberServices={
                    (accountUser as Operator).serviceProvider.numberOfEndpoints
                  }
                />
                <DeployerCut
                  className={styles.accountAction}
                  cut={(accountUser as Operator).serviceProvider.deployerCut}
                />
                <MinimumDelegationAmount
                  className={styles.accountAction}
                  minimumDelegationAmount={
                    (accountUser as Operator).minDelegationAmount
                  }
                />
                {(accountUser as Operator).delegators.length > 0 && (
                  <Delegators
                    className={styles.accountAction}
                    wallet={accountUser.wallet}
                    moreText={messages.view}
                    numberDelegators={
                      (accountUser as Operator).delegators.length
                    }
                  />
                )}
              </div>
            )}
            <TransactionStatus />
          </>
        ) : (
          <div className={styles.loading}>
            <Loading />
          </div>
        )}
      </div>
    </Paper>
  )
}

export default ManageService
