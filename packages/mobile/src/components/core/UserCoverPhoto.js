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
import { CoverPhoto } from '@audius/harmony-native';
import { useCoverPhoto } from '../image/CoverPhoto';
export var UserCoverPhoto = function (props) {
    var userId = props.userId, other = __rest(props, ["userId"]);
    var _a = useCoverPhoto(userId), source = _a.source, handleError = _a.handleError, shouldBlur = _a.shouldBlur;
    return (<CoverPhoto coverPhoto={shouldBlur ? undefined : source} profilePicture={shouldBlur ? source : undefined} onError={handleError} {...other}/>);
};
