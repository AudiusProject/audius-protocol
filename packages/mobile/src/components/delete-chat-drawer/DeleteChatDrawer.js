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
import { chatActions } from '@audius/common/store';
import { View } from 'react-native';
import { useDispatch } from 'react-redux';
import { IconTrash, Button } from '@audius/harmony-native';
import { Text } from 'app/components/core';
import { NativeDrawer } from 'app/components/drawer';
import { useDrawer } from 'app/hooks/useDrawer';
import { setVisibility } from 'app/store/drawers/slice';
import { makeStyles, flexRowCentered } from 'app/styles';
import { useColor } from 'app/utils/theme';
var deleteChat = chatActions.deleteChat;
var DELETE_CHAT_MODAL_NAME = 'DeleteChat';
var messages = {
    title: 'Delete Conversation',
    description: 'Are you sure you want to delete this conversation? \n\nOther people in the conversation will still be able to see it.  This can’t be undone.',
    deleteMessages: 'Are you sure you want to delete this chat?',
    deleteButton: 'Delete Conversation',
    cancel: 'Cancel'
};
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing, typography = _a.typography, palette = _a.palette;
    return ({
        drawer: {
            marginVertical: spacing(3),
            padding: spacing(3.5),
            gap: spacing(4)
        },
        titleContainer: __assign(__assign({}, flexRowCentered()), { gap: spacing(3.5), marginBottom: spacing(2), alignSelf: 'center' }),
        title: {
            fontSize: typography.fontSize.xl,
            fontFamily: typography.fontByWeight.heavy,
            color: palette.neutralLight2,
            textTransform: 'uppercase',
            lineHeight: typography.fontSize.xl * 1.3
        },
        confirm: {
            fontSize: typography.fontSize.large,
            lineHeight: typography.fontSize.large * 1.3,
            color: palette.neutral
        }
    });
});
export var DeleteChatDrawer = function () {
    var styles = useStyles();
    var neutralLight2 = useColor('neutralLight2');
    var dispatch = useDispatch();
    var data = useDrawer('DeleteChat').data;
    var chatId = data.chatId;
    var closeDrawer = useCallback(function () {
        dispatch(setVisibility({
            drawer: 'DeleteChat',
            visible: false
        }));
    }, [dispatch]);
    var handleConfirmPress = useCallback(function () {
        if (chatId) {
            dispatch(deleteChat({ chatId: chatId }));
        }
        closeDrawer();
    }, [chatId, closeDrawer, dispatch]);
    return (<NativeDrawer drawerName={DELETE_CHAT_MODAL_NAME}>
      <View style={styles.drawer}>
        <View style={styles.titleContainer}>
          <IconTrash fill={neutralLight2}/>
          <Text style={styles.title}>{messages.title}</Text>
        </View>
        <Text style={styles.confirm} allowNewline>
          {messages.description}
        </Text>
        <Button onPress={handleConfirmPress} variant={'destructive'} fullWidth>
          {messages.deleteButton}
        </Button>
        <Button onPress={closeDrawer} variant={'secondary'} fullWidth>
          {messages.cancel}
        </Button>
      </View>
    </NativeDrawer>);
};
