import React, { useState, useContext, useCallback } from 'react'
import { debounce } from 'lodash'
import { Modal, Button, ButtonType, IconMail, IconSignOut } from '@audius/stems'

import MobilePageContainer from 'components/general/MobilePageContainer'
import GroupableList from 'components/groupable-list/GroupableList'
import Grouping from 'components/groupable-list/Grouping'
import Row from 'components/groupable-list/Row'
import { useUserProfilePicture } from 'hooks/useImageSize'

import TwitterAccountVerified from '../TwitterAccountVerified'
import settingsPageStyles from './SettingsPage.module.css'
import styles from './AccountSettingsPage.module.css'
import { SquareSizes } from 'models/common/ImageSizes'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { SettingsPageProps } from './SettingsPage'
import AudiusBackend from 'services/AudiusBackend'
import SignOutPage from 'containers/nav/mobile/SignOut'
import { ToastContext } from 'components/toast/ToastContext'
import { make, useRecord } from 'store/analytics/actions'
import { Name } from 'services/analytics'

const messages = {
  recovery: `Store your recovery email safely.
This email is the only way to recover your account if you forget your password.`,
  verified:
    'Link your verified Twitter Account to instantly become verified on Audius!',
  signOut:
    'Make sure you have your account recovery email stored somewhere safe before signing out!',
  emailSent: 'Email Sent!',
  emailNotSent: 'Something broke! Please try again!',
  holdUp: 'HOLD UP!'
}

const AccountSettingsPage = ({
  title,
  description,
  userId,
  name,
  handle,
  profilePictureSizes,
  isVerified,
  onTwitterLogin,
  onTwitterCompleteOauth
}: SettingsPageProps) => {
  const [showModalSignOut, setShowModalSignOut] = useState(false)
  const { toast } = useContext(ToastContext)

  const profilePicture = useUserProfilePicture(
    userId,
    profilePictureSizes,
    SquareSizes.SIZE_480_BY_480
  )
  const record = useRecord()
  const onClickRecover = useCallback(
    debounce(
      async () => {
        try {
          await AudiusBackend.sendRecoveryEmail()
          toast(messages.emailSent)
          record(make(Name.SETTINGS_RESEND_ACCOUNT_RECOVERY, {}))
        } catch (e) {
          toast(messages.emailNotSent)
        }
      },
      2000,
      { leading: true, trailing: false }
    ),
    [toast]
  )

  const onTwitterClick = useCallback(() => {
    record(make(Name.SETTINGS_START_TWITTER_OAUTH, {}))
  }, [record])

  return (
    <MobilePageContainer
      title={title}
      description={description}
      containerClassName={settingsPageStyles.pageBackground}
    >
      <div className={settingsPageStyles.bodyContainer}>
        <div className={styles.account}>
          <DynamicImage
            image={profilePicture}
            wrapperClassName={styles.profilePicture}
          />
          <div className={styles.info}>
            <div className={styles.name}>{name}</div>
            <div className={styles.handle}>{`@${handle}`}</div>
          </div>
        </div>
        <GroupableList>
          <Grouping>
            <Row
              prefix={<i className='emoji small key' />}
              title='Recovery Email'
              body={messages.recovery}
            >
              <Button
                onClick={onClickRecover}
                className={styles.resetButton}
                type={ButtonType.COMMON_ALT}
                text='Resend'
                leftIcon={<IconMail />}
              />
            </Row>
          </Grouping>
          <Grouping>
            <Row
              prefix={<i className='emoji small white-heavy-check-mark' />}
              title='Get Verified'
              body={messages.verified}
            >
              <TwitterAccountVerified
                isMobile
                isVerified={isVerified}
                onTwitterLogin={onTwitterLogin}
                onTwitterClick={onTwitterClick}
                onTwitterCompleteOauth={onTwitterCompleteOauth}
              />
            </Row>
          </Grouping>
          <Grouping>
            <Row
              prefix={<i className='emoji small octagonal-sign' />}
              title='Sign Out'
              body={messages.signOut}
            >
              <Button
                className={styles.signOutButton}
                type={ButtonType.COMMON_ALT}
                text='Sign Out'
                leftIcon={<IconSignOut />}
                onClick={() => setShowModalSignOut(true)}
              />
            </Row>
          </Grouping>
        </GroupableList>
        <Modal
          showTitleHeader
          showDismissButton
          title={messages.holdUp}
          isOpen={showModalSignOut}
          allowScroll={false}
          bodyClassName={styles.modal}
          onClose={() => setShowModalSignOut(false)}
        >
          <SignOutPage onClickBack={() => setShowModalSignOut(false)} />
        </Modal>
      </div>
    </MobilePageContainer>
  )
}

export default AccountSettingsPage
