import { css } from '@emotion/native'

import { useTheme } from '@audius/harmony-native'
import { ImageField } from 'app/components/fields'

const messages = {
  label: 'Profile Picture'
}

export const ProfilePictureField = () => {
  const { color, spacing } = useTheme()

  const rootStyle = css({
    marginHorizontal: 0,
    position: 'absolute',
    left: spacing.unit4,
    top: spacing.unit10,
    height: spacing.unit20,
    width: spacing.unit20,
    borderRadius: spacing.unit10,
    borderWidth: 2,
    // TODO: need a white border?
    borderColor: color.special.white,
    backgroundColor: color.neutral.n300,
    overflow: 'hidden',
    zIndex: 1
  })

  return (
    <ImageField name='profileImage' label={messages.label} style={rootStyle} />
  )
}
