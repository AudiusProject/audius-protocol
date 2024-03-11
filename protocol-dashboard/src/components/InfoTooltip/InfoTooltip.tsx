import { IconColors, IconInfo } from '@audius/harmony'
import Tooltip from 'components/Tooltip'

type InfoTooltipProps = {
  title?: string
  body?: string
  ctaText?: string
  ctaHref?: string
  size?: 'default' | 'large'
  color?: IconColors
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
      <IconInfo size={size === 'large' ? 'm' : 's'} color={color} />
    </Tooltip>
  )
}
