import { View } from 'react-native';
import { makeStyles } from 'app/styles';
import { spacing } from 'app/styles/spacing';
var useStyles = makeStyles(function (_a) {
    var palette = _a.palette;
    return ({
        outer: {
            borderRadius: 20,
            height: spacing(6),
            width: spacing(6),
            alignItems: 'center',
            justifyContent: 'center'
        },
        outerDisabled: { backgroundColor: palette.neutralLight5 },
        outerInactive: { backgroundColor: palette.neutralLight1 },
        outerActive: {
            backgroundColor: palette.secondary
        },
        innerDisabled: {
            backgroundColor: palette.neutralLight7,
            borderRadius: spacing(5.6),
            height: 22.5,
            width: 22.5,
            position: 'absolute',
            right: 0.15,
            bottom: 0.15,
            shadowColor: palette.neutralLight6,
            shadowOpacity: 0.75,
            shadowRadius: 1,
            shadowOffset: { height: -1, width: -1 }
        },
        innerInactive: {
            backgroundColor: palette.neutralLight6,
            borderRadius: spacing(5.6),
            height: 22.5,
            width: 22.5,
            position: 'absolute',
            right: 0.15,
            bottom: 0.15,
            shadowColor: palette.neutralLight6,
            shadowOpacity: 0.75,
            shadowRadius: 1,
            shadowOffset: { height: -1, width: -1 }
        },
        innerActive: {
            height: spacing(3.5),
            width: spacing(3.5),
            borderRadius: spacing(3.5),
            backgroundColor: palette.white
        },
        innerActiveAndDisabled: {
            height: spacing(3.5),
            width: spacing(3.5),
            borderRadius: spacing(3.5),
            backgroundColor: palette.neutralLight7
        }
    });
});
export var RadioButton = function (props) {
    var checked = props.checked, _a = props.disabled, disabled = _a === void 0 ? false : _a, style = props.style;
    var styles = useStyles();
    return (<View style={[
            styles.outer,
            checked
                ? styles.outerActive
                : disabled
                    ? styles.outerDisabled
                    : styles.outerInactive,
            style
        ]}>
      <View style={checked && disabled
            ? styles.innerActiveAndDisabled
            : checked
                ? styles.innerActive
                : disabled
                    ? styles.innerDisabled
                    : styles.innerInactive}/>
    </View>);
};
