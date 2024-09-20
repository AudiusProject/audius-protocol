import React from 'react';
import { formatCooldownChallenges, useChallengeCooldownSchedule, useFeatureFlag } from '@audius/common/hooks';
import { FeatureFlags } from '@audius/common/services';
import { ClaimStatus } from '@audius/common/store';
import { fillString, formatNumberCommas } from '@audius/common/utils';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Text, Button, IconArrowRight, IconCheck, IconVerified } from '@audius/harmony-native';
import { ProgressBar } from 'app/components/progress-bar';
import { formatLabel } from 'app/utils/challenges';
import { useThemePalette } from 'app/utils/theme';
import { SummaryTable } from '../summary-table';
import { ChallengeDescription } from './ChallengeDescription';
import { ChallengeReward } from './ChallengeReward';
import { ClaimError } from './ClaimError';
import { useStyles } from './styles';
var messages = {
    taskVerified: 'Verified Challenge',
    progress: 'Progress',
    audio: '$AUDIO',
    incomplete: 'Incomplete',
    complete: 'Complete',
    claim: 'Claim This Reward',
    claimableLabel: '$AUDIO available to claim',
    claimableAmountLabel: function (amount) { return "Claim ".concat(amount, " $AUDIO"); },
    claimedLabel: '$AUDIO claimed so far',
    upcomingRewards: 'Upcoming Rewards'
};
/** Generic drawer content used for most challenges, responsible for rendering the
 * task, reward, progress, and actions.
 */
export var ChallengeRewardsDrawerContent = function (_a) {
    var description = _a.description, amount = _a.amount, currentStep = _a.currentStep, _b = _a.stepCount, stepCount = _b === void 0 ? 1 : _b, progressLabel = _a.progressLabel, completedLabel = _a.completedLabel, challengeId = _a.challengeId, isCooldownChallenge = _a.isCooldownChallenge, challengeState = _a.challengeState, claimableAmount = _a.claimableAmount, claimedAmount = _a.claimedAmount, claimStatus = _a.claimStatus, aaoErrorCode = _a.aaoErrorCode, onClaim = _a.onClaim, isVerifiedChallenge = _a.isVerifiedChallenge, showProgressBar = _a.showProgressBar, children = _a.children;
    var styles = useStyles();
    var palette = useThemePalette();
    var isInProgress = challengeState === 'in_progress';
    var isClaimable = claimableAmount > 0;
    var _c = useChallengeCooldownSchedule({ challengeId: challengeId }), cooldownChallenges = _c.cooldownChallenges, summary = _c.summary, isCooldownChallengesEmpty = _c.isEmpty;
    var isRewardsCooldownEnabled = useFeatureFlag(FeatureFlags.REWARDS_COOLDOWN).isEnabled;
    var claimInProgress = claimStatus === ClaimStatus.CLAIMING ||
        claimStatus === ClaimStatus.WAITING_FOR_RETRY;
    var claimError = claimStatus === ClaimStatus.ERROR;
    var hasCompleted = challengeState === 'completed' || challengeState === 'disbursed';
    var statusText = hasCompleted
        ? messages.complete
        : isInProgress
            ? fillString(progressLabel, formatNumberCommas(currentStep), formatNumberCommas(stepCount))
            : messages.incomplete;
    var renderCooldownSummaryTable = function () {
        if (isCooldownChallenge && !isCooldownChallengesEmpty) {
            return (<SummaryTable title={messages.upcomingRewards} items={formatCooldownChallenges(cooldownChallenges).map(formatLabel)} summaryItem={summary} secondaryTitle={messages.audio} summaryLabelColor='accent' summaryValueColor='default'/>);
        }
        return null;
    };
    return (<>
      <ScrollView style={styles.content}>
        {isVerifiedChallenge ? (<ChallengeDescription task={messages.taskVerified} taskIcon={<IconVerified style={styles.subheaderIcon} fill={palette.staticPrimary} fillSecondary={palette.staticWhite}/>} description={description}/>) : (<ChallengeDescription description={description}/>)}
        <View style={styles.statusGrid}>
          <View style={styles.statusGridColumns}>
            <ChallengeReward amount={amount} subtext={messages.audio}/>
            {showProgressBar ? (<View style={styles.progressCell}>
                <Text color='subdued' style={[styles.subheader, styles.progressSubheader]} strength='strong' textTransform='uppercase' variant='label' size='l'>
                  {messages.progress}
                </Text>
                <ProgressBar progress={currentStep} max={stepCount}/>
              </View>) : null}
          </View>
          <View style={[
            styles.statusCell,
            hasCompleted ? styles.statusCellComplete : null
        ]}>
            <Text style={[styles.subheader]} strength='strong' textTransform='uppercase' variant='label' color={hasCompleted
            ? 'staticWhite'
            : isInProgress
                ? 'accent'
                : 'default'}>
              {statusText}
            </Text>
          </View>
        </View>
        <View style={styles.claimRewardsContainer}>
          {isClaimable && onClaim ? (isCooldownChallenge && isRewardsCooldownEnabled ? (renderCooldownSummaryTable()) : (<>
                <Button style={styles.claimButton} variant={claimInProgress ? 'secondary' : 'primary'} isLoading={claimInProgress} onPress={onClaim} iconLeft={IconCheck}>
                  {messages.claim}
                </Button>
              </>)) : null}
          {claimError ? <ClaimError aaoErrorCode={aaoErrorCode}/> : null}
        </View>
        {children}
      </ScrollView>
      {isClaimable &&
            onClaim &&
            isCooldownChallenge &&
            isRewardsCooldownEnabled ? (<View style={styles.stickyClaimRewardsContainer}>
          <Button key='claimButton' style={styles.claimButton} variant={claimInProgress ? 'secondary' : 'primary'} isLoading={claimInProgress} onPress={onClaim} iconRight={IconArrowRight}>
            {messages.claimableAmountLabel(claimableAmount)}
          </Button>
        </View>) : null}
    </>);
};
