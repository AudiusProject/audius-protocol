import { OptimisticUserChallenge } from '~/models'
import { fillString, formatNumberCommas } from '~/utils'

const messages = {
  completeLabel: 'COMPLETE',
  readyToClaim: 'Ready to Claim',
  pendingRewards: 'Pending Reward'
}

export const useFormattedProgressLabel = ({
  challenge,
  progressLabel,
  remainingLabel
}: {
  challenge?: OptimisticUserChallenge
  progressLabel?: string
  remainingLabel?: string
}) => {
  let label: string

  const shouldShowCompleted = challenge?.state === 'disbursed'
  const needsDisbursement = challenge && challenge.claimableAmount > 0
  const pending =
    challenge?.undisbursedSpecifiers &&
    challenge?.undisbursedSpecifiers.length > 0

  if (shouldShowCompleted) {
    label = messages.completeLabel
  } else if (challenge && challenge?.cooldown_days > 0) {
    if (needsDisbursement) {
      label = messages.readyToClaim
    } else if (pending) {
      label = messages.pendingRewards
    } else if (
      challenge?.challenge_type === 'aggregate' &&
      challenge?.max_steps !== null
    ) {
      // Count down
      label = fillString(
        remainingLabel ?? '',
        formatNumberCommas(
          (challenge?.max_steps - challenge?.current_step_count)?.toString() ??
            ''
        ),
        formatNumberCommas(challenge?.max_steps?.toString() ?? '')
      )
    } else {
      label = fillString(
        progressLabel ?? '',
        formatNumberCommas(challenge?.current_step_count?.toString() ?? ''),
        formatNumberCommas(challenge?.max_steps?.toString() ?? '')
      )
    }
  } else if (
    challenge?.challenge_type === 'aggregate' &&
    challenge?.max_steps !== null
  ) {
    if (needsDisbursement) {
      label = messages.readyToClaim
    } else {
      // Count down
      label = fillString(
        remainingLabel ?? '',
        formatNumberCommas(
          (challenge?.max_steps - challenge?.current_step_count)?.toString() ??
            ''
        ),
        formatNumberCommas(challenge?.max_steps?.toString() ?? '')
      )
    }
  } else {
    // Count up
    label = fillString(
      progressLabel ?? '',
      formatNumberCommas(challenge?.current_step_count?.toString() ?? ''),
      formatNumberCommas(challenge?.max_steps?.toString() ?? '')
    )
  }

  return label
}
