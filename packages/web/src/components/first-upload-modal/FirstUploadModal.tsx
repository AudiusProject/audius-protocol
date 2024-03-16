import { useCallback, useEffect } from 'react'

import { Name, SquareSizes } from '@audius/common/models'
import { accountSelectors, musicConfettiActions } from '@audius/common/store'
import { Modal } from '@audius/harmony'
import { connect, useDispatch } from 'react-redux'
import { Dispatch } from 'redux'

import { useRecord, make } from 'common/store/analytics/actions'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import ConnectedMusicConfetti from 'components/music-confetti/ConnectedMusicConfetti'
import { TwitterButton } from 'components/social-button'
import UserBadges from 'components/user-badges/UserBadges'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { AppState } from 'store/types'
import { fullProfilePage } from 'utils/route'
import { openTwitterLink } from 'utils/tweet'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './FirstUploadModal.module.css'
import { getIsOpen } from './store/selectors'
import { setVisibility } from './store/slice'
const { show } = musicConfettiActions
const getAccountUser = accountSelectors.getAccountUser

const messages = {
  first: 'You just uploaded your first track to Audius!',
  deal: 'That’s a pretty big deal.',
  share: 'Share with your fans and let them know you’re here!',
  shareButton: 'Share With Your Fans',
  // Note: twitter auto appends the link to the text
  tweet:
    'I just joined @audius and uploaded my first track! Check out my profile here: '
}

const Title = () => {
  return (
    <div className={styles.title}>
      <span>Congratulations</span>
      <i className='emoji face-with-party-horn-and-party-hat xl' />
    </div>
  )
}

type OwnProps = {}
type FirstUploadModalProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const g = withNullGuard(
  ({ account, ...p }: FirstUploadModalProps) => account && { ...p, account }
)

const FirstUploadModal = g(({ account, isOpen, close }) => {
  const image = useUserProfilePicture(
    account.user_id,
    account._profile_picture_sizes,
    SquareSizes.SIZE_480_BY_480
  )

  const record = useRecord()
  const onShare = useCallback(() => {
    const url = fullProfilePage(account.handle)
    const text = messages.tweet
    openTwitterLink(url, text)
    record(make(Name.TWEET_FIRST_UPLOAD, { handle: account.handle }))
  }, [account, record])

  const dispatch = useDispatch()
  useEffect(() => {
    if (isOpen) {
      dispatch(show())
    }
  }, [isOpen, dispatch])

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={close}
        bodyClassName={styles.modalBody}
        contentHorizontalPadding={32}
        showTitleHeader
        showDismissButton
        dismissOnClickOutside={false}
        title={<Title />}
      >
        <div className={styles.content}>
          <div className={styles.artist}>
            <DynamicImage
              image={image}
              wrapperClassName={styles.imageWrapper}
              className={styles.image}
            />
            <div className={styles.name}>
              <span>{account.name}</span>
              <UserBadges
                userId={account.user_id}
                className={styles.iconVerified}
                badgeSize={12}
              />
            </div>
            <div className={styles.handle}>{`@${account.handle}`}</div>
          </div>
          <div className={styles.callToAction}>
            <div className={styles.text}>{messages.first}</div>
            <div className={styles.text}>{messages.deal}</div>
            <div className={styles.text}>{messages.share}</div>
            <TwitterButton onClick={onShare} className={styles.tweetButton}>
              {messages.shareButton}
            </TwitterButton>
          </div>
        </div>
      </Modal>
      {isOpen && <ConnectedMusicConfetti />}
    </>
  )
})

function mapStateToProps(state: AppState) {
  return {
    account: getAccountUser(state),
    isOpen: getIsOpen(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    close: () => dispatch(setVisibility({ isOpen: false }))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(FirstUploadModal)
