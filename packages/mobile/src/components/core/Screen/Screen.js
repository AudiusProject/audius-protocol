import { useEffect, useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { pickBy, negate, isUndefined } from 'lodash';
import { View } from 'react-native';
import { screen } from 'app/services/analytics';
import { makeStyles } from 'app/styles';
import { useThemePalette } from 'app/utils/theme';
import { SecondaryScreenTitle } from './SecondaryScreenTitle';
var removeUndefined = function (object) {
    return pickBy(object, negate(isUndefined));
};
var getBackgroundColor = function (variant, palette) {
    switch (variant) {
        case 'primary':
            return palette.background;
        case 'secondary':
            return palette.background;
        case 'secondaryAlt':
            return palette.backgroundSecondary;
        default:
            return palette.white;
    }
};
var useStyles = makeStyles(function () { return ({
    root: {
        flex: 1
    }
}); });
export var Screen = function (props) {
    var children = props.children, topbarLeft = props.topbarLeft, topbarRight = props.topbarRight, _a = props.title, titleProp = _a === void 0 ? null : _a, icon = props.icon, IconProps = props.IconProps, headerTitleProp = props.headerTitle, topbarRightStyle = props.topbarRightStyle, topbarLeftStyle = props.topbarLeftStyle, url = props.url, _b = props.variant, variant = _b === void 0 ? 'primary' : _b, style = props.style, _c = props.as, RootComponent = _c === void 0 ? View : _c, header = props.header;
    var palette = useThemePalette();
    var styles = useStyles();
    var backgroundColor = getBackgroundColor(variant, palette);
    var navigation = useNavigation();
    var isSecondary = variant === 'secondary' || variant === 'white';
    // Record screen view
    useEffect(function () {
        if (url) {
            screen({ route: url });
        }
    }, [url]);
    useLayoutEffect(function () {
        navigation.setOptions(removeUndefined({
            header: header,
            headerLeft: topbarLeft === undefined ? undefined : function () { return topbarLeft; },
            headerRight: topbarRight
                ? function () { return topbarRight; }
                : isSecondary
                    ? null
                    : topbarRight,
            title: isSecondary ? undefined : titleProp,
            headerTitle: isSecondary
                ? function () { return (<SecondaryScreenTitle icon={icon} title={titleProp} IconProps={IconProps}/>); }
                : headerTitleProp
        }));
    }, [
        navigation,
        topbarLeftStyle,
        topbarLeft,
        topbarRight,
        topbarRightStyle,
        titleProp,
        isSecondary,
        headerTitleProp,
        icon,
        IconProps,
        header
    ]);
    return (<RootComponent style={[styles.root, style, { backgroundColor: backgroundColor }]}>
      {children}
    </RootComponent>);
};
