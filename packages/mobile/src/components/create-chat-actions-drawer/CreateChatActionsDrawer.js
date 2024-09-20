import { useCallback } from 'react';
import { chatSelectors } from '@audius/common/store';
import { View, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Text } from 'app/components/core';
import { NativeDrawer } from 'app/components/drawer';
import { useDrawer } from 'app/hooks/useDrawer';
import { useNavigation } from 'app/hooks/useNavigation';
import { setVisibility } from 'app/store/drawers/slice';
import { makeStyles } from 'app/styles';
var getDoesBlockUser = chatSelectors.getDoesBlockUser;
var CREATE_CHAT_ACTIONS_MODAL_NAME = 'CreateChatActions';
var messages = {
    visitProfile: 'Visit Profile',
    blockMessages: 'Block Messages',
    unblockMessages: 'Unblock Messages',
    deleteConversation: 'Delete Conversation'
};
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing, typography = _a.typography, palette = _a.palette;
    return ({
        drawer: {
            marginVertical: spacing(7)
        },
        text: {
            fontSize: 21,
            lineHeight: spacing(6.5),
            letterSpacing: 0.233333,
            fontFamily: typography.fontByWeight.demiBold,
            color: palette.secondary,
            paddingVertical: spacing(3)
        },
        deleteText: {
            color: palette.accentRed
        },
        row: {
            alignItems: 'center',
            width: '100%',
            borderBottomWidth: 1,
            borderBottomColor: palette.neutralLight9
        }
    });
});
export var CreateChatActionsDrawer = function () {
    var styles = useStyles();
    var dispatch = useDispatch();
    var navigation = useNavigation();
    var data = useDrawer('CreateChatActions').data;
    var userId = data.userId;
    var doesBlockUser = useSelector(function (state) {
        return getDoesBlockUser(state, userId);
    });
    var closeDrawer = useCallback(function () {
        dispatch(setVisibility({
            drawer: 'CreateChatActions',
            visible: false
        }));
    }, [dispatch]);
    var handleVisitProfilePress = useCallback(function () {
        closeDrawer();
        navigation.navigate('Profile', { id: userId });
    }, [closeDrawer, navigation, userId]);
    var handleBlockMessagesPress = useCallback(function () {
        closeDrawer();
        dispatch(setVisibility({
            drawer: 'BlockMessages',
            visible: true,
            data: { userId: userId }
        }));
    }, [closeDrawer, dispatch, userId]);
    return (<NativeDrawer drawerName={CREATE_CHAT_ACTIONS_MODAL_NAME}>
      <View style={styles.drawer}>
        <View style={styles.row}>
          <TouchableOpacity onPress={handleVisitProfilePress}>
            <Text style={styles.text}>{messages.visitProfile}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TouchableOpacity onPress={handleBlockMessagesPress}>
            <Text style={styles.text}>
              {doesBlockUser
            ? messages.unblockMessages
            : messages.blockMessages}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </NativeDrawer>);
};
