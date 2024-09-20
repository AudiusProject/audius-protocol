import { getAAOErrorEmojis } from '@audius/common/utils';
import { Text } from 'app/components/core';
import { useStyles } from './styles';
var messages = {
    claimErrorMessage: 'Something has gone wrong, not all your rewards were claimed. Please try again.',
    claimErrorMessageAAO: 'Your account is unable to claim rewards at this time. Please try again later or contact support@audius.co. '
};
/** Renders a generic error message for failed challenge claims */
export var ClaimError = function (_a) {
    var aaoErrorCode = _a.aaoErrorCode;
    var styles = useStyles();
    return aaoErrorCode === undefined ? (<Text style={styles.claimRewardsError} weight='bold'>
      {messages.claimErrorMessage}
    </Text>) : (<Text style={styles.claimRewardsError} weight='bold'>
      {messages.claimErrorMessageAAO}
      {getAAOErrorEmojis(aaoErrorCode)}
    </Text>);
};
