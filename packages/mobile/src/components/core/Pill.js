import { View } from 'react-native';
import { makeStyles } from 'app/styles';
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing, palette = _a.palette;
    return ({
        optionPill: {
            paddingHorizontal: spacing(2),
            paddingVertical: spacing(1),
            backgroundColor: palette.neutralLight8,
            borderWidth: 1,
            borderColor: palette.neutralLight7,
            opacity: 0.8,
            borderRadius: 2,
            flexDirection: 'row',
            alignItems: 'center'
        }
    });
});
export var Pill = function (props) {
    var children = props.children, style = props.style;
    var styles = useStyles();
    return <View style={[styles.optionPill, style]}>{children}</View>;
};
