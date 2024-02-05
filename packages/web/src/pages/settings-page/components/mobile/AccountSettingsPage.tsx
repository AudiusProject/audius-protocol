import { useState, useContext, useCallback } from 'react'

import { Name, SquareSizes } from '@audius/common/models'
import { IconVerified, IconRecoveryEmail, IconSignOut } from '@audius/harmony'
import { Modal, Button, ButtonType } from '@audius/stems'
import cn from 'classnames'
import { debounce } from 'lodash'

import { make, useRecord } from 'common/store/analytics/actions'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import GroupableList from 'components/groupable-list/GroupableList'
import Grouping from 'components/groupable-list/Grouping'
import Row from 'components/groupable-list/Row'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import SignOutPage from 'components/nav/mobile/SignOut'
import { ToastContext } from 'components/toast/ToastContext'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import {
  ACCOUNT_VERIFICATION_SETTINGS_PAGE,
  CHANGE_PASSWORD_SETTINGS_PAGE
} from 'utils/route'

import styles from './AccountSettingsPage.module.css'
import { SettingsPageProps } from './SettingsPage'
import settingsPageStyles from './SettingsPage.module.css'

const messages = {
  recovery: `Store your recovery email safely.
This email is the only way to recover your account if you forget your password.`,
  verified: 'Get verified by linking a verified social account to Audius',
  signOut:
    'Make sure you have your account recovery email stored somewhere safe before signing out!',
  emailSent: 'Email Sent!',
  emailNotSent: 'Something broke! Please try again!',
  holdUp: 'HOLD UP!',
  verify: 'Verification',
  isVerified: 'You’re Verified!',
  changePassword: 'Change Password',
  changePasswordPrompt: 'Change your password',
  changePasswordButton: 'Change'
}

const AccountSettingsPage = ({
  title,
  description,
  userId,
  name,
  handle,
  profilePictureSizes,
  goToRoute,
  isVerified
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
    () =>
      debounce(
        async () => {
          try {
            await audiusBackendInstance.sendRecoveryEmail()
            toast(messages.emailSent)
            record(make(Name.SETTINGS_RESEND_ACCOUNT_RECOVERY, {}))
          } catch (e) {
            toast(messages.emailNotSent)
          }
        },
        2000,
        { leading: true, trailing: false }
      )(),
    [toast, record]
  )

  const goToVerificationPage = useCallback(() => {
    goToRoute(ACCOUNT_VERIFICATION_SETTINGS_PAGE)
  }, [goToRoute])

  const goToChangePasswordSettingsPage = useCallback(() => {
    goToRoute(CHANGE_PASSWORD_SETTINGS_PAGE)
  }, [goToRoute])

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
                leftIcon={<IconRecoveryEmail color='accent' />}
              />
            </Row>
          </Grouping>
          <Grouping>
            <Row
              prefix={<i className='emoji small white-heavy-check-mark' />}
              title='Get Verified'
              body={messages.verified}
            >
              {isVerified ? (
                <Button
                  text={messages.isVerified}
                  onClick={goToVerificationPage}
                  type={ButtonType.COMMON_ALT}
                  isDisabled={true}
                  className={cn(styles.verificationBtn, styles.isVerified)}
                  textClassName={styles.verifiedText}
                  leftIcon={<IconVerified className={styles.verifiedIcon} />}
                />
              ) : (
                <Button
                  text={messages.verify}
                  onClick={goToVerificationPage}
                  type={ButtonType.COMMON_ALT}
                  className={styles.verificationBtn}
                  leftIcon={<IconVerified className={styles.verifiedIcon} />}
                />
              )}
            </Row>
          </Grouping>
          <Grouping>
            <Row
              prefix={<i className='emoji small lock' />}
              title={messages.changePassword}
              body={messages.changePasswordPrompt}
            >
              <Button
                text={messages.changePasswordButton}
                onClick={goToChangePasswordSettingsPage}
                type={ButtonType.COMMON_ALT}
                className={styles.changePasswordButton}
                leftIcon={<IconRecoveryEmail color='accent' />}
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
