import type { ID } from '@audius/common'
import { premiumContentSelectors } from '@audius/common'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import IconLock from 'app/assets/images/iconLock.svg'
import { Text } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { flexRowCentered, makeStyles } from 'app/styles'
import { useColor } from 'app/utils/theme'

const { getPremiumTrackStatusMap } = premiumContentSelectors

const messages = {
  unlocking: 'UNLOCKING',
  locked: 'LOCKED'
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  root: {
    ...flexRowCentered(),
    marginTop: spacing(1),
    paddingVertical: spacing(0.5),
    paddingHorizontal: spacing(2),
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.neutralLight4,
    borderRadius: spacing(0.5)
  },
  text: {
    marginLeft: spacing(2.5),
    fontFamily: typography.fontByWeight.bold,
    fontSize: typography.fontSize.medium,
    color: palette.neutralLight4
  }
}))

export const LineupTileAccessStatus = ({ trackId }: { trackId: ID }) => {
  const styles = useStyles()
  const premiumTrackStatusMap = useSelector(getPremiumTrackStatusMap)
  const premiumTrackStatus = premiumTrackStatusMap[trackId]
  const neutralLight4 = useColor('neutralLight4')

  return (
    <View style={styles.root}>
      {premiumTrackStatus === 'UNLOCKING' ? (
        <LoadingSpinner />
      ) : (
        <IconLock fill={neutralLight4} width={16} height={16} />
      )}
      <Text style={styles.text}>
        {premiumTrackStatus === 'UNLOCKING'
          ? messages.unlocking
          : messages.locked}
      </Text>
    </View>
  )
}
