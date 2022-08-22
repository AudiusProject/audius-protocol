import React from 'react'

import { accountSelectors } from '@audius/common'

import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { ReferralLinkCopyButton } from './ReferralLinkCopyButton'
import { TwitterShareButton } from './TwitterShareButton'

export const ReferralRewardContents = ({
  isVerified
}: {
  isVerified: boolean
}) => {
  const handle = useSelectorWeb(accountSelectors.getUserHandle)
  const inviteUrl = `audius.co/signup?ref=${handle}`

  return (
    <>
      <TwitterShareButton inviteUrl={inviteUrl} isVerified={isVerified} />
      <ReferralLinkCopyButton inviteUrl={inviteUrl} />
    </>
  )
}
