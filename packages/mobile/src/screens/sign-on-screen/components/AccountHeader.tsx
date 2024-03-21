import type { Image } from '@audius/common/store'
import { css } from '@emotion/native'
import {
  getCoverPhotoField,
  getHandleField,
  getIsVerified,
  getNameField,
  getProfileImageField
} from 'audius-client/src/common/store/pages/signon/selectors'
import type { ImageFieldValue } from 'audius-client/src/pages/sign-up-page/components/ImageField'
import { isEmpty } from 'lodash'
import { Pressable, Dimensions } from 'react-native'
import type { ImageSourcePropType } from 'react-native'
import { useSelector } from 'react-redux'

import {
  Avatar,
  Divider,
  Flex,
  CoverPhoto as HarmonyCoverPhoto,
  IconButton,
  IconCamera,
  IconImage,
  IconVerified,
  Text,
  useTheme
} from '@audius/harmony-native'

const messages = {
  selectCoverPhoto: 'Select Cover Photo',
  selectProfilePicture: 'Select Profile Picture'
}

type AccountHeaderProps = {
  onSelectCoverPhoto?: () => void
  onSelectProfilePicture?: () => void
  profilePicture: Image | undefined | null
  coverPhoto: Image | undefined | null
  displayName: string
  handle: string
  isVerified: boolean
}

export const AccountHeader = (props: AccountHeaderProps) => {
  const {
    onSelectCoverPhoto,
    onSelectProfilePicture,
    profilePicture,
    coverPhoto,
    displayName,
    handle,
    isVerified
  } = props

  const { spacing } = useTheme()

  return (
    // 2 zIndex is to appear above the <Page> component
    <Flex style={{ zIndex: 2 }} w='100%'>
      <CoverPhoto
        onSelectCoverPhoto={onSelectCoverPhoto}
        profilePicture={profilePicture}
        coverPhoto={coverPhoto}
      />
      <Divider />
      <Flex
        direction='row'
        alignItems='flex-start'
        gap='s'
        style={css({
          position: 'absolute',
          left: spacing.unit4,
          top: spacing.unit10,
          // Need to use explicit width to ensure text doesn't overflow
          // unit16 covers the 4xunit4 spacings on left and right
          width: Dimensions.get('window').width - spacing.unit16
        })}
      >
        <ProfilePicture
          profilePicture={profilePicture}
          onSelectProfilePicture={onSelectProfilePicture}
        />
        <AccountDetails
          displayName={displayName}
          handle={handle}
          isVerified={isVerified}
          emphasis={!coverPhoto}
        />
      </Flex>
    </Flex>
  )
}

export const ReadOnlyAccountHeader = () => {
  const { value: handle } = useSelector(getHandleField)
  const coverPhoto = useSelector(getCoverPhotoField)
  const { value: displayName } = useSelector(getNameField)
  const profileImage = useSelector(getProfileImageField)
  const isVerified = useSelector(getIsVerified)

  return (
    <AccountHeader
      handle={handle}
      coverPhoto={isEmpty(coverPhoto) ? undefined : coverPhoto}
      displayName={displayName}
      profilePicture={isEmpty(profileImage) ? undefined : profileImage}
      isVerified={isVerified}
    />
  )
}

type CoverPhotoProps = {
  onSelectCoverPhoto?: () => void
  profilePicture?: Image | null | undefined
  coverPhoto?: Image | null | undefined
}

const CoverPhoto = (props: CoverPhotoProps) => {
  const { onSelectCoverPhoto, profilePicture, coverPhoto } = props
  const { spacing } = useTheme()

  return (
    <HarmonyCoverPhoto
      profilePicture={profilePicture}
      coverPhoto={coverPhoto}
      topCornerRadius={onSelectCoverPhoto ? 'm' : undefined}
    >
      {onSelectCoverPhoto ? (
        <Pressable
          // we want the pressable surface larger than just the icon
          hitSlop={{
            bottom: spacing.unit10,
            left: spacing.unit7,
            right: 0,
            top: 0
          }}
          onPress={onSelectCoverPhoto}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            display: 'flex'
          }}
        >
          <IconButton
            accessibilityLabel={messages.selectCoverPhoto}
            style={{
              paddingTop: spacing.m,
              paddingRight: spacing.m,
              borderRadius: 0
            }}
            color='staticWhite'
            shadow='near'
            onPress={onSelectCoverPhoto}
            icon={IconImage}
          />
        </Pressable>
      ) : null}
    </HarmonyCoverPhoto>
  )
}

export const ReadOnlyCoverPhotoBanner = () => {
  const coverPhoto = useSelector(getCoverPhotoField)
  const profileImage = useSelector(getProfileImageField)

  return <CoverPhoto coverPhoto={coverPhoto} profilePicture={profileImage} />
}

type ProfilePictureProps = {
  profilePicture?: ImageFieldValue
  onSelectProfilePicture?: () => void
}

export const ProfilePicture = (props: ProfilePictureProps) => {
  const { profilePicture, onSelectProfilePicture } = props

  return (
    <Pressable onPress={onSelectProfilePicture}>
      <Avatar
        accessibilityLabel='Profile Picture'
        size='xl'
        variant='strong'
        source={
          (profilePicture?.file as ImageSourcePropType) ?? { uri: undefined }
        }
      >
        {onSelectProfilePicture && !profilePicture ? (
          <IconButton
            accessibilityLabel={messages.selectProfilePicture}
            icon={IconCamera}
            size='2xl'
            color='staticWhite'
            shadow='near'
            onPress={onSelectProfilePicture}
          />
        ) : null}
      </Avatar>
    </Pressable>
  )
}

export const ReadOnlyProfilePicture = () => {
  const profileImage = useSelector(getProfileImageField)
  return <ProfilePicture profilePicture={profileImage} />
}

type AccountDetailsProps = {
  displayName?: string
  handle?: string
  isVerified?: boolean
  emphasis: boolean
}

const AccountDetails = (props: AccountDetailsProps) => {
  const { displayName, handle, isVerified, emphasis } = props
  const shadow = emphasis ? 'emphasis' : undefined
  return (
    <Flex flex={1}>
      <Text
        variant='heading'
        size='s'
        strength='strong'
        color='staticWhite'
        ellipsizeMode='tail'
        numberOfLines={1}
        style={{ flex: 1, flexShrink: 1 }}
        shadow={shadow}
      >
        {displayName || ' '}
      </Text>
      <Flex h={50}>
        <Text
          variant='title'
          size='s'
          color='staticWhite'
          shadow={shadow}
          numberOfLines={1}
        >
          {' '}
          @{handle}{' '}
        </Text>
        {isVerified ? <IconVerified size='s' /> : null}
      </Flex>
    </Flex>
  )
}
