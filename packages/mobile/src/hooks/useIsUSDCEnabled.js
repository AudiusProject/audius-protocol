import { useFeatureFlag } from '@audius/common/hooks';
import { FeatureFlags } from '@audius/common/services';
export var useIsUSDCEnabled = function () {
    return useFeatureFlag(FeatureFlags.USDC_PURCHASES).isEnabled;
};
