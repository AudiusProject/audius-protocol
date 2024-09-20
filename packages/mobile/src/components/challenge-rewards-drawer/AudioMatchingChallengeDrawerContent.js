var _a, _b, _c;
import React from 'react';
import { ChallengeName } from '@audius/common/models';
import { ClaimStatus } from '@audius/common/store';
import { formatNumberCommas } from '@audius/common/utils';
import { ScrollView, View } from 'react-native';
import { IconArrowRight, IconCloudUpload, Button } from '@audius/harmony-native';
import { Text } from 'app/components/core';
import { getChallengeConfig } from 'app/utils/challenges';
import { ChallengeDescription } from './ChallengeDescription';
import { ChallengeReward } from './ChallengeReward';
import { ClaimError } from './ClaimError';
import { CooldownSummaryTable } from './CooldownSummaryTable';
import { useStyles } from './styles';
var messages = {
    taskDetails: 'Task Details',
    rewardMapping: (_a = {},
        _a[ChallengeName.AudioMatchingBuy] = '$AUDIO Every Dollar Spent',
        _a[ChallengeName.AudioMatchingSell] = '$AUDIO Every Dollar Earned',
        _a),
    descriptionSubtext: (_b = {},
        _b[ChallengeName.AudioMatchingBuy] = 'Note: There is a 7 day waiting period between when you purchase and when you can claim your reward.',
        _b[ChallengeName.AudioMatchingSell] = 'Note: There is a 7 day waiting period between when your track is purchased and when you can claim your reward.',
        _b),
    viewPremiumTracks: 'View Premium Tracks',
    uploadTrack: 'Upload Track',
    totalClaimed: function (amount) { return "Total $AUDIO Claimed: ".concat(amount); },
    claimAudio: function (amount) { return "Claim ".concat(amount, " $AUDIO"); }
};
var ctaButtonProps = (_c = {},
    _c[ChallengeName.AudioMatchingBuy] = {
        iconRight: IconArrowRight,
        children: messages.viewPremiumTracks
    },
    _c[ChallengeName.AudioMatchingSell] = {
        iconLeft: IconCloudUpload,
        children: messages.uploadTrack
    },
    _c);
/** Specialized drawer content override for audio matching challenges, which need
 * more complicated logic and the abiltity to render a cooldown table.
 */
export var AudioMatchingChallengeDrawerContent = function (_a) {
    var aaoErrorCode = _a.aaoErrorCode, challenge = _a.challenge, challengeName = _a.challengeName, claimableAmount = _a.claimableAmount, claimedAmount = _a.claimedAmount, claimStatus = _a.claimStatus, onClaim = _a.onClaim, onNavigate = _a.onNavigate;
    var styles = useStyles();
    var config = getChallengeConfig(challengeName);
    var claimInProgress = claimStatus === ClaimStatus.CLAIMING ||
        claimStatus === ClaimStatus.WAITING_FOR_RETRY;
    var claimError = claimStatus === ClaimStatus.ERROR;
    return (<View style={styles.scrollViewContainer}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <ChallengeDescription task={<Text variant='label' fontSize='medium' weight='heavy' textTransform='uppercase'>
              {messages.taskDetails}
            </Text>} renderDescription={function () { return (<View style={styles.audioMatchingDescriptionContainer}>
              <Text variant='body'>{config.description(challenge)}</Text>
              <Text variant='body' color='neutralLight4'>
                {messages.descriptionSubtext[challengeName]}
              </Text>
            </View>); }}/>
        <View style={styles.statusGrid}>
          <View style={styles.statusGridColumns}>
            <ChallengeReward amount={challenge.amount} subtext={messages.rewardMapping[challengeName]}/>
          </View>
          {claimedAmount > 0 ? (<View style={styles.claimedAmountContainer}>
              <Text variant='label' fontSize='small' weight='heavy' textTransform='uppercase'>
                {messages.totalClaimed(formatNumberCommas(claimedAmount))}
              </Text>
            </View>) : null}
        </View>
        <CooldownSummaryTable challengeId={challengeName}/>
      </ScrollView>
      <View style={styles.stickyClaimRewardsContainer}>
        {claimableAmount > 0 && onClaim ? (<Button disabled={claimInProgress} variant='primary' onPress={onClaim} isLoading={claimInProgress} iconRight={IconArrowRight} fullWidth>
            {messages.claimAudio(formatNumberCommas(claimableAmount))}
          </Button>) : (<Button {...ctaButtonProps[challengeName]} variant='secondary' onPress={onNavigate} fullWidth/>)}
        {claimError ? <ClaimError aaoErrorCode={aaoErrorCode}/> : null}
      </View>
    </View>);
};
