import { IconColors, IconInfo, IconProps } from '@audius/harmony'

import Tooltip from 'components/Tooltip'

type InfoTooltipProps = {
  title?: string
  body?: string
  ctaText?: string
  ctaHref?: string
  size?: 'default' | 'large'
  color?: IconColors
}

type TooltipIconProps = IconProps & {
  isActive?: boolean
}
const TooltipIcon = ({ isActive, size, color }: TooltipIconProps) => {
  return (
    <IconInfo
      size={size}
      color={color}
      css={{
        opacity: isActive ? 1 : 0.7
      }}
    />
  )
}

export const InfoTooltip = ({
  title,
  body,
  ctaText,
  ctaHref,
  size,
  color = 'default'
}: InfoTooltipProps) => {
  return (
    <Tooltip title={title} body={body} ctaText={ctaText} ctaHref={ctaHref}>
      <TooltipIcon size={size === 'large' ? 'm' : 's'} color={color} />
    </Tooltip>
  )
}
