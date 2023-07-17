import { View } from 'react-native'

import IconLock from 'app/assets/images/iconLock.svg'
import IconLockUnlocked from 'app/assets/images/iconLockUnlocked.svg'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useColor } from 'app/utils/theme'

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  root: {
    backgroundColor: palette.accentBlue,
    paddingHorizontal: spacing(2),
    borderRadius: spacing(10)
  },
  premium: {
    backgroundColor: palette.specialLightGreen1
  }
}))

export type LockedStatusBadgeProps = {
  locked: boolean
  variant: 'purchase' | 'gated'
}

/** Renders a small badge with locked or unlocked icon */
export const LockedStatusBadge = ({
  locked,
  variant
}: LockedStatusBadgeProps) => {
  const styles = useStyles()
  const staticWhite = useColor('staticWhite')
  const LockComponent = locked ? IconLock : IconLockUnlocked
  return (
    <View style={[styles.root, variant === 'purchase' ? styles.premium : null]}>
      <LockComponent
        fill={staticWhite}
        width={spacing(4)}
        height={spacing(4)}
      />
    </View>
  )
}
