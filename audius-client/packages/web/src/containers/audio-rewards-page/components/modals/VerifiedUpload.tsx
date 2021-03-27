import {
  Button,
  ButtonType,
  IconInstagram,
  IconTwitterBird,
  IconUpload
} from '@audius/stems'
import TwitterButton from 'components/general/TwitterButton'
import React, { useCallback } from 'react'
import { useModalState } from 'hooks/useModalState'
import ModalDrawer from './ModalDrawer'
import { InstagramButton } from 'components/general/InstagramButton'

import styles from './VerifiedUpload.module.css'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { SETTINGS_PAGE, UPLOAD_PAGE } from 'utils/route'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'

const messages = {
  title: 'Verified Upload',
  step1Title: 'Step 1: ✅ Link Verified Social Media Accounts',
  step1Subtitle: 'Link your verified Twitter or Instagram Account',
  verifyTwitterButton: 'Verify With Twitter',
  verifyIGButton: 'Verify With Instagram',
  step2Title: 'Step 2: Upload a Track',
  step2Subtitle: 'Upload some music to your verified Account',
  uploadButton: 'Upload',
  step3Title: 'Step 3: Tag us And Let Us Know',
  step3Subtitle:
    'Post a link to your track from your verified Twittter or Instagram and tag us',
  findUsTwitter: 'Find Us On Twitter',
  findUsInstagram: 'Find Us On Instagram'
}

const TWITTER_LINK = 'https://twitter.com/AudiusProject'
const IG_LINK = 'https://www.instagram.com/audiusmusic/?hl=en'

const onClickTwitter = () => {
  window.open(TWITTER_LINK, '_blank')
}

const onClickInstagram = () => {
  window.open(IG_LINK, '_blank')
}

const Divider = () => <div className={styles.divider} />

const VerifiedUpload = ({ dismissModal }: { dismissModal: () => void }) => {
  const navigate = useNavigateToPage()

  const onClickUpload = useCallback(() => {
    navigate(UPLOAD_PAGE)
    dismissModal()
  }, [navigate, dismissModal])

  const onClickVerify = useCallback(() => {
    navigate(SETTINGS_PAGE)
    dismissModal()
  }, [navigate, dismissModal])

  const wm = useWithMobileStyle(styles.mobile)
  return (
    <div className={wm(styles.container)}>
      <span className={styles.title}>{messages.step1Title}</span>
      <span className={styles.subtitle}>{messages.step1Subtitle}</span>
      <div className={styles.verifyButtons}>
        <TwitterButton
          textLabel={messages.verifyTwitterButton}
          size='large'
          className={styles.twitterButton}
          onClick={onClickVerify}
        />
        <InstagramButton
          className={styles.instagramButton}
          text={messages.verifyIGButton}
          onClick={onClickVerify}
        />
      </div>
      <Divider />
      <span className={styles.title}>{messages.step2Title}</span>
      <span className={styles.subtitle}>{messages.step2Subtitle}</span>
      <Button
        className={styles.uploadButton}
        text={messages.uploadButton}
        rightIcon={<IconUpload />}
        type={ButtonType.PRIMARY_ALT}
        onClick={onClickUpload}
      />
      <Divider />
      <span className={styles.title}>{messages.step3Title}</span>
      <span className={styles.subtitle}>{messages.step3Subtitle}</span>
      <div className={styles.findUsCTA}>
        <div className={styles.ctaContainer}>
          <IconTwitterBird />
          <div className={styles.ctaRight}>
            <span>{messages.findUsTwitter}</span>
            <div className={styles.link} onClick={onClickTwitter}>
              @AudiusProject
            </div>
          </div>
        </div>
        <div className={styles.ctaContainer}>
          <IconInstagram />
          <div className={styles.ctaRight}>
            <span>{messages.findUsInstagram}</span>
            <div className={styles.link} onClick={onClickInstagram}>
              @AudiusMusic
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const VerifiedUploadModal = () => {
  const [isOpen, setOpen] = useModalState('LinkSocialRewardsExplainer')

  return (
    <ModalDrawer
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      title={messages.title}
    >
      <VerifiedUpload dismissModal={() => setOpen(false)} />
    </ModalDrawer>
  )
}

export default VerifiedUploadModal
