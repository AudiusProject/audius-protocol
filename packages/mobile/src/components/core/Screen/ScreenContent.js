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
import { reachabilitySelectors } from '@audius/common/store';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import { usePrevious } from 'react-use';
import { OfflinePlaceholder } from 'app/components/offline-placeholder';
var getIsReachable = reachabilitySelectors.getIsReachable;
export var ScreenContent = function (props) {
    var children = props.children, isOfflineCapable = props.isOfflineCapable, other = __rest(props, ["children", "isOfflineCapable"]);
    var isReachable = useSelector(getIsReachable);
    var wasReachable = usePrevious(isReachable);
    return (<>
      {isReachable || isOfflineCapable ? (children) : (<Animated.View entering={wasReachable ? FadeIn : undefined}>
          <OfflinePlaceholder {...other}/>
        </Animated.View>)}
    </>);
};
