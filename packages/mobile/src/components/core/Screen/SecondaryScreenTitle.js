import { View } from 'react-native';
import { Text } from 'app/components/core';
import { makeStyles } from 'app/styles';
import { spacing } from 'app/styles/spacing';
import { useThemeColors } from 'app/utils/theme';
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing, palette = _a.palette;
    return ({
        root: {
            flexDirection: 'row',
            alignItems: 'center'
        },
        icon: {
            marginRight: spacing(2)
        },
        text: {
            color: palette.neutralLight4,
            textTransform: 'uppercase'
        }
    });
});
export var SecondaryScreenTitle = function (props) {
    var Icon = props.icon, IconProps = props.IconProps, title = props.title;
    var styles = useStyles();
    var neutralLight4 = useThemeColors().neutralLight4;
    return (<View style={styles.root}>
      {Icon ? (<Icon style={styles.icon} fill={neutralLight4} height={spacing(6)} width={spacing(6)} {...IconProps}/>) : null}
      <Text fontSize='large' weight='heavy' accessibilityRole='header' style={styles.text}>
        {title}
      </Text>
    </View>);
};
