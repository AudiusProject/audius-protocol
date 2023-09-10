import { useCallback } from 'react'

import {
  useLockedContent,
  premiumContentActions,
  usePremiumContentAccess
} from '@audius/common'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import IconLock from 'app/assets/images/iconLock.svg'
import { Text } from 'app/components/core'
import { DetailsTilePremiumAccess } from 'app/components/details-tile/DetailsTilePremiumAccess'
import { NativeDrawer } from 'app/components/drawer'
import { TrackDetailsTile } from 'app/components/track-details-tile/TrackDetailsTile'
import { makeStyles, flexRowCentered } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useColor } from 'app/utils/theme'

const LOCKED_CONTENT_MODAL_NAME = 'LockedContent'

const { resetLockedContentId } = premiumContentActions

const messages = {
  howToUnlock: 'HOW TO UNLOCK'
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  drawer: {
    paddingVertical: spacing(6),
    alignItems: 'center',
    backgroundColor: palette.white,
    paddingHorizontal: spacing(4),
    gap: spacing(6)
  },
  titleContainer: {
    ...flexRowCentered(),
    justifyContent: 'center',
    paddingBottom: spacing(4),
    gap: spacing(2),
    borderBottomColor: palette.neutralLight8,
    borderBottomWidth: 1,
    width: '100%'
  },
  premiumTrackSection: {
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent'
  }
}))

export const LockedContentDrawer = () => {
  const styles = useStyles()
  const neutralLight2 = useColor('neutralLight2')
  const dispatch = useDispatch()
  const { id, track, owner } = useLockedContent()
  const { doesUserHaveAccess } = usePremiumContentAccess(track)

  const handleClose = useCallback(() => {
    dispatch(resetLockedContentId())
  }, [dispatch])

  if (!id || !track || !track.premium_conditions || !owner) {
    return null
  }

  return (
    <NativeDrawer drawerName={LOCKED_CONTENT_MODAL_NAME} onClose={handleClose}>
      <View style={styles.drawer}>
        <View style={styles.titleContainer}>
          <IconLock
            fill={neutralLight2}
            width={spacing(6)}
            height={spacing(6)}
          />
          <Text weight='heavy' color='neutralLight2' fontSize='xl'>
            {messages.howToUnlock}
          </Text>
        </View>
        <TrackDetailsTile trackId={track.track_id} />
        <DetailsTilePremiumAccess
          style={styles.premiumTrackSection}
          trackId={track.track_id}
          premiumConditions={track.premium_conditions}
          isOwner={false}
          doesUserHaveAccess={doesUserHaveAccess}
        />
      </View>
    </NativeDrawer>
  )
}
