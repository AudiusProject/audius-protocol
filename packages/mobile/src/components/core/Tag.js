import { Pressable } from 'react-native';
import { makeStyles } from 'app/styles';
import { Text } from './Text';
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing, palette = _a.palette;
    return ({
        root: {
            borderRadius: 2,
            backgroundColor: palette.neutralLight4,
            paddingVertical: spacing(1),
            paddingHorizontal: spacing(2),
            color: palette.white,
            textTransform: 'uppercase',
            overflow: 'hidden'
        }
    });
});
export var Tag = function (props) {
    var onPress = props.onPress, children = props.children, style = props.style, stylesProp = props.styles;
    var styles = useStyles();
    return (<Pressable onPress={onPress} style={[style, stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.root]}>
      <Text style={[styles.root, stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.text]} variant='label'>
        {children}
      </Text>
    </Pressable>);
};
