import { useCurrentAccount, useCurrentAccountUser } from '~/api'
import { SquareSizes, WidthSizes } from '~/models'
import { User } from '~/models/User'
import { AccountState } from '~/store/account/types'
import { getProfileUserHandle } from '~/store/pages/profile/selectors'

import { Status } from '../../../models/Status'
import { CommonState } from '../../commonStore'

export const getUserCompletionStages = (
  currentAccount: AccountState | undefined | null,
  currentUser: User | undefined
) => {
  if (!currentAccount || !currentUser) {
    return {
      hasProfileDescription: false,
      hasFavoritedItem: false,
      hasReposted: false,
      hasFollowedAccounts: false,
      hasNameAndHandle: false,
      hasProfilePicture: false,
      hasCoverPhoto: false
    }
  }

  const hasProfileDescription =
    currentUser.bio !== null && currentUser.bio !== undefined
  const hasFavoritedItem = (currentAccount.trackSaveCount || 0) > 0
  const hasReposted = currentUser.repost_count > 0
  const hasFollowedAccounts = currentUser.followee_count >= 5
  const hasNameAndHandle = !!currentUser.name && !!currentUser.handle

  const validProfilePictureSizes = [
    SquareSizes.SIZE_150_BY_150,
    SquareSizes.SIZE_480_BY_480,
    SquareSizes.SIZE_1000_BY_1000
  ] as const

  const hasProfilePicture =
    (currentUser.profile_picture &&
      Object.keys(currentUser.profile_picture).some((size) =>
        validProfilePictureSizes.includes(size as SquareSizes)
      )) ||
    !!currentUser.profile_picture_sizes

  const validCoverPhotoSizes = [
    WidthSizes.SIZE_640,
    WidthSizes.SIZE_2000
  ] as const

  const hasCoverPhoto =
    (currentUser.cover_photo &&
      Object.keys(currentUser.cover_photo).some(
        (size) =>
          validCoverPhotoSizes.includes(size as WidthSizes) &&
          currentUser.cover_photo[size] !== undefined
      )) ||
    !!currentUser.cover_photo_sizes

  return {
    hasProfileDescription,
    hasFavoritedItem,
    hasReposted,
    hasFollowedAccounts,
    hasNameAndHandle,
    hasProfilePicture,
    hasCoverPhoto
  }
}

export const useUserCompletionStages = () => {
  const { data: currentAccount } = useCurrentAccount()
  const { data: currentUser } = useCurrentAccountUser()
  return getUserCompletionStages(currentAccount, currentUser)
}

export const getOrderedCompletionStages = (
  currentAccount: AccountState | undefined | null,
  currentUser: User | undefined
) => {
  const strings = {
    profileDescription: 'Profile Description',
    favorited: 'Favorite A Track/Playlist',
    reposted: 'Repost A Track/Playlist',
    followed: 'Follow Five Accounts',
    nameAndHandle: 'Name & Handle',
    profilePicture: 'Profile Picture',
    coverPhoto: 'Cover Photo'
  }

  const stages = getUserCompletionStages(currentAccount, currentUser)
  return [
    {
      title: strings.profileDescription,
      isCompleted: stages.hasProfileDescription
    },
    {
      title: strings.favorited,
      isCompleted: stages.hasFavoritedItem
    },
    {
      title: strings.reposted,
      isCompleted: stages.hasReposted
    },
    {
      title: strings.followed,
      isCompleted: stages.hasFollowedAccounts
    },
    {
      title: strings.nameAndHandle,
      isCompleted: stages.hasNameAndHandle
    },
    {
      title: strings.profilePicture,
      isCompleted: stages.hasProfilePicture
    },
    {
      title: strings.coverPhoto,
      isCompleted: stages.hasCoverPhoto
    }
  ]
}

export const useOrderedCompletionStages = () => {
  const { data: currentAccount } = useCurrentAccount()
  const { data: currentUser } = useCurrentAccountUser()
  return getOrderedCompletionStages(currentAccount, currentUser)
}

export const getProfilePageMeterDismissed = (state: CommonState) => {
  const profileHandle = getProfileUserHandle(state)
  if (!profileHandle) return false
  return state.pages.profile.entries[profileHandle]?.profileMeterDismissed
}

export const getIsAccountLoaded = (state: CommonState) =>
  state.account.status === Status.SUCCESS
