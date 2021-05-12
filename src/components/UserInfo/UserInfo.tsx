import React, { useState, useCallback, useEffect } from 'react'
import Button from 'components/Button'
import clsx from 'clsx'

import Paper from 'components/Paper'
import { ButtonType } from '@audius/stems'
import DelegateStakeModal from 'components/DelegateStakeModal'
import { usePendingClaim } from 'store/cache/claims/hooks'
import ConfirmTransactionModal, {
  StandaloneBox
} from 'components/ConfirmTransactionModal'
import { useMakeClaim } from 'store/actions/makeClaim'
import { useAccount } from 'store/account/hooks'
import { User, Operator, Status } from 'types'
import BN from 'bn.js'
import useUndelegateStake from 'store/actions/undelegateStake'
import { useModalControls } from 'utils/hooks'
import { TICKER } from 'utils/consts'
import { formatAud } from 'utils/format'
import Loading from 'components/Loading'
import MyEstimatedRewards from 'components/MyEstimatedRewards'

import desktopStyles from './UserInfo.module.css'
import mobileStyles from './UserInfoMobile.module.css'
import { createStyles } from 'utils/mobile'
import UserImage from 'components/UserImage'
import Bounds from 'components/Bounds'
import Tooltip, { Position } from 'components/Tooltip'

const styles = createStyles({ desktopStyles, mobileStyles })

const messages = {
  delegate: 'DELEGATE',
  undelegate: 'UNDELEGATE',
  claim: 'CLAIM',
  makeClaim: 'Make Claim',
  claimOutOfBounds: 'Total stake out of bounds'
}

type UserInfoProps = {
  className?: string
  user: User | Operator
  rank?: number
  isOwner: boolean
  delegates: BN
  services: number
  status: Status
  delegatesStatus: Status
}

const UserInfo = ({
  user,
  rank,
  isOwner,
  services,
  delegates,
  delegatesStatus
}: UserInfoProps) => {
  // TODO: Get Rank
  const { name, wallet } = user
  const { isLoggedIn } = useAccount()
  const [isOpen, setIsOpen] = useState(false)
  const onClick = useCallback(() => setIsOpen(true), [setIsOpen])
  const onClose = useCallback(() => setIsOpen(false), [setIsOpen])
  const { hasClaim, status: claimStatus } = usePendingClaim(wallet)
  const {
    status: makeClaimStatus,
    error: makeClaimError,
    makeClaim
  } = useMakeClaim()

  const onConfirmClaim = useCallback(() => {
    makeClaim(wallet)
  }, [wallet, makeClaim])

  useEffect(() => {
    if (makeClaimStatus === Status.Success) onClose()
  }, [makeClaimStatus, onClose])

  const {
    isOpen: isUndelegateOpen,
    onClick: onClickUndelegate,
    onClose: onCloseUndelegate
  } = useModalControls()
  const {
    status: undelegateStatus,
    error: undelegateError,
    undelegateStake
  } = useUndelegateStake()

  useEffect(() => {
    if (undelegateStatus === Status.Success) onCloseUndelegate()
  }, [undelegateStatus, onCloseUndelegate])

  const onConfirmUndelegate = useCallback(() => {
    undelegateStake(wallet, delegates)
  }, [undelegateStake, delegates, wallet])

  const undelegateBox = (
    <StandaloneBox>
      <div className={styles.boxLabel}>{`Undelegate ${TICKER}`}</div>
      <div className={clsx(styles.boxValue, styles.boxSpacing)}>
        {formatAud(delegates)}
      </div>
      <div className={styles.boxLabel}>{`Operator Name`}</div>
      <div className={clsx(styles.boxValue, styles.boxName)}>
        {name || wallet}
      </div>
    </StandaloneBox>
  )
  const isOperator = (user as Operator)?.serviceProvider ?? false
  const isValidBounds =
    (user as Operator)?.serviceProvider?.validBounds ?? false
  const makeClaimBox = <StandaloneBox> {messages.makeClaim} </StandaloneBox>
  const isDoneLoading =
    claimStatus === Status.Success && delegatesStatus === Status.Success
  const showDelegate =
    isLoggedIn &&
    services > 0 &&
    !isOwner &&
    isDoneLoading &&
    !hasClaim &&
    delegates.isZero() &&
    isValidBounds
  const showUndelegate =
    isLoggedIn && !isOwner && isDoneLoading && !hasClaim && !delegates.isZero()
  const showClaim =
    isLoggedIn &&
    !isOwner &&
    claimStatus === Status.Success &&
    hasClaim

  const isClaimDisabled = !isValidBounds

  return (
    <>
      {showDelegate && (
        <div className={styles.buttonContainer}>
          <Button
            text={messages.delegate}
            type={ButtonType.PRIMARY}
            onClick={onClick}
          />
          <DelegateStakeModal
            serviceOperatorWallet={wallet}
            isOpen={isOpen}
            onClose={onClose}
          />
        </div>
      )}
      {showUndelegate && (
        <div className={styles.buttonContainer}>
          <Button
            className={styles.undelegateButton}
            text={messages.undelegate}
            type={ButtonType.PRIMARY}
            onClick={onClickUndelegate}
          />
          <ConfirmTransactionModal
            topBox={undelegateBox}
            onConfirm={onConfirmUndelegate}
            onClose={onCloseUndelegate}
            isOpen={isUndelegateOpen}
            error={undelegateError}
            status={undelegateStatus}
            withArrow={false}
          />
        </div>
      )}
      {showClaim && (
        <div className={styles.buttonContainer}>
          <Tooltip
            position={Position.TOP}
            text={messages.claimOutOfBounds}
            isDisabled={!isClaimDisabled}
            className={styles.claimDisabledTooltip}
          >
            <Button
              text={messages.claim}
              type={ButtonType.PRIMARY}
              onClick={onClick}
              isDisabled={isClaimDisabled}
            />
            <ConfirmTransactionModal
              isOpen={isOpen}
              withArrow={false}
              topBox={makeClaimBox}
              status={makeClaimStatus}
              error={makeClaimError}
              onConfirm={onConfirmClaim}
              onClose={onClose}
            />
          </Tooltip>
        </div>
      )}
      {rank && (
        <div className={styles.rankContainer}>
          <div className={styles.rankLabel}>{'Rank'}</div>
          <div className={styles.rankValue}>{rank}</div>
        </div>
      )}
      <UserImage
        className={styles.userImg}
        wallet={wallet}
        alt={'User Profile'}
      />
      <div className={styles.userName}>{name !== wallet && name}</div>
      <div className={styles.userWallet}>{wallet}</div>
      {isOperator && <Bounds wallet={wallet} />}
      <MyEstimatedRewards wallet={wallet} />
    </>
  )
}

const UserInfoContainer = (props: UserInfoProps) => {
  return (
    <Paper
      className={clsx(styles.userInfo, {
        [props.className!]: !!props.className
      })}
    >
      {props.status !== Status.Success ? <Loading /> : <UserInfo {...props} />}
    </Paper>
  )
}

export default UserInfoContainer
