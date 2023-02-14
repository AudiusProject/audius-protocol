import type { PremiumConditions } from '@audius/common'

import IconCollectibleCornerTag from 'app/assets/images/iconCollectibleCornerTag.svg'
import IconLockedCornerTag from 'app/assets/images/iconLockedCornerTag.svg'
import IconSpecialAccessCornerTag from 'app/assets/images/iconSpecialAccessCornerTag.svg'
import { makeStyles } from 'app/styles'
import { zIndex } from 'app/utils/zIndex'

const useStyles = makeStyles(() => ({
  icon: {
    position: 'absolute',
    zIndex: zIndex.PREMIUM_TRACK_TILE_CORNER_TAG
  }
}))

type PremiumTrackCornerTagProps = {
  doesUserHaveAccess: boolean
  isOwner: boolean
  premiumConditions: PremiumConditions
}

export const PremiumTrackCornerTag = ({
  doesUserHaveAccess,
  isOwner,
  premiumConditions
}: PremiumTrackCornerTagProps) => {
  const styles = useStyles()

  if (isOwner) {
    if (premiumConditions.nft_collection) {
      return <IconCollectibleCornerTag style={styles.icon} />
    }
    return <IconSpecialAccessCornerTag style={styles.icon} />
  }

  if (doesUserHaveAccess) {
    return null
  }

  return <IconLockedCornerTag style={styles.icon} />
}
