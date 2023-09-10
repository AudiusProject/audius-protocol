import { SVGProps } from 'react'

import { IconTikTok as BaseIconTikTok, IconTikTokInverted } from '@audius/stems'

import { isDarkMode, isMatrix } from 'utils/theme/theme'

export const IconTikTok = (props: SVGProps<SVGSVGElement>) => {
  return isDarkMode() || isMatrix() ? (
    <IconTikTokInverted {...props} />
  ) : (
    <BaseIconTikTok {...props} />
  )
}
