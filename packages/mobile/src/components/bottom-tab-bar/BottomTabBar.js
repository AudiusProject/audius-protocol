import { useCallback } from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FULL_DRAWER_HEIGHT } from 'app/components/drawer';
import { PLAY_BAR_HEIGHT } from 'app/components/now-playing-drawer';
import * as haptics from 'app/haptics';
import { makeStyles } from 'app/styles';
import { bottomTabBarButtons } from './bottom-tab-bar-buttons';
import { BOTTOM_BAR_HEIGHT } from './constants';
var useStyles = makeStyles(function (_a) {
    var palette = _a.palette;
    return ({
        root: {
            zIndex: 4,
            elevation: 4
        },
        bottomBar: {
            borderTopWidth: 1,
            borderTopColor: palette.neutralLight8,
            backgroundColor: palette.neutralLight10,
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            alignItems: 'center',
            justifyContent: 'space-evenly'
        }
    });
});
var interpolatePostion = function (translationAnim, bottomInset) { return ({
    transform: [
        {
            translateY: translationAnim.interpolate({
                inputRange: [
                    0,
                    FULL_DRAWER_HEIGHT -
                        bottomInset -
                        BOTTOM_BAR_HEIGHT -
                        PLAY_BAR_HEIGHT,
                    FULL_DRAWER_HEIGHT
                ],
                outputRange: [bottomInset + BOTTOM_BAR_HEIGHT, 0, 0]
            })
        }
    ]
}); };
export var BottomTabBar = function (props) {
    var styles = useStyles();
    var translationAnim = props.translationAnim, navigation = props.navigation, state = props.state;
    var routes = state.routes, activeIndex = state.index;
    var insets = useSafeAreaInsets();
    var handlePress = useCallback(function (isFocused, routeName, routeKey) {
        if (isFocused) {
            haptics.light();
        }
        else {
            haptics.medium();
        }
        var event = navigation.emit({
            type: 'tabPress',
            target: routeKey,
            canPreventDefault: true
        });
        // Native navigation
        if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(routeName);
        }
        else if (isFocused) {
            navigation.emit({
                type: 'scrollToTop'
            });
        }
    }, [navigation]);
    var handleLongPress = useCallback(function () {
        haptics.medium();
        navigation.emit({
            type: 'scrollToTop'
        });
    }, [navigation]);
    return (<Animated.View style={[styles.root, interpolatePostion(translationAnim, insets.bottom)]}>
      <View pointerEvents='auto' style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
        {routes.map(function (_a, index) {
            var name = _a.name, key = _a.key;
            var BottomTabBarButton = bottomTabBarButtons[name];
            return (<BottomTabBarButton key={key} routeKey={key} isActive={index === activeIndex} onPress={handlePress} onLongPress={handleLongPress}/>);
        })}
      </View>
    </Animated.View>);
};
