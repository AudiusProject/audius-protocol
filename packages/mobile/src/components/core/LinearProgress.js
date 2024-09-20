import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { makeStyles } from 'app/styles';
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing, palette = _a.palette;
    return ({
        root: {
            height: spacing(2),
            flexGrow: 1,
            borderRadius: 4,
            backgroundColor: palette.progressBackground,
            overflow: 'hidden'
        },
        progressBar: {
            height: spacing(2),
            borderRadius: 4,
            backgroundColor: palette.secondary
        }
    });
});
export var LinearProgress = function (props) {
    var value = props.value, stylesProp = props.styles;
    var styles = useStyles();
    var _a = useState(0), barWidth = _a[0], setBarWidth = _a[1];
    var progress = useRef(new Animated.Value(value));
    var progressBarStyles = {
        transform: [
            {
                translateX: progress.current.interpolate({
                    inputRange: [0, 100],
                    outputRange: [-barWidth, 0]
                })
            }
        ]
    };
    var handleGetBarWidth = useCallback(function (event) {
        var width = event.nativeEvent.layout.width;
        setBarWidth(width);
    }, []);
    useEffect(function () {
        Animated.timing(progress.current, {
            toValue: value,
            duration: 400,
            useNativeDriver: true
        }).start();
    }, [value]);
    return (<View style={[styles.root, stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.root]} onLayout={handleGetBarWidth}>
      <Animated.View style={[styles.progressBar, progressBarStyles, stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.progress]}/>
    </View>);
};
