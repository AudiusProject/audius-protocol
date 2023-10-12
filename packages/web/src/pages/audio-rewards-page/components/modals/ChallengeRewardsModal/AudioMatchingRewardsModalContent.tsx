import {
  ChallengeName,
  OptimisticUserChallenge,
  challengeRewardsConfig,
  formatNumberCommas
} from '@audius/common'
import { Text } from '@audius/harmony'

import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { isMobile } from 'utils/clientUtil'

import { ProgressDescription } from './ProgressDescription'
import { ProgressReward } from './ProgressReward'
import styles from './styles.module.css'

const messages = {
  audioPerDollarSpent: '$AUDIO Every Dollar Spent',
  descriptionSubtext: {
    [ChallengeName.AudioMatchingBuy]:
      'Note: There is a 7 day waiting period between when you purchase and when you can claim your reward.',
    [ChallengeName.AudioMatchingSell]:
      'Note: There is a 7 day waiting period between when your track is purchased and when you can claim your reward.'
  },
  totalEarned: (amount: string) => `Total $AUDIO Earned: ${amount}`
}

type AudioMatchingRewardsModalContentProps = {
  challenge?: OptimisticUserChallenge
  challengeName:
    | ChallengeName.AudioMatchingBuy
    | ChallengeName.AudioMatchingSell
}

export const AudioMatchingRewardsModalContent = ({
  challenge,
  challengeName
}: AudioMatchingRewardsModalContentProps) => {
  const wm = useWithMobileStyle(styles.mobile)
  const { fullDescription, progressLabel, isVerifiedChallenge } =
    challengeRewardsConfig[challengeName]

  const audioClaimedSoFar = challenge
    ? challenge.amount * challenge.current_step_count -
      challenge.claimableAmount
    : 0

  const progressDescription = (
    <ProgressDescription
      description={
        <div className={styles.audioMatchingDescription}>
          <Text variant='body'>{fullDescription?.(challenge)}</Text>
          <Text variant='body' color='subdued'>
            {messages.descriptionSubtext[challengeName]}
          </Text>
        </div>
      }
    />
  )
  const progressReward = (
    <ProgressReward
      amount={formatNumberCommas(challenge?.amount ?? '')}
      subtext={messages.audioPerDollarSpent}
    />
  )
  const progressStatusLabel =
    audioClaimedSoFar > 0 ? (
      <div className={styles.audioMatchingTotalContainer}>
        <Text variant='label' size='l' strength='strong' color='subdued'>
          {messages.totalEarned(
            formatNumberCommas(audioClaimedSoFar.toString())
          )}
        </Text>
      </div>
    ) : null

  return (
    <div className={wm(styles.container)}>
      {isMobile() ? (
        <>
          {progressDescription}
          <div className={wm(styles.progressCard)}>
            <div className={wm(styles.progressInfo)}>{progressReward}</div>
            {progressStatusLabel}
          </div>
        </>
      ) : (
        <div className={styles.progressCard}>
          <div className={styles.progressInfo}>
            {progressDescription}
            {progressReward}
          </div>
          {progressStatusLabel}
        </div>
      )}

      {/* {buttonLink && challenge?.state !== 'completed' && (
        <Button
          className={wm(cn(styles.button, styles.buttonLink))}
          type={ButtonType.PRIMARY_ALT}
          text={buttonInfo?.label}
          onClick={goToRoute}
          leftIcon={buttonInfo?.leftIcon}
          rightIcon={buttonInfo?.rightIcon}
        />
      )}
      <div className={wm(styles.claimRewardWrapper)}>
        {audioToClaim > 0 ? (
          <>
            <div className={styles.claimRewardAmountLabel}>
              {`${audioToClaim} ${messages.claimAmountLabel}`}
            </div>
            <Button
              text={messages.claimYourReward}
              className={wm(styles.button)}
              type={
                claimInProgress ? ButtonType.DISABLED : ButtonType.PRIMARY_ALT
              }
              isDisabled={claimInProgress}
              rightIcon={
                claimInProgress ? (
                  <LoadingSpinner className={styles.spinner} />
                ) : (
                  <IconCheck />
                )
              }
              onClick={onClaimRewardClicked}
            />
          </>
        ) : null}
        {audioClaimedSoFar > 0 && challenge?.state !== 'disbursed' ? (
          <div className={styles.claimRewardClaimedAmountLabel}>
            {`(${formatNumberCommas(audioClaimedSoFar)} ${
              messages.claimedSoFar
            })`}
          </div>
        ) : null}
      </div>
      {claimStatus === ClaimStatus.ERROR && (
        <div className={styles.claimError}>{getErrorMessage()}</div>
      )} */}
    </div>
  )
}
