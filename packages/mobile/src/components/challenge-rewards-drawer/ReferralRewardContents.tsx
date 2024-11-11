import React from 'react'

import { accountSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { Flex } from '@audius/harmony-native'

import { ReferralLinkCopyButton } from './ReferralLinkCopyButton'
import { TwitterShareButton } from './TwitterShareButton'

export const ReferralRewardContents = ({
  isVerified
}: {
  isVerified: boolean
}) => {
  const handle = useSelector(accountSelectors.getUserHandle)
  const inviteUrl = `audius.co/signup?rf=${handle}`

  return (
    <Flex gap='m'>
      <TwitterShareButton inviteUrl={inviteUrl} isVerified={isVerified} />
      <ReferralLinkCopyButton inviteUrl={inviteUrl} />
    </Flex>
  )
}
