import { useMemo } from 'react';
import { View } from 'react-native';
import { makeStyles, shadow } from 'app/styles';
var useStyles = makeStyles(function () { return ({
    root: shadow()
}); });
export var Shadow = function (props) {
    var offset = props.offset, color = props.color, radius = props.radius, opacity = props.opacity, children = props.children, style = props.style;
    var styles = useStyles();
    var styleConfig = useMemo(function () { return [
        styles.root,
        style,
        offset ? { shadowOffset: offset } : null,
        color ? { shadowColor: color } : null,
        radius ? { shadowRadius: radius } : null,
        opacity ? { shadowOpacity: opacity } : null
    ]; }, [styles.root, style, offset, color, radius, opacity]);
    return <View style={styleConfig}>{children}</View>;
};
