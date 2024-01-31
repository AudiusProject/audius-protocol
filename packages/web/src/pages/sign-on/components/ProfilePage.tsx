import { useState, useCallback, KeyboardEvent, useContext } from 'react'

import {
  Image,
  InstagramProfile,
  TwitterProfile,
  TikTokProfile
} from '@audius/common'
import {
  formatTwitterProfile,
  formatInstagramProfile,
  formatTikTokProfile
} from '@audius/common/services'
import cn from 'classnames'

import IconCaretLeft from 'assets/img/iconCaretLeft.svg'
import { ToastContext } from 'components/toast/ToastContext'
import { useIsMobile } from 'hooks/useIsMobile'
import CompleteProfileWithSocial from 'pages/sign-on/components/CompleteProfileWithSocial'
import ProfileForm, {
  ProfileFormProps
} from 'pages/sign-on/components/ProfileForm'
import { env } from 'services/env'
import { resizeImage } from 'utils/imageProcessingUtil'

import styles from './ProfilePage.module.css'

const GENERAL_ADMISSION = env.GENERAL_ADMISSION ?? ''

const messages = {
  header: 'Tell Us About Yourself So Others Can Find You',
  error: 'Something went wrong, please try again'
}

type ProfilePageProps = {
  profileImage?: Image
  twitterId: any
  isVerified: boolean
  onNextPage: () => void

  setTwitterProfile: (
    uuid: string,
    profile: TwitterProfile,
    profileImg?: Image,
    coverBannerImg?: Image,
    skipEdit?: boolean
  ) => void
  setInstagramProfile: (
    uuid: string,
    profile: InstagramProfile,
    profileImg?: Image,
    skipEdit?: boolean
  ) => void
  setTikTokProfile: (
    uuid: string,
    profile: TikTokProfile,
    profileImg?: Image,
    skipEdit?: boolean
  ) => void
  recordTwitterStart: () => void
  recordInstagramStart: () => void
  recordTikTokStart: () => void
  validateHandle: (
    handle: string,
    isOauthVerified: boolean,
    onValidate?: (error: boolean) => void
  ) => void
} & Pick<
  ProfileFormProps,
  'name' | 'handle' | 'onHandleChange' | 'onNameChange' | 'setProfileImage'
>

