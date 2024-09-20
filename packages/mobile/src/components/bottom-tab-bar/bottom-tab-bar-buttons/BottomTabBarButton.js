import { useEffect, useRef, useCallback } from 'react';
import { Theme } from '@audius/common/models';
import { Pressable, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { usePrevious } from 'react-use';
import Rive from 'rive-react-native';
import { makeStyles } from 'app/styles';
import { useThemeColors, useThemeVariant } from 'app/utils/theme';
import { BOTTOM_BAR_BUTTON_HEIGHT } from '../constants';
var useStyles = makeStyles(function () { return ({
    root: {
        width: '20%'
    },
    button: {
        alignItems: 'center'
    },
    iconWrapper: {
        width: 28,
        height: BOTTOM_BAR_BUTTON_HEIGHT
    },
    underlay: {
        width: '100%',
        height: BOTTOM_BAR_BUTTON_HEIGHT,
        position: 'absolute'
    }
}); });
var BottomTabBarRiveButton = function (props) {
    var name = props.name, routeKey = props.routeKey, isActive = props.isActive, onPress = props.onPress, onLongPress = props.onLongPress, children = props.children, themeVariant = props.themeVariant;
    var styles = useStyles();
    var _a = useThemeColors(), neutralLight8 = _a.neutralLight8, neutralLight10 = _a.neutralLight10;
    var riveRef = useRef(null);
    var riveThemeVariant = themeVariant === Theme.DEBUG ? Theme.DEFAULT : themeVariant;
    var riveResourceName = "".concat(name, "_").concat(riveThemeVariant);
    var previousActive = usePrevious(isActive);
    var initialIsActive = Boolean((isActive && previousActive === undefined) || (previousActive && isActive));
    var handlePress = useCallback(function () {
        var _a;
        if (!isActive) {
            (_a = riveRef.current) === null || _a === void 0 ? void 0 : _a.play();
        }
        onPress(isActive, name, routeKey);
    }, [onPress, routeKey, isActive, name]);
    useEffect(function () {
        var _a;
        if (previousActive && !isActive) {
            (_a = riveRef.current) === null || _a === void 0 ? void 0 : _a.reset();
        }
    }, [isActive, previousActive]);
    var handleLongPress = isActive ? onLongPress : handlePress;
    return (<View style={styles.root}>
      <Pressable onPress={handlePress} onLongPress={handleLongPress} pointerEvents='box-only' style={styles.button}>
        {function (_a) {
            var pressed = _a.pressed;
            return (<>
              {pressed ? (<LinearGradient style={styles.underlay} colors={[neutralLight8, neutralLight10]}/>) : null}
              <Rive ref={riveRef} style={styles.iconWrapper} resourceName={riveResourceName} autoplay={initialIsActive}/>
              {children}
            </>);
        }}
      </Pressable>
    </View>);
};
/**
 * To ensure proper initialization and rive-ref management, we need to wrap the
 * rive buttons with a theme-aware container that swaps out rive button
 * instances when the theme chancges.
 */
export var BottomTabBarButton = function (props) {
    var themeVariant = useThemeVariant();
    return (<BottomTabBarRiveButton key={themeVariant} themeVariant={themeVariant} {...props}/>);
};
