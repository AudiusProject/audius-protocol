import React from 'react'

import { getUserHandle } from 'audius-client/src/common/store/account/selectors'

import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { ReferralLinkCopyButton } from './ReferralLinkCopyButton'
import { TwitterShareButton } from './TwitterShareButton'

export const ReferralRewardContents = ({
  isVerified
}: {
  isVerified: boolean
}) => {
  const handle = useSelectorWeb(getUserHandle)
  const inviteUrl = `audius.co/signup?ref=${handle}`

  return (
    <>
      <TwitterShareButton inviteUrl={inviteUrl} isVerified={isVerified} />
      <ReferralLinkCopyButton inviteUrl={inviteUrl} />
    </>
  )
}
