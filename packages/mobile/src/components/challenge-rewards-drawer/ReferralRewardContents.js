import React from 'react';
import { accountSelectors } from '@audius/common/store';
import { useSelector } from 'react-redux';
import { Flex } from '@audius/harmony-native';
import { ReferralLinkCopyButton } from './ReferralLinkCopyButton';
import { TwitterShareButton } from './TwitterShareButton';
export var ReferralRewardContents = function (_a) {
    var isVerified = _a.isVerified;
    var handle = useSelector(accountSelectors.getUserHandle);
    var inviteUrl = "audius.co/signup?ref=".concat(handle);
    return (<Flex gap='m'>
      <TwitterShareButton inviteUrl={inviteUrl} isVerified={isVerified}/>
      <ReferralLinkCopyButton inviteUrl={inviteUrl}/>
    </Flex>);
};
