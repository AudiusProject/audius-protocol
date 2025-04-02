import { useCallback } from 'react'

import {
  OptimisticUserChallenge,
  UndisbursedUserChallenge
} from '@audius/common/models'
import { audioRewardsPageActions } from '@audius/common/store'
import {
  formatNumberCommas,
  getClaimableChallengeSpecifiers
} from '@audius/common/utils'
import { Button, IconArrowRight } from '@audius/harmony'
import { useDispatch } from 'react-redux'

const { claimChallengeReward } = audioRewardsPageActions

const messages = {
  close: 'Close',
  claimableAmountLabel: (amount: number) =>
    `Claim ${formatNumberCommas(amount)} $AUDIO`
}

type ClaimButtonProps = {
  challenge?: OptimisticUserChallenge
  claimInProgress: boolean
  onClose: () => void
  undisbursedChallenges?: UndisbursedUserChallenge[]
}

export const ClaimButton = ({
  challenge,
  claimInProgress,
  onClose,
  undisbursedChallenges = []
}: ClaimButtonProps) => {
  const dispatch = useDispatch()

  const onClaimRewardClicked = useCallback(() => {
    if (!challenge) return

    dispatch(
      claimChallengeReward({
        claim: {
          challengeId: challenge.challenge_id,
          specifiers:
            challenge.challenge_type === 'aggregate'
              ? getClaimableChallengeSpecifiers(
                  challenge.undisbursedSpecifiers,
                  undisbursedChallenges
                )
              : [{ specifier: challenge.specifier, amount: challenge.amount }],
          amount: challenge.claimableAmount
        },
        retryOnFailure: true
      })
    )
  }, [challenge, dispatch, undisbursedChallenges])

  let audioToClaim = 0
  if (challenge?.challenge_type === 'aggregate') {
    audioToClaim = challenge.claimableAmount
  } else if (challenge?.state === 'completed' && challenge?.cooldown_days) {
    audioToClaim = challenge.claimableAmount
  } else if (challenge?.state === 'completed' && !challenge?.cooldown_days) {
    audioToClaim = challenge.totalAmount
  }

  return audioToClaim > 0 ? (
    <Button
      variant='primary'
      isLoading={claimInProgress}
      iconRight={IconArrowRight}
      onClick={onClaimRewardClicked}
      fullWidth
    >
      {messages.claimableAmountLabel(audioToClaim)}
    </Button>
  ) : (
    <Button variant='secondary' onClick={onClose} fullWidth>
      {messages.close}
    </Button>
  )
}
