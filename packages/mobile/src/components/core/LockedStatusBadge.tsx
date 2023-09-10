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
    paddingVertical: 1,
    borderRadius: spacing(10),
    justifyContent: 'center'
  },
  premium: {
    backgroundColor: palette.specialLightGreen
  },
  locked: {
    backgroundColor: palette.neutralLight4
  }
}))

export type LockedStatusBadgeProps = {
  locked: boolean
  variant?: 'purchase' | 'gated'
}

/** Renders a small badge with locked or unlocked icon */
export const LockedStatusBadge = ({
  locked,
  variant = 'gated'
}: LockedStatusBadgeProps) => {
  const styles = useStyles()
  const staticWhite = useColor('staticWhite')
  const LockComponent = locked ? IconLock : IconLockUnlocked
  return (
    <View
      style={[
        styles.root,
        locked ? styles.locked : variant === 'purchase' ? styles.premium : null
      ]}
    >
      <LockComponent
        fill={staticWhite}
        width={spacing(3.5)}
        height={spacing(3.5)}
      />
    </View>
  )
}
