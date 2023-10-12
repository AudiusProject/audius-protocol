import { ReactNode, useCallback } from 'react'

import {
  ChallengeName,
  OptimisticUserChallenge,
  challengeRewardsConfig,
  formatNumberCommas
} from '@audius/common'
import {
  Button,
  ButtonType,
  IconArrowRight,
  IconCloudUpload,
  Text
} from '@audius/harmony'
import cn from 'classnames'

import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { isMobile } from 'utils/clientUtil'
import { EXPLORE_PREMIUM_TRACKS_PAGE, UPLOAD_PAGE } from 'utils/route'

import { ProgressDescription } from './ProgressDescription'
import { ProgressReward } from './ProgressReward'
import styles from './styles.module.css'

const messages = {
  rewardMapping: {
    [ChallengeName.AudioMatchingBuy]: '$AUDIO Every Dollar Spent',
    [ChallengeName.AudioMatchingSell]: '$AUDIO Every Dollar Earned'
  },
  descriptionSubtext: {
    [ChallengeName.AudioMatchingBuy]:
      'Note: There is a 7 day waiting period between when you purchase and when you can claim your reward.',
    [ChallengeName.AudioMatchingSell]:
      'Note: There is a 7 day waiting period between when your track is purchased and when you can claim your reward.'
  },
  viewPremiumTracks: 'View Premium Tracks',
  uploadTrack: 'Upload Track',
  totalEarned: (amount: string) => `Total $AUDIO Earned: ${amount}`,
  claimAudio: (amount: string) => `Claim ${amount} $AUDIO`
}

type AudioMatchingChallengeName =
  | ChallengeName.AudioMatchingBuy
  | ChallengeName.AudioMatchingSell

type AudioMatchingRewardsModalContentProps = {
  challenge?: OptimisticUserChallenge
  challengeName: AudioMatchingChallengeName
  onClaimRewardClicked: () => void
  claimInProgress?: boolean
  onNavigateAway: () => void
  errorContent?: ReactNode
}

const ctaButtonProps: {
  [k in AudioMatchingChallengeName]: Partial<HarmonyButtonProps>
} = {
  [ChallengeName.AudioMatchingBuy]: {
    iconRight: IconArrowRight,
    text: messages.viewPremiumTracks
  },
  [ChallengeName.AudioMatchingSell]: {
    iconLeft: IconCloudUpload,
    text: messages.uploadTrack
  }
}

export const AudioMatchingRewardsModalContent = ({
  challenge,
  challengeName,
  onClaimRewardClicked,
  claimInProgress = false,
  onNavigateAway,
  errorContent
}: AudioMatchingRewardsModalContentProps) => {
  const wm = useWithMobileStyle(styles.mobile)
  const navigateToPage = useNavigateToPage()
  const { fullDescription } = challengeRewardsConfig[challengeName]

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
      subtext={messages.rewardMapping[challengeName]}
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

  const handleClickCTA = useCallback(() => {
    const route =
      challengeName === ChallengeName.AudioMatchingBuy
        ? EXPLORE_PREMIUM_TRACKS_PAGE
        : UPLOAD_PAGE
    navigateToPage(route)
    onNavigateAway()
  }, [challengeName, onNavigateAway, navigateToPage])

  return (
    <div className={wm(cn(styles.container, styles.audioMatchingContainer))}>
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
      {challenge?.claimableAmount && challenge.claimableAmount > 0 ? (
        <Button
          fullWidth
          iconRight={IconArrowRight}
          isLoading={claimInProgress}
          isDisabled={claimInProgress}
          text={messages.claimAudio(
            formatNumberCommas(challenge.claimableAmount)
          )}
          onClick={onClaimRewardClicked}
        />
      ) : (
        <Button
          variant={ButtonType.SECONDARY}
          fullWidth
          {...ctaButtonProps[challengeName]}
          onClick={handleClickCTA}
        />
      )}
      {errorContent}

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
