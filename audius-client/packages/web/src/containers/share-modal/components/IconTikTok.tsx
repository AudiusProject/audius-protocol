import React, { SVGProps } from 'react'

import { IconTikTok as BaseIconTikTok, IconTikTokInverted } from '@audius/stems'

import { isDarkMode } from 'utils/theme/theme'

export const IconTikTok = (props: SVGProps<SVGSVGElement>) => {
  return isDarkMode() ? (
    <IconTikTokInverted {...props} />
  ) : (
    <BaseIconTikTok {...props} />
  )
}
