import { route } from '@audius/common/utils';
import { Image, View } from 'react-native';
import { IconArrowRight, Button } from '@audius/harmony-native';
import AudiusAPI from 'app/assets/images/audiusAPI.png';
import { GradientText, useLink } from 'app/components/core';
import { AppDrawer } from 'app/components/drawer';
import Text from 'app/components/text';
import { makeStyles } from 'app/styles';
var messages = {
    modalTitle: 'Audius API',
    title: "It's easy to build your own app on Audius",
    description: 'The top 10 Audius API apps each month win',
    button: 'Learn More'
};
var MODAL_NAME = 'APIRewardsExplainer';
var useStyles = makeStyles(function (_a) {
    var palette = _a.palette, spacing = _a.spacing, typography = _a.typography;
    return ({
        content: {
            padding: spacing(6),
            display: 'flex',
            alignItems: 'center'
        },
        drawerTitle: {
            marginTop: spacing(2),
            marginBottom: spacing(8),
            fontSize: typography.fontSize.xxxl
        },
        image: {
            height: 100,
            width: 120,
            marginBottom: spacing(8)
        },
        title: {
            marginBottom: spacing(6),
            color: palette.secondary,
            fontSize: typography.fontSize.xxl,
            textAlign: 'center'
        },
        subtitle: {
            color: palette.neutralLight4,
            marginBottom: spacing(6)
        }
    });
});
export var ApiRewardsDrawer = function () {
    var styles = useStyles();
    var onPress = useLink(route.AUDIUS_API_LINK).onPress;
    return (<AppDrawer modalName={MODAL_NAME}>
      <View style={styles.content}>
        <GradientText style={styles.drawerTitle}>
          {messages.modalTitle}
        </GradientText>
        <Image style={styles.image} source={AudiusAPI}/>
        <Text style={styles.title} weight='bold'>
          {messages.title}
        </Text>
        <Text style={styles.subtitle} weight='bold'>
          {messages.description}
        </Text>
        <Button variant='primary' iconRight={IconArrowRight} onPress={onPress} fullWidth>
          {messages.button}
        </Button>
      </View>
    </AppDrawer>);
};
