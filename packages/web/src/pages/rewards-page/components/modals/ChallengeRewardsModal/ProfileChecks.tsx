import { challengesSelectors } from '@audius/common/store'
import { Flex, IconValidationCheck } from '@audius/harmony'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import { useIsMobile } from 'hooks/useIsMobile'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'

import styles from './styles.module.css'

const messages = {
  profileCheckNameAndHandle: 'Name & Handle',
  profileCheckProfilePicture: 'Profile Picture',
  profileCheckCoverPhoto: 'Cover Photo',
  profileCheckProfileDescription: 'Profile Description',
  profileCheckFavorite: 'Favorite Track/Playlist',
  profileCheckRepost: 'Repost Track/Playlist',
  profileCheckFollow: 'Follow Five People'
}

const { getCompletionStages } = challengesSelectors

export const ProfileChecks = () => {
  const completionStages = useSelector(getCompletionStages)
  const wm = useWithMobileStyle(styles.mobile)
  const isMobile = useIsMobile()

  const config: Record<string, boolean> = {
    [messages.profileCheckNameAndHandle]: completionStages.hasNameAndHandle,
    [messages.profileCheckProfilePicture]: completionStages.hasProfilePicture,
    [messages.profileCheckCoverPhoto]: completionStages.hasCoverPhoto,
    [messages.profileCheckProfileDescription]:
      completionStages.hasProfileDescription,
    [messages.profileCheckFavorite]: completionStages.hasFavoritedItem,
    [messages.profileCheckRepost]: !!completionStages.hasReposted,
    [messages.profileCheckFollow]: completionStages.hasFollowedAccounts
  }

  return (
    <Flex
      column
      gap='m'
      wrap='wrap'
      ph={isMobile ? undefined : 'xl'}
      pv={isMobile ? undefined : 'm'}
      justifyContent='center'
      css={{
        maxHeight: 150
      }}
    >
      {Object.keys(config).map((key) => (
        <div className={wm(styles.profileTask)} key={key}>
          {config[key] ? (
            <IconValidationCheck />
          ) : (
            <div className={styles.profileTaskCircle} />
          )}
          <p className={cn({ [styles.completeText]: config[key] })}>{key}</p>
        </div>
      ))}
    </Flex>
  )
}
