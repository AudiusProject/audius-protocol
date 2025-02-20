import { DefaultChallengeContent } from './DefaultChallengeContent'
import { type DefaultChallengeProps } from './types'

export const OneShotChallengeModalContent = (props: DefaultChallengeProps) => {
  const { challenge } = props
  const modifiedChallenge = challenge
    ? {
        ...challenge,
        totalAmount:
          (challenge?.claimableAmount ?? 0) + (challenge?.disbursed_amount ?? 0)
      }
    : undefined

  return <DefaultChallengeContent {...props} challenge={modifiedChallenge} />
}
