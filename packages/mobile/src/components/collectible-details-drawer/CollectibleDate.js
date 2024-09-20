import { formatDateWithTimezoneOffset } from '@audius/common/utils';
import { View } from 'react-native';
import { Text } from 'app/components/core';
import { makeStyles } from 'app/styles';
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing;
    return ({
        dateWrapper: {
            flexDirection: 'row',
            marginTop: spacing(2),
            marginBottom: spacing(5)
        },
        date: {
            marginHorizontal: spacing(2)
        }
    });
});
export var CollectibleDate = function (props) {
    var date = props.date, label = props.label;
    var styles = useStyles();
    return (<View style={styles.dateWrapper}>
      <Text color='neutralLight4' weight='bold'>
        {label}
      </Text>
      <Text color='neutralLight2' style={styles.date}>
        {formatDateWithTimezoneOffset(date)}
      </Text>
    </View>);
};
