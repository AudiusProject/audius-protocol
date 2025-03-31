import { SquareSizes, UserMetadata } from '@audius/common/models'
import { Flex, Text } from '@audius/harmony'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import UserBadges from 'components/user-badges/UserBadges'
import { useProfilePicture } from 'hooks/useProfilePicture'

import styles from './ArtistInfo.module.css'

export const ArtistInfo = ({ user }: { user: UserMetadata }) => {
  const profilePicture = useProfilePicture({
    userId: user.user_id,
    size: SquareSizes.SIZE_150_BY_150
  })
  return (
    <Flex gap='m' alignItems='center' justifyContent='flex-start'>
      <DynamicImage
        wrapperClassName={styles.profilePictureWrapper}
        skeletonClassName={styles.profilePictureSkeleton}
        className={styles.profilePicture}
        image={profilePicture}
      />
      <Flex direction='column' gap='xs'>
        <Flex gap='xs' alignItems='center' justifyContent='flex-start'>
          <Text variant='body' size='m' strength='strong'>
            {user.name}
          </Text>
          <UserBadges userId={user.user_id} size='m' inline />
        </Flex>
        <Text variant='body' size='m'>{`@${user.handle}`}</Text>
      </Flex>
    </Flex>
  )
}
