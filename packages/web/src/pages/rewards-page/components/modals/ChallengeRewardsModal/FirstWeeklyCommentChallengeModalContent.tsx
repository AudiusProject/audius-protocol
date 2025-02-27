import { DefaultChallengeContent } from './DefaultChallengeContent'
import { type DefaultChallengeProps } from './types'

export const FirstWeeklyCommentChallengeModalContent = (
  props: DefaultChallengeProps
) => {
  const { challenge } = props
  const modifiedChallenge = challenge
    ? {
        ...challenge,
        totalAmount: challenge?.amount ?? 0
      }
    : undefined

  return <DefaultChallengeContent {...props} challenge={modifiedChallenge} />
}
