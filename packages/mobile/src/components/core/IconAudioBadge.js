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
import { IconTokenBronze, IconTokenGold, IconTokenPlatinum, IconTokenSilver, IconTokenNoTier } from '@audius/harmony-native';
var audioTierMap = {
    none: IconTokenNoTier,
    bronze: IconTokenBronze,
    silver: IconTokenSilver,
    gold: IconTokenGold,
    platinum: IconTokenPlatinum
};
export var IconAudioBadge = function (props) {
    var tier = props.tier, showNoTier = props.showNoTier, height = props.height, width = props.width, styleProp = props.style, other = __rest(props, ["tier", "showNoTier", "height", "width", "style"]);
    var style = [styleProp, { height: height, width: width }];
    if (tier === 'none' && !showNoTier)
        return null;
    var AudioBadge = audioTierMap[tier];
    return <AudioBadge height={height} width={width} style={style} {...other}/>;
};
