import { Artwork, ArtworkProps } from '../artwork'

export type AvatarProps = ArtworkProps & {
  variant?: 'default' | 'strong'
  size?: 'auto' | 'small' | 'medium' | 'large' | 'xl'
  borderWidth?: 'thin' | 'default'
}

const sizeMap = {
  auto: '100%',
  small: 24,
  medium: 40,
  large: 72,
  xl: 80
}

const borderWidthMap = {
  thin: 1.2,
  default: 2
}

export const Avatar2 = (props: AvatarProps) => {
  const {
    variant,
    size = 'auto',
    borderWidth: borderWidth = 'default',
    ...other
  } = props

  return (
    <Artwork
      borderRadius='circle'
      h={sizeMap[size]}
      w={sizeMap[size]}
      shadow={variant === 'strong' ? 'emphasis' : 'flat'}
      {...other}
      css={{ borderWidth: borderWidthMap[borderWidth] }}
    />
  )
}
