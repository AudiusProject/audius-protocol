import { useCallback, useEffect } from 'react';
import { IntKeys, StringKeys } from '@audius/common/services';
import { challengesSelectors, audioRewardsPageSelectors, audioRewardsPageActions, ClaimStatus } from '@audius/common/store';
import { isAudioMatchingChallenge, getClaimableChallengeSpecifiers } from '@audius/common/utils';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@audius/harmony-native';
import { useNavigation } from 'app/hooks/useNavigation';
import { useRemoteVar } from 'app/hooks/useRemoteConfig';
import { useToast } from 'app/hooks/useToast';
import { getChallengeConfig } from 'app/utils/challenges';
import { AppDrawer, useDrawerState } from '../drawer/AppDrawer';
import { AudioMatchingChallengeDrawerContent } from './AudioMatchingChallengeDrawerContent';
import { ChallengeRewardsDrawerContent } from './ChallengeRewardsDrawerContent';
import { ProfileCompletionChecks } from './ProfileCompletionChecks';
import { ReferralRewardContents } from './ReferralRewardContents';
var getChallengeRewardsModalType = audioRewardsPageSelectors.getChallengeRewardsModalType, getClaimStatus = audioRewardsPageSelectors.getClaimStatus, getAAOErrorCode = audioRewardsPageSelectors.getAAOErrorCode, getUndisbursedUserChallenges = audioRewardsPageSelectors.getUndisbursedUserChallenges;
var claimChallengeReward = audioRewardsPageActions.claimChallengeReward, resetAndCancelClaimReward = audioRewardsPageActions.resetAndCancelClaimReward;
var getOptimisticUserChallenges = challengesSelectors.getOptimisticUserChallenges;
var messages = {
    // Claim success toast
    claimSuccessMessage: 'Reward successfully claimed!'
};
var MODAL_NAME = 'ChallengeRewardsExplainer';
export var ChallengeRewardsDrawerProvider = function () {
    var _a, _b;
    var dispatch = useDispatch();
    var onClose = useDrawerState(MODAL_NAME).onClose;
    var modalType = useSelector(getChallengeRewardsModalType);
    var userChallenges = useSelector(function (state) {
        return getOptimisticUserChallenges(state, true);
    });
    var undisbursedUserChallenges = useSelector(getUndisbursedUserChallenges);
    var handleClose = useCallback(function () {
        dispatch(resetAndCancelClaimReward());
        onClose();
    }, [dispatch, onClose]);
    var claimStatus = useSelector(getClaimStatus);
    var aaoErrorCode = useSelector(getAAOErrorCode);
    var toast = useToast().toast;
    var challenge = userChallenges ? userChallenges[modalType] : null;
    var config = getChallengeConfig(modalType);
    var hasChallengeCompleted = (challenge === null || challenge === void 0 ? void 0 : challenge.state) === 'completed' || (challenge === null || challenge === void 0 ? void 0 : challenge.state) === 'disbursed';
    // We could just depend on undisbursedAmount here
    // But DN may have not indexed the challenge so check for client-side completion too
    // Note that we can't handle aggregate challenges optimistically
    var audioToClaim = 0;
    var audioClaimedSoFar = 0;
    if ((challenge === null || challenge === void 0 ? void 0 : challenge.challenge_type) === 'aggregate') {
        audioToClaim = challenge.claimableAmount;
        audioClaimedSoFar = challenge.disbursed_amount;
    }
    else if ((challenge === null || challenge === void 0 ? void 0 : challenge.state) === 'completed' && (challenge === null || challenge === void 0 ? void 0 : challenge.cooldown_days)) {
        audioToClaim = challenge.claimableAmount;
    }
    else if ((challenge === null || challenge === void 0 ? void 0 : challenge.state) === 'completed' && !(challenge === null || challenge === void 0 ? void 0 : challenge.cooldown_days)) {
        audioToClaim = challenge.totalAmount;
    }
    else if ((challenge === null || challenge === void 0 ? void 0 : challenge.state) === 'disbursed') {
        audioClaimedSoFar = challenge.totalAmount;
    }
    var navigate = useNavigation().navigate;
    var handleNavigation = useCallback(function () {
        var _a;
        if ((_a = config.buttonInfo) === null || _a === void 0 ? void 0 : _a.navigation) {
            var _b = config.buttonInfo.navigation, screen_1 = _b.screen, params = _b.params;
            // @ts-expect-error not smart enough
            navigate(screen_1, params);
            handleClose();
        }
    }, [navigate, config, handleClose]);
    var openUploadModal = useCallback(function () {
        handleClose();
        navigate('Upload');
    }, [handleClose, navigate]);
    // Claim rewards button config
    var quorumSize = useRemoteVar(IntKeys.ATTESTATION_QUORUM_SIZE);
    var oracleEthAddress = useRemoteVar(StringKeys.ORACLE_ETH_ADDRESS);
    var AAOEndpoint = useRemoteVar(StringKeys.ORACLE_ENDPOINT);
    var hasConfig = (oracleEthAddress && AAOEndpoint && quorumSize > 0) || true;
    var onClaim = useCallback(function () {
        var _a;
        if (challenge) {
            dispatch(claimChallengeReward({
                claim: {
                    challengeId: modalType,
                    specifiers: challenge.challenge_type === 'aggregate'
                        ? getClaimableChallengeSpecifiers(challenge.undisbursedSpecifiers, undisbursedUserChallenges)
                        : [
                            { specifier: challenge.specifier, amount: challenge.amount }
                        ],
                    amount: (_a = challenge === null || challenge === void 0 ? void 0 : challenge.claimableAmount) !== null && _a !== void 0 ? _a : 0
                },
                retryOnFailure: true
            }));
        }
    }, [dispatch, modalType, challenge, undisbursedUserChallenges]);
    useEffect(function () {
        if (claimStatus === ClaimStatus.SUCCESS) {
            toast({ content: messages.claimSuccessMessage, type: 'info' });
        }
    }, [toast, claimStatus]);
    // Challenge drawer contents
    var contents;
    if (!audioToClaim) {
        switch (modalType) {
            case 'referrals':
            case 'ref-v':
                contents = (<ReferralRewardContents isVerified={!!config.isVerifiedChallenge}/>);
                break;
            case 'track-upload':
                contents = (config === null || config === void 0 ? void 0 : config.buttonInfo) && (<Button iconRight={config.buttonInfo.iconRight} iconLeft={config.buttonInfo.iconLeft} variant={(challenge === null || challenge === void 0 ? void 0 : challenge.state) === 'disbursed' ? 'secondary' : 'primary'} onPress={openUploadModal} fullWidth>
            {config.completedLabel}
          </Button>);
                break;
            case 'profile-completion':
                contents = (<ProfileCompletionChecks isComplete={hasChallengeCompleted} onClose={handleClose}/>);
                break;
            default:
                contents = (config === null || config === void 0 ? void 0 : config.buttonInfo) ? (<Button iconRight={config.buttonInfo.iconRight} iconLeft={config.buttonInfo.iconLeft} variant={hasChallengeCompleted ? 'secondary' : 'primary'} onPress={handleNavigation} fullWidth>
            {(challenge === null || challenge === void 0 ? void 0 : challenge.state) === 'disbursed'
                        ? config.completedLabel
                        : config.panelButtonText}
          </Button>) : undefined;
        }
    }
    // Bail if not on challenges page/challenges aren't loaded
    if (!config || !challenge) {
        return null;
    }
    return (<AppDrawer modalName='ChallengeRewardsExplainer' onClose={handleClose} isFullscreen isGestureSupported={false} title={config.title} titleImage={config.icon}>
      {isAudioMatchingChallenge(modalType) ? (<AudioMatchingChallengeDrawerContent aaoErrorCode={aaoErrorCode} challengeName={modalType} challenge={challenge} claimableAmount={audioToClaim} claimedAmount={audioClaimedSoFar} claimStatus={claimStatus} onNavigate={handleNavigation} onClaim={hasConfig ? onClaim : undefined}/>) : (<ChallengeRewardsDrawerContent description={config.description(challenge)} progressLabel={(_a = config.progressLabel) !== null && _a !== void 0 ? _a : 'Completed'} completedLabel={config.completedLabel} amount={challenge.totalAmount} challengeId={challenge.challenge_id} isCooldownChallenge={challenge && challenge.cooldown_days > 0} challengeState={challenge.state} currentStep={challenge.current_step_count} stepCount={(_b = challenge.max_steps) !== null && _b !== void 0 ? _b : undefined} claimableAmount={audioToClaim} claimedAmount={audioClaimedSoFar} claimStatus={claimStatus} aaoErrorCode={aaoErrorCode} onClaim={hasConfig ? onClaim : undefined} isVerifiedChallenge={!!config.isVerifiedChallenge} showProgressBar={challenge.challenge_type !== 'aggregate' &&
                challenge.max_steps !== null &&
                challenge.max_steps > 1}>
          {contents}
        </ChallengeRewardsDrawerContent>)}
    </AppDrawer>);
};
