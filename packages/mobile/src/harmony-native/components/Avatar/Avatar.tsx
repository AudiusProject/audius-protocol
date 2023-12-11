import type { AvatarProps as HarmonyAvatarProps } from '@audius/harmony'
import styled from '@emotion/native'
import type { ImageSourcePropType } from 'react-native/types'

export type AvatarProps = Omit<HarmonyAvatarProps, 'src'> & {
  src?: ImageSourcePropType
}

const sizeMap = {
  auto: '100%',
  small: 24,
  large: 40
}

const strokeWidthMap = {
  thin: 1.2,
  default: 2
}

const Root = styled.View<AvatarProps>(
  ({ theme, size, strokeWidth, variant }) => ({
    height: sizeMap[size ?? 'auto'],
    width: sizeMap[size ?? 'auto'],
    overflow: 'hidden',
    backgroundColor: theme.color.neutral.n400,
    borderRadius: 9999,
    borderWidth: strokeWidthMap[strokeWidth ?? 'default'],
    borderStyle: 'solid',
    borderColor: theme.color.border.default,
    ...(variant === 'strong' && theme.shadows.mid)
  })
)

const AvatarImg = styled.Image<Omit<AvatarProps, 'src'>>(({ size }) => ({
  height: sizeMap[size ?? 'auto'],
  width: sizeMap[size ?? 'auto'],
  alignItems: 'center',
  justifyContent: 'center'
}))

/*
 * The Avatar component is a visual indicator used to quickly identify a
 * user’s account.
 */
export const Avatar = (props: AvatarProps) => {
  const { className, children } = props

  return (
    <Root className={className} {...props}>
      <AvatarImg source={props.src ?? { uri: '' }} size={props.size}>
        {children}
      </AvatarImg>
    </Root>
  )
}
