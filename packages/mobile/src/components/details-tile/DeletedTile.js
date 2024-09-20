import { TouchableOpacity } from 'react-native-gesture-handler';
import { Button, Flex, IconUser, Paper, Text, useTheme } from '@audius/harmony-native';
import { UserBadges } from 'app/components/user-badges';
var messages = {
    deleted: '[deleted by artist]',
    moreBy: function (artistName) { return "More by ".concat(artistName); }
};
export var DeletedTile = function (_a) {
    var headerText = _a.headerText, title = _a.title, user = _a.user, imageElement = _a.imageElement, handlePressArtistName = _a.handlePressArtistName;
    var spacing = useTheme().spacing;
    return (<Paper alignItems='center' p='l' gap='l' w='100%'>
      <Text variant='label' color='subdued' style={{ letterSpacing: 2 }}>
        {headerText} {messages.deleted}
      </Text>
      {imageElement}
      <Flex gap='xs' alignItems='center'>
        <Text variant='heading' size='s'>
          {title}
        </Text>
        {user ? (<TouchableOpacity onPress={handlePressArtistName}>
            <Flex direction='row' gap='xs'>
              <Text variant='body' color='accent' size='l'>
                {user.name}
              </Text>
              <UserBadges badgeSize={spacing.l} user={user} hideName/>
            </Flex>
          </TouchableOpacity>) : null}
      </Flex>
      <Button variant='secondary' iconLeft={IconUser} onPress={handlePressArtistName} fullWidth>
        {messages.moreBy(user === null || user === void 0 ? void 0 : user.name)}
      </Button>
    </Paper>);
};
