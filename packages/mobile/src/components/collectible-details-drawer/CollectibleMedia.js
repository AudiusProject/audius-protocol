import { useCallback, useState } from 'react';
import { CollectibleMediaType } from '@audius/common/models';
import { TouchableWithoutFeedback, View } from 'react-native';
import { IconVolumeLevel2, IconVolumeLevel0 } from '@audius/harmony-native';
import AutoSizeImage from 'app/components/image/AutoSizeImage';
import AutoSizeVideo from 'app/components/video/AutoSizeVideo';
import { makeStyles } from 'app/styles';
import { useColor } from 'app/utils/theme';
var useStyles = makeStyles(function (_a) {
    var palette = _a.palette, spacing = _a.spacing;
    return ({
        container: {
            borderRadius: 8
        },
        volumeIconContainer: {
            position: 'absolute',
            height: spacing(10),
            width: spacing(10),
            bottom: spacing(2),
            right: spacing(2),
            borderWidth: 2,
            borderColor: palette.neutralLight5,
            borderRadius: spacing(10) / 2,
            justifyContent: 'center',
            alignItems: 'center'
        },
        volumeIcon: {}
    });
});
export var CollectibleMedia = function (props) {
    var _a;
    var _b;
    var collectible = props.collectible;
    var mediaType = collectible.mediaType, imageUrl = collectible.imageUrl, videoUrl = collectible.videoUrl, gifUrl = collectible.gifUrl;
    var styles = useStyles();
    var neutralLight5 = useColor('neutralLight5');
    var _c = useState(true), isMuted = _c[0], setIsMuted = _c[1];
    var toggleMute = useCallback(function () {
        setIsMuted(!isMuted);
    }, [isMuted, setIsMuted]);
    var VolumeIcon = isMuted ? IconVolumeLevel0 : IconVolumeLevel2;
    var renderByMediaType = (_a = {},
        // TODO: Implement 3D model viewing on mobile
        _a[CollectibleMediaType.THREE_D] = function () { return (<AutoSizeImage source={{ uri: gifUrl !== null && gifUrl !== void 0 ? gifUrl : undefined }} style={styles.container}/>); },
        _a[CollectibleMediaType.GIF] = function () { return (<AutoSizeImage source={{ uri: gifUrl !== null && gifUrl !== void 0 ? gifUrl : undefined }} style={styles.container}/>); },
        _a[CollectibleMediaType.ANIMATED_WEBP] = function () { return (<AutoSizeImage source={{ uri: gifUrl !== null && gifUrl !== void 0 ? gifUrl : undefined }} style={styles.container}/>); },
        _a[CollectibleMediaType.VIDEO] = function () { return (<TouchableWithoutFeedback onPress={toggleMute}>
        <View>
          <AutoSizeVideo repeat={true} ignoreSilentSwitch={'ignore'} fullscreen={false} muted={isMuted} source={{ uri: videoUrl !== null && videoUrl !== void 0 ? videoUrl : undefined }} style={styles.container}/>
          <View style={styles.volumeIconContainer}>
            <VolumeIcon style={styles.volumeIcon} height={18} width={18} fill={neutralLight5}/>
          </View>
        </View>
      </TouchableWithoutFeedback>); },
        _a[CollectibleMediaType.IMAGE] = function () { return (<AutoSizeImage source={{ uri: imageUrl !== null && imageUrl !== void 0 ? imageUrl : undefined }} style={styles.container}/>); },
        _a);
    return ((_b = renderByMediaType[mediaType]) !== null && _b !== void 0 ? _b : renderByMediaType[CollectibleMediaType.IMAGE])();
};
