import { TouchableOpacity, View } from 'react-native';
import { IconLink } from '@audius/harmony-native';
import { Text, useLink } from 'app/components/core';
import { makeStyles } from 'app/styles';
import { spacing } from 'app/styles/spacing';
import { useThemeColors } from 'app/utils/theme';
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing;
    return ({
        link: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing(5)
        },
        linkText: {
            textDecorationLine: 'underline'
        },
        linkIcon: {
            marginRight: spacing(1)
        }
    });
});
export var CollectibleLink = function (props) {
    var url = props.url, text = props.text;
    var styles = useStyles();
    var onPress = useLink(url).onPress;
    var secondary = useThemeColors().secondary;
    return (<TouchableOpacity onPress={onPress}>
      <View style={styles.link}>
        <IconLink fill={secondary} style={styles.linkIcon} height={spacing(4)} width={spacing(4)}/>
        <Text style={styles.linkText} color='secondary' weight='demiBold'>
          {text}
        </Text>
      </View>
    </TouchableOpacity>);
};
