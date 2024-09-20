import { notificationsSelectors } from '@audius/common/store';
import { View, Text } from 'react-native';
import { useSelector } from 'react-redux';
import { makeStyles } from 'app/styles';
import { BottomTabBarButton } from './BottomTabBarButton';
var getNotificationUnviewedCount = notificationsSelectors.getNotificationUnviewedCount;
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing, palette = _a.palette, typography = _a.typography;
    return ({
        notifBubble: {
            position: 'absolute',
            flex: 1,
            right: spacing(5),
            top: spacing(1),
            borderRadius: 99,
            minHeight: spacing(5),
            minWidth: spacing(5),
            backgroundColor: palette.secondary,
            paddingHorizontal: 3,
            borderWidth: 2,
            borderColor: palette.white
        },
        notifBubbleText: {
            fontFamily: typography.fontByWeight.bold,
            fontSize: typography.fontSize.xs,
            textAlign: 'center',
            color: palette.staticWhite
        }
    });
});
export var NotificationsButton = function (props) {
    var styles = useStyles();
    var notificationCount = useSelector(getNotificationUnviewedCount);
    return (<BottomTabBarButton name='notifications' {...props}>
      {notificationCount > 0 ? (<View style={styles.notifBubble}>
          <Text style={styles.notifBubbleText}>
            {notificationCount >= 100 ? '99+' : notificationCount}
          </Text>
        </View>) : null}
    </BottomTabBarButton>);
};
