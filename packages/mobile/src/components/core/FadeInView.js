import Animated, { Easing, FadeIn } from 'react-native-reanimated';
export var FadeInView = function (props) {
    var children = props.children, style = props.style, _a = props.startOpacity, startOpacity = _a === void 0 ? 0.3 : _a, _b = props.duration, duration = _b === void 0 ? 1000 : _b;
    var fadeInConfig = FadeIn.easing(Easing.ease)
        .withInitialValues({
        opacity: startOpacity
    })
        .duration(duration);
    return (<Animated.View entering={fadeInConfig} style={style}>
      {children}
    </Animated.View>);
};
