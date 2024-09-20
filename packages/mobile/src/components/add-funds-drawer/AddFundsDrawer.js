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
import { useCallback, useState } from 'react';
import { DEFAULT_PURCHASE_AMOUNT_CENTS } from '@audius/common/hooks';
import { PurchaseMethod, PurchaseVendor } from '@audius/common/models';
import { buyUSDCActions, useUSDCManualTransferModal, useAddFundsModal } from '@audius/common/store';
import { View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@audius/harmony-native';
import { Text } from 'app/components/core';
import Drawer from 'app/components/drawer';
import { getPurchaseVendor } from 'app/store/purchase-vendor/selectors';
import { reset as resetPurchaseMethod } from 'app/store/purchase-vendor/slice';
import { flexRowCentered, makeStyles } from 'app/styles';
import { PaymentMethod } from '../payment-method/PaymentMethod';
import { USDCBalanceRow } from '../usdc-balance-row/USDCBalanceRow';
var messages = {
    title: 'Add Funds',
    continue: 'Continue'
};
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing, palette = _a.palette;
    return ({
        drawer: {
            paddingVertical: spacing(6),
            paddingHorizontal: spacing(4),
            gap: spacing(6)
        },
        titleContainer: __assign(__assign({}, flexRowCentered()), { justifyContent: 'center', paddingBottom: spacing(4), borderBottomWidth: 1, borderBottomColor: palette.neutralLight8 })
    });
});
export var AddFundsDrawer = function () {
    var styles = useStyles();
    var dispatch = useDispatch();
    var purchaseVendorState = useSelector(getPurchaseVendor);
    var _a = useAddFundsModal(), isOpen = _a.isOpen, onClose = _a.onClose, onClosed = _a.onClosed;
    var openUSDCManualTransferModal = useUSDCManualTransferModal().onOpen;
    var _b = useState(PurchaseMethod.CARD), selectedPurchaseMethod = _b[0], setSelectedPurchaseMethod = _b[1];
    var openCardFlow = useCallback(function () {
        dispatch(buyUSDCActions.onrampOpened({
            vendor: purchaseVendorState !== null && purchaseVendorState !== void 0 ? purchaseVendorState : PurchaseVendor.STRIPE,
            purchaseInfo: {
                desiredAmount: DEFAULT_PURCHASE_AMOUNT_CENTS
            }
        }));
    }, [dispatch, purchaseVendorState]);
    var onContinuePress = useCallback(function () {
        if (selectedPurchaseMethod === PurchaseMethod.CARD) {
            openCardFlow();
        }
        else if (selectedPurchaseMethod === PurchaseMethod.CRYPTO) {
            openUSDCManualTransferModal();
        }
    }, [selectedPurchaseMethod, openCardFlow, openUSDCManualTransferModal]);
    var handleClose = useCallback(function () {
        dispatch(resetPurchaseMethod());
        onClose();
    }, [dispatch, onClose]);
    return (<Drawer isOpen={isOpen} onClose={handleClose} onClosed={onClosed}>
      <View style={styles.drawer}>
        <View style={styles.titleContainer}>
          <Text variant='label' weight='heavy' color='neutralLight2' fontSize='xl' textTransform='uppercase'>
            {messages.title}
          </Text>
        </View>
        <USDCBalanceRow />
        <PaymentMethod selectedMethod={selectedPurchaseMethod} setSelectedMethod={setSelectedPurchaseMethod} showVendorChoice/>
        <Button onPress={onContinuePress} fullWidth>
          {messages.continue}
        </Button>
      </View>
    </Drawer>);
};
