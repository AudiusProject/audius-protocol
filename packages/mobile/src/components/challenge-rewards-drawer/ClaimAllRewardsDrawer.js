import { useCallback, useEffect, useState } from 'react';
import { formatCooldownChallenges, useChallengeCooldownSchedule } from '@audius/common/hooks';
import { ClaimStatus, audioRewardsPageActions, audioRewardsPageSelectors } from '@audius/common/store';
import { ScrollView, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Flex, Text, Button, IconArrowRight } from '@audius/harmony-native';
import { useToast } from 'app/hooks/useToast';
import { makeStyles } from 'app/styles';
import { formatLabel } from 'app/utils/challenges';
import { AppDrawer, useDrawerState } from '../drawer/AppDrawer';
import LoadingSpinner from '../loading-spinner';
import { ProgressBar } from '../progress-bar';
import { SummaryTable } from '../summary-table';
var claimAllChallengeRewards = audioRewardsPageActions.claimAllChallengeRewards, resetAndCancelClaimReward = audioRewardsPageActions.resetAndCancelClaimReward;
var getClaimStatus = audioRewardsPageSelectors.getClaimStatus;
var messages = {
    // Claim success toast
    claimSuccessMessage: 'All rewards successfully claimed!',
    pending: function (amount) { return "".concat(amount, " Pending"); },
    claimAudio: function (amount) { return "Claim ".concat(amount, " $AUDIO"); },
    claiming: 'Claiming $AUDIO',
    done: 'Done'
};
var MODAL_NAME = 'ClaimAllRewards';
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing, palette = _a.palette, typography = _a.typography;
    return ({
        button: {
            width: '100%'
        },
        stickyClaimRewardsContainer: {
            borderTopWidth: 1,
            borderTopColor: palette.borderDefault,
            paddingBottom: spacing(10),
            paddingHorizontal: spacing(4),
            paddingTop: spacing(4),
            width: '100%'
        },
        progressBar: {
            height: spacing(1),
            marginVertical: 0,
            paddingVertical: 0
        },
        spinner: {
            width: spacing(4),
            height: spacing(4)
        }
    });
});
var config = {
    id: 'rewards',
    title: 'Rewards',
    description: 'You can check and claim all your upcoming rewards here.'
};
export var ClaimAllRewardsDrawer = function () {
    var styles = useStyles();
    var dispatch = useDispatch();
    var toast = useToast().toast;
    var claimStatus = useSelector(getClaimStatus);
    var onClose = useDrawerState(MODAL_NAME).onClose;
    var _a = useChallengeCooldownSchedule({
        multiple: true
    }), claimableAmount = _a.claimableAmount, claimableChallenges = _a.claimableChallenges, cooldownChallenges = _a.cooldownChallenges, summary = _a.summary;
    var claimInProgress = claimStatus === ClaimStatus.CUMULATIVE_CLAIMING;
    var hasClaimed = claimStatus === ClaimStatus.CUMULATIVE_SUCCESS;
    var _b = useState(claimableAmount), totalClaimableAmount = _b[0], setTotalClaimableAmount = _b[1];
    var _c = useState(claimableChallenges.length), totalClaimableCount = _c[0], setTotalClaimableCount = _c[1];
    useEffect(function () {
        setTotalClaimableAmount(function (totalClaimableAmount) {
            return Math.max(totalClaimableAmount, claimableAmount);
        });
        setTotalClaimableCount(function (totalClaimableCount) {
            return Math.max(totalClaimableCount, claimableChallenges.length);
        });
    }, [
        claimableAmount,
        claimableChallenges.length,
        setTotalClaimableAmount,
        setTotalClaimableCount
    ]);
    useEffect(function () {
        if (hasClaimed) {
            toast({ content: messages.claimSuccessMessage, type: 'info' });
        }
    }, [hasClaimed, toast]);
    var handleClose = useCallback(function () {
        dispatch(resetAndCancelClaimReward());
        onClose();
    }, [dispatch, onClose]);
    var onClaim = useCallback(function () {
        var claims = claimableChallenges.map(function (challenge) { return ({
            challengeId: challenge.challenge_id,
            specifiers: [
                { specifier: challenge.specifier, amount: challenge.amount }
            ],
            amount: challenge.amount
        }); });
        dispatch(claimAllChallengeRewards({ claims: claims }));
    }, [dispatch, claimableChallenges]);
    return (<AppDrawer modalName={MODAL_NAME} onClose={handleClose} isFullscreen isGestureSupported={false} title={config.title}>
      <ScrollView>
        <Flex pv='xl' ph='l' gap='xl'>
          <Text variant='body' size='m'>
            {config.description}
          </Text>
          <SummaryTable title={'Rewards'} secondaryTitle={'AUDIO'} summaryLabelColor='accent' summaryValueColor='default' items={formatCooldownChallenges(cooldownChallenges).map(formatLabel)} summaryItem={summary}/>
          {claimInProgress && totalClaimableCount > 1 ? (<Flex backgroundColor='surface1' gap='l' borderRadius='s' border='strong' p='l'>
              <Flex direction='row' justifyContent='space-between'>
                <Text variant='label' size='s' color='default'>
                  {messages.claiming}
                </Text>
                <Flex direction='row' gap='l'>
                  <Text variant='label' size='s' color='default'>
                    {"".concat(totalClaimableAmount - claimableAmount, "/").concat(totalClaimableAmount)}
                  </Text>
                  <LoadingSpinner style={styles.spinner}/>
                </Flex>
              </Flex>
              <ProgressBar style={{
                root: styles.progressBar
            }} max={totalClaimableAmount} progress={totalClaimableAmount - claimableAmount}/>
            </Flex>) : null}
        </Flex>
      </ScrollView>
      <View style={styles.stickyClaimRewardsContainer}>
        {claimableAmount > 0 && !hasClaimed ? (<Button disabled={claimInProgress} isLoading={claimInProgress} variant='primary' onPress={onClaim} iconRight={IconArrowRight} fullWidth>
            {messages.claimAudio(claimableAmount)}
          </Button>) : (<Button variant='primary' onPress={handleClose} fullWidth>
            {messages.done}
          </Button>)}
      </View>
    </AppDrawer>);
};
