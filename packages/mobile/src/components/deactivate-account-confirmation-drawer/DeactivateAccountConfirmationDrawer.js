import { useCallback, useEffect } from 'react';
import { Status } from '@audius/common/models';
import { deactivateAccountActions, deactivateAccountSelectors } from '@audius/common/store';
import { View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@audius/harmony-native';
import { Text } from 'app/components/core';
import { makeStyles } from 'app/styles';
import { AppDrawer, useDrawerState } from '../drawer';
var deactivateAccount = deactivateAccountActions.deactivateAccount;
var getDeactivateAccountStatus = deactivateAccountSelectors.getDeactivateAccountStatus;
var MODAL_NAME = 'DeactivateAccountConfirmation';
var messages = {
    confirmTitle: 'Delete Account',
    areYouSureText: 'Are you sure you want to delete your account?',
    doubleCheckText: 'There is no going back. This will remove all of your tracks, albums, and playlists. You will not be able to re-register with the same email or handle',
    confirmText: 'Delete',
    cancelText: 'Take me back to safety'
};
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing;
    return ({
        contentContainer: {
            paddingHorizontal: spacing(6),
            paddingBottom: spacing(4)
        },
        text: {
            textAlign: 'center',
            marginBottom: spacing(2)
        }
    });
});
export var DeactivateAccountConfirmationDrawer = function () {
    var dispatch = useDispatch();
    var styles = useStyles();
    var status = useSelector(getDeactivateAccountStatus);
    var onClose = useDrawerState(MODAL_NAME).onClose;
    useEffect(function () {
        if (status === Status.SUCCESS) {
            onClose();
        }
    }, [status, onClose]);
    var handleConfirmation = useCallback(function () {
        dispatch(deactivateAccount());
    }, [dispatch]);
    return (<AppDrawer modalName={MODAL_NAME} title={messages.confirmTitle}>
      <View style={styles.contentContainer}>
        <Text variant='body' style={styles.text}>
          {messages.areYouSureText}
        </Text>
        <Text variant='body' style={styles.text}>
          {messages.doubleCheckText}
        </Text>
        <Button fullWidth onPress={onClose} disabled={status !== Status.IDLE}>
          {messages.cancelText}
        </Button>
        <Button fullWidth variant='destructive' onPress={handleConfirmation} isLoading={status === Status.LOADING} disabled={status !== Status.IDLE}>
          {messages.confirmText}
        </Button>
      </View>
    </AppDrawer>);
};
