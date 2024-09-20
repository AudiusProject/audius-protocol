import { View } from 'react-native';
import { makeStyles } from 'app/styles';
import { ErrorText } from './ErrorText';
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing;
    return ({
        root: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 2
        },
        icon: {
            marginRight: spacing(2)
        }
    });
});
export var InputErrorMessage = function (props) {
    var message = props.message, style = props.style;
    var styles = useStyles();
    return (<View style={[styles.root, style]}>
      <ErrorText size='s'>{message}</ErrorText>
    </View>);
};
