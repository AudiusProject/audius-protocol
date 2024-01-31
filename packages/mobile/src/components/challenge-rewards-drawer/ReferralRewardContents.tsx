import React from 'react'

import { accountSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { ReferralLinkCopyButton } from './ReferralLinkCopyButton'
import { TwitterShareButton } from './TwitterShareButton'

export const ReferralRewardContents = ({
  isVerified
}: {
  isVerified: boolean
}) => {
  const handle = useSelector(accountSelectors.getUserHandle)
  const inviteUrl = `audius.co/signup?ref=${handle}`

  return (
    <>
      <TwitterShareButton inviteUrl={inviteUrl} isVerified={isVerified} />
      <ReferralLinkCopyButton inviteUrl={inviteUrl} />
    </>
  )
}
