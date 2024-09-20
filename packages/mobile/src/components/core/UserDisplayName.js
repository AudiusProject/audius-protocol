var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { useSelectTierInfo } from '@audius/common/hooks';
import { cacheUsersSelectors } from '@audius/common/store';
import { useSelector } from 'react-redux';
import { Flex, IconVerified, Text, useTheme, variantStylesMap } from '@audius/harmony-native';
import { IconAudioBadge } from './IconAudioBadge';
var getUser = cacheUsersSelectors.getUser;
export var UserDisplayName = function (props) {
    var userId = props.userId, _a = props.variant, variant = _a === void 0 ? 'title' : _a, _b = props.size, size = _b === void 0 ? 's' : _b, style = props.style, other = __rest(props, ["userId", "variant", "size", "style"]);
    var _c = useSelectTierInfo(userId), tier = _c.tier, isVerified = _c.isVerified;
    var displayName = useSelector(function (state) { var _a; return (_a = getUser(state, { id: userId })) === null || _a === void 0 ? void 0 : _a.name; });
    var typography = useTheme().typography;
    var fontSize = typography.size[variantStylesMap[variant].fontSize[size]];
    var badgeSize = fontSize - 2;
    return (<Flex row gap='xs' alignItems='center' style={style} ph={isVerified ? 'xl' : 'l'}>
      <Text ellipses variant={variant} size={size} {...other} numberOfLines={1}>
        {displayName}
      </Text>
      {isVerified ? (<IconVerified height={badgeSize} width={badgeSize}/>) : null}
      <IconAudioBadge tier={tier} height={fontSize} width={fontSize}/>
    </Flex>);
};
