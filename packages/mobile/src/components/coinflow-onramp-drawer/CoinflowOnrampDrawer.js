import { useCallback, useEffect, useState } from 'react';
import { useCoinflowAdapter } from '@audius/common/hooks';
import { coinflowModalUIActions, useCoinflowOnrampModal } from '@audius/common/store';
import { CoinflowPurchase } from '@coinflowlabs/react-native';
import { VersionedTransaction } from '@solana/web3.js';
import { TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { IconCloseAlt } from '@audius/harmony-native';
import { AppDrawer } from 'app/components/drawer';
import { env } from 'app/env';
import { getCoinflowDeviceId } from 'app/services/coinflow';
import { makeStyles } from 'app/styles';
import { spacing } from 'app/styles/spacing';
import { useThemeColors } from 'app/utils/theme';
import { zIndex } from 'app/utils/zIndex';
var MODAL_NAME = 'CoinflowOnramp';
var ENVIRONMENT = env.ENVIRONMENT;
var IS_PRODUCTION = ENVIRONMENT === 'production';
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing, palette = _a.palette;
    return ({
        headerContainer: {
            borderBottomWidth: 1,
            borderBottomColor: palette.neutralLight8,
            height: spacing(12),
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingHorizontal: spacing(4)
        },
        contentContainer: {
            paddingTop: spacing(6),
            flex: 1
        },
        exitContainer: {
            justifyContent: 'flex-start',
            paddingHorizontal: spacing(4),
            paddingVertical: spacing(2)
        }
    });
});
var transactionCanceled = coinflowModalUIActions.transactionCanceled, transactionSucceeded = coinflowModalUIActions.transactionSucceeded;
var CoinflowOnrampDrawerHeader = function (_a) {
    var onClose = _a.onClose;
    var styles = useStyles();
    var neutralLight4 = useThemeColors().neutralLight4;
    return (<View style={styles.headerContainer}>
      <TouchableOpacity activeOpacity={0.7} onPress={onClose}>
        <IconCloseAlt width={spacing(6)} height={spacing(6)} fill={neutralLight4}/>
      </TouchableOpacity>
    </View>);
};
export var CoinflowOnrampDrawer = function () {
    var _a = useCoinflowOnrampModal(), _b = _a.data, amount = _b.amount, serializedTransaction = _b.serializedTransaction, purchaseMetadata = _b.purchaseMetadata, isOpen = _a.isOpen, onClose = _a.onClose;
    var dispatch = useDispatch();
    var _c = useState(undefined), transaction = _c[0], setTransaction = _c[1];
    useEffect(function () {
        if (serializedTransaction) {
            try {
                var tx = VersionedTransaction.deserialize(Buffer.from(serializedTransaction, 'base64'));
                setTransaction(tx);
            }
            catch (e) {
                console.error(e);
            }
        }
    }, [serializedTransaction]);
    var handleSuccess = useCallback(function () {
        dispatch(transactionSucceeded({}));
        onClose();
    }, [dispatch, onClose]);
    var handleClose = useCallback(function () {
        dispatch(transactionCanceled({}));
        onClose();
    }, [dispatch, onClose]);
    var adapter = useCoinflowAdapter({
        onSuccess: handleSuccess,
        onFailure: handleClose
    });
    var deviceId = getCoinflowDeviceId();
    var showContent = isOpen && adapter;
    return (<AppDrawer blockClose={false} drawerHeader={CoinflowOnrampDrawerHeader} zIndex={zIndex.COINFLOW_ONRAMP_DRAWER} modalName={MODAL_NAME} isGestureSupported={false} isFullscreen onClose={handleClose}>
      {showContent ? (<CoinflowPurchase deviceId={deviceId} transaction={transaction} wallet={adapter.wallet} chargebackProtectionData={purchaseMetadata ? [purchaseMetadata] : []} connection={adapter.connection} onSuccess={handleSuccess} merchantId={env.COINFLOW_MERCHANT_ID || ''} env={IS_PRODUCTION ? 'prod' : 'sandbox'} disableGooglePay={false} disableApplePay={false} blockchain='solana' amount={amount}/>) : null}
    </AppDrawer>);
};
