import React, { useCallback } from 'react'

import { Button, ButtonType, IconTwitterBird, IconCheck } from '@audius/stems'
import cn from 'classnames'

import { useSelector } from 'common/hooks/useSelector'
import { Name } from 'common/models/Analytics'
import { SquareSizes } from 'common/models/ImageSizes'
import { getAccountUser } from 'common/store/account/selectors'
import { getSendTipData } from 'common/store/tipping/selectors'
import { formatWei, weiToAudioString } from 'common/utils/wallet'
import UserBadges from 'components/user-badges/UserBadges'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { useRecord, make } from 'store/analytics/actions'
import { openTwitterLink } from 'utils/tweet'

import styles from './TipAudio.module.css'

const messages = {
  sending: 'SENDING',
  sentSuccessfully: 'SENT SUCCESSFULLY',
  supportOnTwitter: 'Share your support on Twitter!',
  shareToTwitter: 'Share to Twitter',
  twitterCopy: 'TBD'
}

export const TipSent = () => {
  const record = useRecord()
  const account = useSelector(getAccountUser)
  const sendTipData = useSelector(getSendTipData)
  const { user: recipient, amount: sendAmount } = sendTipData
  const profileImage = useUserProfilePicture(
    recipient?.user_id ?? null,
    recipient?._profile_picture_sizes ?? null,
    SquareSizes.SIZE_150_BY_150
  )

  const handleShareClick = useCallback(() => {
    // todo: update url and copy
    openTwitterLink(null, messages.twitterCopy)
    if (account && recipient) {
      record(
        make(Name.TIP_AUDIO_TWITTER_SHARE, {
          senderWallet: account.spl_wallet,
          recipientWallet: recipient.spl_wallet,
          senderHandle: account.handle,
          recipientHandle: recipient.handle,
          amount: weiToAudioString(sendAmount)
        })
      )
    }
  }, [account, recipient, record, sendAmount])

  const renderSentAudio = () => (
    <>
      <div className={cn(styles.flexCenter, styles.sentSuccessfullyContainer)}>
        <span className={styles.sentSuccessfullyIcon}>
          <IconCheck />
        </span>
        {messages.sentSuccessfully}
      </div>
      <div className={cn(styles.flexCenter, styles.sentAudio)}>
        <span className={styles.sendAmount}>{formatWei(sendAmount, true)}</span>
        $AUDIO
      </div>
    </>
  )

  return recipient ? (
    <div className={styles.container}>
      {renderSentAudio()}
      <div className={cn(styles.profileUser, styles.confirmProfileUser)}>
        <div className={styles.accountWrapper}>
          <img
            className={cn(styles.dynamicPhoto, styles.smallDynamicPhoto)}
            src={profileImage}
          />
          <div className={styles.userInfoWrapper}>
            <div className={styles.name}>
              {recipient.name}
              <UserBadges
                userId={recipient?.user_id}
                badgeSize={12}
                className={styles.badge}
              />
            </div>
            <div className={styles.handleContainer}>
              <span className={styles.handle}>{`@${recipient.handle}`}</span>
            </div>
          </div>
        </div>
      </div>
      <div className={cn(styles.flexCenter, styles.support)}>
        {messages.supportOnTwitter}
      </div>
      <div className={styles.flexCenter}>
        <Button
          className={styles.shareButton}
          type={ButtonType.PRIMARY}
          text={messages.shareToTwitter}
          onClick={handleShareClick}
          leftIcon={<IconTwitterBird width={24} height={24} />}
        />
      </div>
    </div>
  ) : null
}
