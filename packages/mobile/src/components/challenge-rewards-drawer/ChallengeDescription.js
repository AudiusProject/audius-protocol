import { useFeatureFlag } from '@audius/common/hooks';
import { FeatureFlags } from '@audius/common/services';
import { View } from 'react-native';
import { Flex, Text } from '@audius/harmony-native';
import { useStyles } from './styles';
var messages = {
    task: 'Task Details',
    cooldownDescription: 'Note: There is a 7 day waiting period from completion until you can claim your reward.'
};
/** Renders the task description for the challenge. Pass `description` to render
 * a simple text string or use `renderDescription` to render fully customized
 * content.
 */
export var ChallengeDescription = function (_a) {
    var taskIcon = _a.taskIcon, _b = _a.task, task = _b === void 0 ? messages.task : _b, description = _a.description, renderDescription = _a.renderDescription;
    var isRewardsCooldownEnabled = useFeatureFlag(FeatureFlags.REWARDS_COOLDOWN).isEnabled;
    var styles = useStyles();
    return (<View style={styles.task}>
      <View style={styles.taskHeader}>
        {taskIcon}
        <Text variant='label' style={styles.subheader} strength='strong' textTransform='uppercase'>
          {task}
        </Text>
      </View>
      {renderDescription ? (renderDescription()) : (<Flex gap='m' mb='l'>
          <Text variant='body'>{description}</Text>
          {isRewardsCooldownEnabled ? (<Text variant='body' color='subdued'>
              {messages.cooldownDescription}
            </Text>) : null}
        </Flex>)}
    </View>);
};
