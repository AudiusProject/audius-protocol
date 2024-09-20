import { View } from 'react-native';
import { Text } from 'app/components/core';
import { makeStyles } from 'app/styles';
import { useThemeColors } from 'app/utils/theme';
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing, palette = _a.palette;
    return ({
        container: {
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            paddingBottom: spacing(4),
            borderBottomColor: palette.neutralLight8,
            borderBottomWidth: 1
        },
        titleIcon: {
            marginRight: spacing(2)
        }
    });
});
export var HarmonyModalHeader = function (_a) {
    var Icon = _a.icon, title = _a.title;
    var styles = useStyles();
    var neutralLight2 = useThemeColors().neutralLight2;
    return (<View style={styles.container}>
      <Icon style={styles.titleIcon} fill={neutralLight2} height={20} width={24}/>
      <Text weight='heavy' color='neutralLight2' fontSize='xl' textTransform='uppercase'>
        {title}
      </Text>
    </View>);
};
