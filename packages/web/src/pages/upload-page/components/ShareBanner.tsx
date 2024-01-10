import { useCallback, useContext } from 'react'

import { Name, ShareSource, User, usersSocialActions } from '@audius/common'
import { Button, ButtonType, IconLink, IconTwitterBird } from '@audius/stems'
import { useDispatch } from 'react-redux'

import backgroundPlaceholder from 'assets/img/1-Concert-3-1.jpg'
import { make, useRecord } from 'common/store/analytics/actions'
import { getTwitterShareText } from 'components/share-modal/utils'
import { ToastContext } from 'components/toast/ToastContext'
import { Text } from 'components/typography'
import { SHARE_TOAST_TIMEOUT_MILLIS } from 'utils/constants'
import { openTwitterLink } from 'utils/tweet'

import styles from './ShareBanner.module.css'

const { shareUser } = usersSocialActions

const messages = {
  uploadComplete: 'Your Upload is Complete!',
  shareText: 'Share your profile with your fans',
  copyProfileToast: 'Copied Link to Profile',
  twitterButtonText: 'Twitter',
  copyLinkButtonText: 'Copy Link'
}

type ShareBannerProps = {
  user: User
  isUnlistedTrack: boolean
}

export const ShareBanner = (props: ShareBannerProps) => {
  const { user, isUnlistedTrack } = props
  const dispatch = useDispatch()
  const { toast } = useContext(ToastContext)
  const record = useRecord()

  const handleTwitterShare = useCallback(async () => {
    const { twitterText, link, analyticsEvent } = await getTwitterShareText({
      type: 'profile',
      profile: user
    })
    openTwitterLink(link, twitterText)
    record(
      make(Name.SHARE_TO_TWITTER, {
        source: ShareSource.UPLOAD,
        ...analyticsEvent
      })
    )
  }, [record, user])

  const handleCopyTrackLink = useCallback(() => {
    dispatch(shareUser(user.user_id, ShareSource.UPLOAD))
    toast(messages.copyProfileToast, SHARE_TOAST_TIMEOUT_MILLIS)
  }, [dispatch, toast, user.user_id])

  return (
    <div
      className={styles.root}
      style={{
        backgroundImage: `linear-gradient(315deg, rgba(91, 35, 225, 0.8) 0%, rgba(162, 47, 237, 0.8) 100%), url(${backgroundPlaceholder})`
      }}
    >
      <Text variant='display' as='h3' size='small' color='darkmodeStaticWhite'>
        {messages.uploadComplete}
      </Text>
      {!isUnlistedTrack ? (
        <>
          <Text variant='heading' size='medium' color='darkmodeStaticWhite'>
            {messages.shareText}
          </Text>
          <div className={styles.buttonContainer}>
            <Button
              fullWidth
              leftIcon={<IconTwitterBird />}
              onClick={handleTwitterShare}
              text={
                <Text variant='title' size='large' color='secondary'>
                  {messages.twitterButtonText}
                </Text>
              }
              type={ButtonType.WHITE}
            />
            <Button
              fullWidth
              leftIcon={<IconLink />}
              onClick={handleCopyTrackLink}
              text={
                <Text variant='title' size='large' color='secondary'>
                  {messages.copyLinkButtonText}
                </Text>
              }
              type={ButtonType.WHITE}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}
