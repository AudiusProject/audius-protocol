var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { useSelectTierInfo, useTotalBalanceWithFallback } from '@audius/common/hooks';
import { accountSelectors } from '@audius/common/store';
import { isNullOrUndefined, formatWei } from '@audius/common/utils';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { IconAudioBadge } from 'app/components/audio-rewards';
import { Text } from 'app/components/core';
import Skeleton from 'app/components/skeleton';
import { flexRowCentered, makeStyles } from 'app/styles';
import { spacing } from 'app/styles/spacing';
var getAccountUser = accountSelectors.getAccountUser;
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing, palette = _a.palette;
    return ({
        root: __assign(__assign({}, flexRowCentered()), { padding: spacing(0.5), marginLeft: spacing(4), borderWidth: 1, borderColor: palette.neutralLight8, backgroundColor: palette.neutralLight10, borderRadius: spacing(25), gap: spacing(2) }),
        amount: {
            paddingRight: spacing(1.5),
            paddingVertical: spacing(0.5)
        }
    });
});
export var AudioBalancePill = function () {
    var styles = useStyles();
    var accountUser = useSelector(getAccountUser);
    var user_id = accountUser.user_id;
    var tier = useSelectTierInfo(user_id).tier;
    var audioBalance = useTotalBalanceWithFallback();
    var isAudioBalanceLoading = isNullOrUndefined(audioBalance);
    return (<View style={styles.root}>
      <IconAudioBadge tier={tier} showNoTier height={spacing(5.5)} width={spacing(5.5)}/>
      {isAudioBalanceLoading ? (<Skeleton style={styles.amount} height={spacing(4.5)} width={spacing(6)}/>) : (<Text style={styles.amount} fontSize='small' weight='bold'>
          {formatWei(audioBalance, true, 0)}
        </Text>)}
    </View>);
};
