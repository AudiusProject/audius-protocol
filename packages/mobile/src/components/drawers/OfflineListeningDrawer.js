import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useDispatch } from 'react-redux';
import { IconCart, IconCloudDownload, IconHeart, IconRepost, Button } from '@audius/harmony-native';
import { Switch, Text } from 'app/components/core';
import { useDrawer } from 'app/hooks/useDrawer';
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled';
import { setVisibility } from 'app/store/drawers/slice';
import { requestDownloadAllFavorites } from 'app/store/offline-downloads/slice';
import { makeStyles } from 'app/styles';
import { useThemeColors } from 'app/utils/theme';
import { HarmonyModalHeader } from '../core/HarmonyModalHeader';
import { NativeDrawer } from '../drawer';
var useDrawerStyles = makeStyles(function (_a) {
    var spacing = _a.spacing, palette = _a.palette, typography = _a.typography;
    return ({
        container: {
            paddingVertical: spacing(6),
            flexDirection: 'column',
            paddingHorizontal: spacing(4),
            rowGap: spacing(6),
            alignItems: 'center'
        },
        descriptionText: {
            textAlign: 'center',
            lineHeight: typography.fontSize.large * 1.3
        },
        titleIcon: {
            position: 'relative',
            top: 7,
            color: palette.neutral,
            marginRight: spacing(3)
        }
    });
});
var useToggleStyles = makeStyles(function (_a) {
    var spacing = _a.spacing, palette = _a.palette;
    return ({
        toggleContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
            alignItems: 'center'
        },
        titleContainer: {
            columnGap: spacing(2),
            flexDirection: 'row'
        }
    });
});
var messages = {
    offlineListeningTitle: 'Offline Listening',
    offlineListeningDescription: 'Use the toggles to select what you’d like synced for offline streaming.',
    comingSoonToggleSuffix: '(coming soon...)',
    favorites: 'Favorites',
    reposts: 'Reposts',
    purchased: 'Purchased',
    saveChanges: 'Save Changes'
};
var OfflineListeningOptionToggle = function (_a) {
    var title = _a.title, Icon = _a.icon, value = _a.value, onValueChange = _a.onValueChange, disabled = _a.disabled;
    var styles = useToggleStyles();
    var _b = useThemeColors(), neutral = _b.neutral, neutralLight4 = _b.neutralLight4;
    return (<View style={styles.toggleContainer}>
      <View style={styles.titleContainer}>
        <Icon fill={disabled ? neutralLight4 : neutral} height={20} width={20}/>
        <Text weight='demiBold' fontSize='large' color={disabled ? 'neutralLight4' : 'neutral'}>
          {title}
        </Text>
      </View>
      <Switch value={value} disabled={disabled} onValueChange={onValueChange}/>
    </View>);
};
export var OfflineListeningDrawer = function () {
    var styles = useDrawerStyles();
    var dispatch = useDispatch();
    var _a = useDrawer('OfflineListening'), data = _a.data, onClose = _a.onClose;
    var isFavoritesMarkedForDownload = data.isFavoritesMarkedForDownload, onSaveChanges = data.onSaveChanges;
    var _b = useState(isFavoritesMarkedForDownload), isFavoritesOn = _b[0], setIsFavoritesOn = _b[1];
    var handleSaveChanges = useCallback(function () {
        if (isFavoritesMarkedForDownload && !isFavoritesOn) {
            dispatch(setVisibility({
                drawer: 'RemoveDownloadedFavorites',
                visible: true
            }));
            onSaveChanges(isFavoritesOn);
        }
        else if (!isFavoritesMarkedForDownload && isFavoritesOn) {
            dispatch(requestDownloadAllFavorites());
            onSaveChanges(isFavoritesOn);
        }
        onClose();
    }, [
        dispatch,
        isFavoritesMarkedForDownload,
        isFavoritesOn,
        onClose,
        onSaveChanges
    ]);
    var handleToggleFavorites = useCallback(function (value) {
        setIsFavoritesOn(value);
    }, []);
    var isUSDCPurchasesEnabled = useIsUSDCEnabled();
    return (<NativeDrawer drawerName='OfflineListening'>
      <View style={styles.container}>
        <HarmonyModalHeader icon={IconCloudDownload} title={messages.offlineListeningTitle}/>
        <Text weight='medium' fontSize='large' style={styles.descriptionText}>
          {messages.offlineListeningDescription}
        </Text>
        <OfflineListeningOptionToggle title={messages.favorites} icon={IconHeart} value={isFavoritesOn} onValueChange={handleToggleFavorites}/>
        <OfflineListeningOptionToggle title={"".concat(messages.reposts, " ").concat(messages.comingSoonToggleSuffix)} icon={IconRepost} value={false} disabled/>
        {isUSDCPurchasesEnabled ? (<OfflineListeningOptionToggle title={"".concat(messages.purchased, " ").concat(messages.comingSoonToggleSuffix)} icon={IconCart} value={false} disabled/>) : null}
        <Button fullWidth variant='primary' onPress={handleSaveChanges}>
          {messages.saveChanges}
        </Button>
      </View>
    </NativeDrawer>);
};
