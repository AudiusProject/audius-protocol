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
import { useCallback } from 'react';
import { cacheUsersSelectors, chatActions, chatSelectors } from '@audius/common/store';
import { View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { IconMessageBlock, IconInfo, Button } from '@audius/harmony-native';
import { Text } from 'app/components/core';
import { NativeDrawer } from 'app/components/drawer';
import { useDrawer } from 'app/hooks/useDrawer';
import { track, make } from 'app/services/analytics';
import { setVisibility } from 'app/store/drawers/slice';
import { makeStyles, flexRowCentered } from 'app/styles';
import { spacing } from 'app/styles/spacing';
import { EventNames } from 'app/types/analytics';
import { useColor } from 'app/utils/theme';
var getUser = cacheUsersSelectors.getUser;
var getDoesBlockUser = chatSelectors.getDoesBlockUser, getCanCreateChat = chatSelectors.getCanCreateChat;
var blockUser = chatActions.blockUser, unblockUser = chatActions.unblockUser, createChat = chatActions.createChat;
var BLOCK_MESSAGES_MODAL_NAME = 'BlockMessages';
var messages = {
    title: 'Are you sure?',
    confirmBlock: function (userName, isReportAbuse) { return (<>
      {'Are you sure you want to '}
      {isReportAbuse ? 'report ' : 'block '}
      {userName}
      {isReportAbuse
            ? ' for abuse? They will be blocked from sending you new messages.'
            : ' from sending messages to your inbox?'}
    </>); },
    confirmUnblock: function (userName) { return (<>
      {'Are you sure you want to unblock '}
      {userName}
      {' and allow them to send messages to your inbox?'}
    </>); },
    info: 'This will not affect their ability to view your profile or interact with your content.',
    blockUser: 'Block User',
    unblockUser: 'Unblock User',
    reportUser: 'Report & Block',
    cancel: 'Cancel'
};
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing, typography = _a.typography, palette = _a.palette;
    return ({
        drawer: {
            marginVertical: spacing(6.5),
            padding: spacing(3.5),
            gap: spacing(4)
        },
        titleContainer: __assign(__assign({}, flexRowCentered()), { gap: spacing(3.5), marginBottom: spacing(2), alignSelf: 'center' }),
        title: {
            fontSize: typography.fontSize.xl,
            fontFamily: typography.fontByWeight.heavy,
            color: palette.neutralLight2,
            textTransform: 'uppercase',
            lineHeight: typography.fontSize.xl * 1.25
        },
        confirm: {
            fontSize: typography.fontSize.large,
            lineHeight: typography.fontSize.large * 1.5,
            color: palette.neutral
        },
        infoContainer: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing(4.5),
            paddingVertical: spacing(2),
            paddingHorizontal: spacing(4),
            backgroundColor: palette.neutralLight9,
            borderWidth: 1,
            borderColor: palette.neutralLight7,
            borderRadius: spacing(2)
        },
        infoText: {
            fontSize: typography.fontSize.medium,
            lineHeight: typography.fontSize.medium * 1.375,
            marginRight: spacing(12)
        },
        infoIcon: {
            width: spacing(5),
            height: spacing(5),
            color: palette.neutral
        }
    });
});
export var BlockMessagesDrawer = function () {
    var styles = useStyles();
    var neutralLight2 = useColor('neutralLight2');
    var neutral = useColor('neutral');
    var dispatch = useDispatch();
    var data = useDrawer('BlockMessages').data;
    var userId = data.userId, shouldOpenChat = data.shouldOpenChat, isReportAbuse = data.isReportAbuse;
    var user = useSelector(function (state) { return getUser(state, { id: userId }); });
    // Assuming blockees have already been fetched in ProfileActionsDrawer.
    var doesBlockUser = useSelector(function (state) { return getDoesBlockUser(state, userId); });
    var canCreateChat = useSelector(function (state) {
        return getCanCreateChat(state, { userId: userId });
    }).canCreateChat;
    var handleConfirmPress = useCallback(function () {
        if (doesBlockUser) {
            dispatch(unblockUser({ userId: userId }));
            if (shouldOpenChat && canCreateChat) {
                dispatch(createChat({ userIds: [userId] }));
            }
        }
        else {
            dispatch(blockUser({ userId: userId }));
            if (isReportAbuse) {
                track(make({
                    eventName: EventNames.CHAT_REPORT_USER,
                    reportedUserId: userId
                }));
            }
        }
        dispatch(setVisibility({
            drawer: 'BlockMessages',
            visible: false
        }));
    }, [
        canCreateChat,
        dispatch,
        doesBlockUser,
        isReportAbuse,
        shouldOpenChat,
        userId
    ]);
    var handleCancelPress = useCallback(function () {
        dispatch(setVisibility({
            drawer: 'BlockMessages',
            visible: false
        }));
    }, [dispatch]);
    return (<NativeDrawer drawerName={BLOCK_MESSAGES_MODAL_NAME}>
      <View style={styles.drawer}>
        <View style={styles.titleContainer}>
          <IconMessageBlock fill={neutralLight2}/>
          <Text style={styles.title}>{messages.title}</Text>
        </View>
        <Text style={styles.confirm}>
          {doesBlockUser
            ? messages.confirmUnblock(user === null || user === void 0 ? void 0 : user.name)
            : messages.confirmBlock(user === null || user === void 0 ? void 0 : user.name, isReportAbuse)}
        </Text>
        {doesBlockUser ? null : (<View style={styles.infoContainer}>
            <IconInfo style={styles.infoIcon} fill={neutral} height={spacing(5)} width={spacing(5)}/>
            <Text style={styles.infoText}>{messages.info}</Text>
          </View>)}
        <Button onPress={handleConfirmPress} variant={doesBlockUser ? 'primary' : 'destructive'} fullWidth>
          {isReportAbuse
            ? messages.reportUser
            : doesBlockUser
                ? messages.unblockUser
                : messages.blockUser}
        </Button>
        <Button onPress={handleCancelPress} variant={doesBlockUser ? 'secondary' : 'primary'} fullWidth>
          {messages.cancel}
        </Button>
      </View>
    </NativeDrawer>);
};
