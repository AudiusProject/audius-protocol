import { TouchableOpacity, View, Image } from 'react-native';
import { Flex, IconClose } from '@audius/harmony-native';
import { Text } from 'app/components/core';
import { makeStyles } from 'app/styles';
import { useColor } from 'app/utils/theme';
export var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing;
    return ({
        titleBarContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: spacing(2),
            paddingHorizontal: spacing(8)
        },
        dismissContainer: {
            position: 'absolute',
            top: spacing(3),
            left: spacing(3)
        },
        titleImage: {
            height: spacing(6),
            width: spacing(6)
        }
    });
});
export var DrawerHeader = function (props) {
    var onClose = props.onClose, title = props.title, TitleIcon = props.titleIcon, titleImage = props.titleImage, isFullscreen = props.isFullscreen;
    var styles = useStyles();
    var iconRemoveColor = useColor('neutralLight4');
    var titleIconColor = useColor('neutral');
    return title || isFullscreen ? (<View style={styles.titleBarContainer}>
      {isFullscreen ? (<TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.dismissContainer}>
          <IconClose size='m' fill={iconRemoveColor}/>
        </TouchableOpacity>) : null}
      {title ? (<Flex gap='s' alignItems='center' direction='row'>
          {TitleIcon ? <TitleIcon size='m' fill={titleIconColor}/> : null}
          {titleImage ? (<Image style={styles.titleImage} source={titleImage}/>) : null}
          <Text fontSize='xl' weight='heavy' textTransform='uppercase'>
            {title}
          </Text>
        </Flex>) : null}
    </View>) : (<View />);
};
