import { View } from 'react-native';
import { GradientIcon, GradientText } from 'app/components/core';
import { makeStyles } from 'app/styles';
var useStyles = makeStyles(function (_a) {
    var palette = _a.palette, spacing = _a.spacing, typography = _a.typography;
    return ({
        root: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: palette.white,
            height: 40,
            borderBottomWidth: 1,
            borderBottomColor: palette.neutralLight8,
            paddingHorizontal: spacing(4),
            borderTopWidth: 1,
            borderTopColor: palette.neutralLight8,
            elevation: 3,
            shadowColor: palette.neutralDark1,
            shadowOpacity: 0.12,
            shadowOffset: { height: 2, width: 0 },
            shadowRadius: 2
        },
        header: {
            fontSize: typography.fontSize.xl,
            lineHeight: 25,
            fontFamily: typography.fontByWeight.heavy
        },
        headerContent: {
            flexDirection: 'row',
            alignItems: 'center'
        },
        headerIcon: {
            marginRight: spacing(2)
        }
    });
});
export var ScreenHeader = function (props) {
    var children = props.children, text = props.text, stylesProp = props.styles, icon = props.icon, iconProps = props.iconProps;
    var styles = useStyles();
    return (<View style={[styles.root, stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.root]}>
      <View style={styles.headerContent}>
        {icon ? (<GradientIcon icon={icon} height={20} style={[styles.headerIcon, stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.icon]} {...iconProps}/>) : null}
        <GradientText accessibilityRole='header' style={[styles.header, stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.header]}>
          {text}
        </GradientText>
      </View>
      {children}
    </View>);
};
