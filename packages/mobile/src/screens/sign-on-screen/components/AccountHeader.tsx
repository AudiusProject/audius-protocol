import { css } from '@emotion/native'
import {
  getCoverPhotoField,
  getHandleField,
  getIsVerified,
  getNameField,
  getProfileImageField
} from 'audius-client/src/common/store/pages/signon/selectors'
import { isEmpty } from 'lodash'
import { Pressable, type ImageURISource, Dimensions } from 'react-native'
import { useSelector } from 'react-redux'

import {
  Avatar,
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
  profilePicture: ImageURISource | undefined
  coverPhoto: ImageURISource | undefined
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
      <Flex
        direction='row'
        alignItems='flex-start'
        gap='s'
        style={css({
          position: 'absolute',
          left: spacing.unit4,
          top: spacing.unit10,
          width: Dimensions.get('window').width - 4 * spacing.unit4
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
  const { value: coverPhoto } = useSelector(getCoverPhotoField) ?? {}
  const { value: displayName } = useSelector(getNameField)
  const { value: profileImage } = useSelector(getProfileImageField) ?? {}
  const isVerified = useSelector(getIsVerified)

  return (
    <AccountHeader
      handle={handle}
      coverPhoto={
        isEmpty(coverPhoto) ? undefined : (coverPhoto as ImageURISource)
      }
      displayName={displayName}
      profilePicture={
        isEmpty(profileImage) ? undefined : (profileImage as ImageURISource)
      }
      isVerified={isVerified}
    />
  )
}

type CoverPhotoProps = {
  onSelectCoverPhoto?: () => void
  profilePicture?: ImageURISource
  coverPhoto?: ImageURISource
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
  const { value: coverPhoto } = useSelector(getCoverPhotoField) ?? {}
  const { value: profileImage } = useSelector(getProfileImageField) ?? {}
  return (
    <CoverPhoto
      coverPhoto={coverPhoto as ImageURISource}
      profilePicture={profileImage as ImageURISource}
    />
  )
}

type ProfilePictureProps = {
  profilePicture?: ImageURISource
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
        source={profilePicture ?? { uri: undefined }}
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
  const { value: profileImage } = useSelector(getProfileImageField) ?? {}
  return <ProfilePicture profilePicture={profileImage as ImageURISource} />
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
        <Text variant='title' size='s' color='staticWhite' shadow={shadow}>
          {' '}
          @{handle}{' '}
        </Text>
        {isVerified ? <IconVerified size='s' /> : null}
      </Flex>
    </Flex>
  )
}
