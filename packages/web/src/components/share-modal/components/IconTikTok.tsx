import { SVGProps } from 'react'

import { IconTikTok as BaseIconTikTok } from '@audius/harmony'

import { isDarkMode, isMatrix } from 'utils/theme/theme'

export const IconTikTok = (props: SVGProps<SVGSVGElement>) => {
  return isDarkMode() || isMatrix() ? (
    <BaseIconTikTok color='staticWhite' {...props} />
  ) : (
    <BaseIconTikTok {...props} />
  )
}