const ProfilePage = (props: ProfilePageProps) => {
  const {
    handle,
    isVerified,
    name,
    onHandleChange,
    onNameChange,
    onNextPage,
    profileImage,
    recordInstagramStart,
    recordTwitterStart,
    recordTikTokStart,
    setInstagramProfile,
    setProfileImage,
    setTikTokProfile,
    setTwitterProfile,
    twitterId,
    validateHandle
  } = props

  // If the handle field is disabled, don't let the user social auth
  const [showCompleteProfileWithSocial, setShowCompleteProfileWithSocial] =
    useState(handle.status !== 'disabled')
  const [isInitial, setIsInitial] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const setLoading = useCallback(() => setIsLoading(true), [setIsLoading])
  const { toast } = useContext(ToastContext)
  const isMobile = useIsMobile()

  const onToggleCompleteProfileWithSocial = useCallback(() => {
    setShowCompleteProfileWithSocial((show) => !show)
    setIsInitial(false)
  }, [])

  const getProfileValid = useCallback(() => {
    return !!(
      name.value &&
      (handle.status === 'success' || handle.status === 'disabled')
    )
  }, [name, handle])

  const onContinue = useCallback(() => {
    if (getProfileValid()) onNextPage()
  }, [getProfileValid, onNextPage])

  const handleAuthFailure = useCallback(() => {
    setIsLoading(false)
    toast(messages.error)
  }, [setIsLoading, toast])

  const onTwitterLogin = async (
    uuid: string,
    twitterProfile: TwitterProfile
  ) => {
    try {
      const { profile, profileImage, profileBanner, requiresUserReview } =
        await formatTwitterProfile(twitterProfile, resizeImage)

      validateHandle(
        profile.screen_name,
        profile.verified,
        (error: boolean) => {
          setTwitterProfile(
            uuid,
            profile,
            profileImage,
            profileBanner,
            !error && !requiresUserReview
          )
          setShowCompleteProfileWithSocial(false)
          setIsInitial(false)
          setIsLoading(false)
        }
      )
    } catch (err) {
      console.error(err)
      toast(messages.error)
      setShowCompleteProfileWithSocial(false)
      setIsInitial(false)
      setIsLoading(false)
    }
  }

  const onInstagramLogin = async (
    uuid: string,
    instagramProfile: InstagramProfile
  ) => {
    try {
      const { profile, profileImage, requiresUserReview } =
        await formatInstagramProfile(
          instagramProfile,
          GENERAL_ADMISSION,
          resizeImage
        )
      validateHandle(
        profile.username,
        profile.is_verified,
        (error: boolean) => {
          setInstagramProfile(
            uuid,
            profile,
            profileImage,
            !error && !requiresUserReview
          )
          setShowCompleteProfileWithSocial(false)
          setIsInitial(false)
        }
      )
    } catch (err) {
      toast(messages.error)
    } finally {
      setShowCompleteProfileWithSocial(false)
      setIsInitial(false)
      setIsLoading(false)
    }
  }

  const onTikTokLogin = async (uuid: string, tikTokProfile: TikTokProfile) => {
    try {
      const { profile, profileImage, requiresUserReview } =
        await formatTikTokProfile(tikTokProfile, resizeImage)
      validateHandle(
        profile.username,
        profile.is_verified,
        (error: boolean) => {
          setTikTokProfile(
            uuid,
            profile,
            profileImage,
            !error && !requiresUserReview
          )
          setShowCompleteProfileWithSocial(false)
          setIsInitial(false)
          setIsLoading(false)
        }
      )
    } catch (err) {
      toast(messages.error)
      setShowCompleteProfileWithSocial(false)
      setIsInitial(false)
      setIsLoading(false)
    }
  }

  const onHandleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.keyCode === 13 /** enter */) {
        onContinue()
      }
    },
    [onContinue]
  )

  const canUpdateHandle = !(
    isVerified &&
    twitterId &&
    handle.status === 'success'
  )
  const profileValid = getProfileValid()

  return (
    <div className={cn(styles.container, isMobile && styles.isMobile)}>
      {showCompleteProfileWithSocial ? (
        <CompleteProfileWithSocial
          isLoading={isLoading}
          isMobile={isMobile}
          initial={isInitial}
          onClick={setLoading}
          onFailure={handleAuthFailure}
          onInstagramLogin={onInstagramLogin}
          onInstagramStart={recordInstagramStart}
          onTikTokLogin={onTikTokLogin}
          onTikTokStart={recordTikTokStart}
          onToggleVisible={onToggleCompleteProfileWithSocial}
          onTwitterLogin={onTwitterLogin}
          onTwitterStart={recordTwitterStart}
          showCompleteProfileWithSocial={showCompleteProfileWithSocial}
        />
      ) : (
        <>
          <h2 className={styles.header}>{messages.header}</h2>
          <IconCaretLeft
            height={24}
            width={24}
            onClick={onToggleCompleteProfileWithSocial}
            className={styles.backButton}
          />
          <div className={styles.profileContentContainer}>
            <ProfileForm
              canUpdateHandle={canUpdateHandle}
              handle={handle}
              header={messages.header}
              name={name}
              onContinue={onContinue}
              onHandleChange={onHandleChange}
              onHandleKeyDown={onHandleKeyDown}
              onInstagramLogin={onInstagramLogin}
              onNameChange={onNameChange}
              onToggleTwitterOverlay={onToggleCompleteProfileWithSocial}
              onTwitterLogin={onTwitterLogin}
              profileImage={profileImage}
              profileValid={profileValid}
              setProfileImage={setProfileImage}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default ProfilePage
