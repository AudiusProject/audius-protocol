var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { forwardRef, useContext, useRef } from 'react';
import { Animated, Platform, RefreshControl, View } from 'react-native';
import { useCollapsibleScene } from 'react-native-collapsible-tab-view';
import { useThemeColors } from 'app/utils/theme';
import { CollapsibleTabNavigatorContext } from '../top-tab-bar';
import { PlayBarChin } from './PlayBarChin';
import { PullToRefresh, useOverflowHandlers } from './PullToRefresh';
function CollapsibleFlatList(props) {
    var sceneName = props.sceneName, onScroll = props.onScroll, other = __rest(props, ["sceneName", "onScroll"]);
    var refreshing = other.refreshing, onRefresh = other.onRefresh;
    var scrollPropsAndRef = useCollapsibleScene(sceneName);
    var neutral = useThemeColors().neutral;
    return (<View>
      {onRefresh ? <PullToRefresh /> : null}
      <Animated.FlatList {...other} {...scrollPropsAndRef} 
    // @ts-ignore `forkEvent` is not defined on the type but it exists
    onScroll={Animated.forkEvent(scrollPropsAndRef.onScroll, onScroll)} refreshControl={Platform.OS === 'ios' ? undefined : (<RefreshControl progressViewOffset={scrollPropsAndRef.progressViewOffset} refreshing={!!refreshing} onRefresh={onRefresh !== null && onRefresh !== void 0 ? onRefresh : undefined} colors={[neutral]}/>)}/>
    </View>);
}
var AnimatedFlatList = forwardRef(function AnimatedFlatList(props, ref) {
    var refreshing = props.refreshing, onRefresh = props.onRefresh, onScroll = props.onScroll, other = __rest(props, ["refreshing", "onRefresh", "onScroll"]);
    var scrollRef = useRef(null);
    var neutral = useThemeColors().neutral;
    var _a = useOverflowHandlers({
        isRefreshing: Boolean(refreshing),
        scrollResponder: (ref === null || ref === void 0 ? void 0 : ref.current) || scrollRef.current,
        onRefresh: onRefresh,
        onScroll: onScroll
    }), isRefreshing = _a.isRefreshing, isRefreshDisabled = _a.isRefreshDisabled, handleRefresh = _a.handleRefresh, scrollAnim = _a.scrollAnim, handleScroll = _a.handleScroll, onScrollBeginDrag = _a.onScrollBeginDrag, onScrollEndDrag = _a.onScrollEndDrag;
    return (<View>
      {Platform.OS === 'ios' && handleRefresh ? (<PullToRefresh isRefreshing={isRefreshing} onRefresh={handleRefresh} scrollAnim={scrollAnim} isRefreshDisabled={isRefreshDisabled} yOffsetDisappearance={-16}/>) : null}
      <Animated.FlatList {...other} scrollToOverflowEnabled refreshControl={Platform.OS === 'ios' ? undefined : (<RefreshControl refreshing={!!isRefreshing} onRefresh={onRefresh !== null && onRefresh !== void 0 ? onRefresh : undefined} colors={[neutral]}/>)} ref={ref || scrollRef} onScroll={handleScroll} onScrollBeginDrag={onScrollBeginDrag} onScrollEndDrag={onScrollEndDrag}/>
    </View>);
});
/**
 * Provides either a FlatList or an animated FlatList
 * depending on whether or not the list is found in a "collapsible" header tab
 */
export var FlatList = forwardRef(function FlatList(props, ref) {
    var ListFooterComponent = props.ListFooterComponent, sceneNameProp = props.sceneName, other = __rest(props, ["ListFooterComponent", "sceneName"]);
    var sceneNameContext = useContext(CollapsibleTabNavigatorContext).sceneName;
    var sceneName = sceneNameProp !== null && sceneNameProp !== void 0 ? sceneNameProp : sceneNameContext;
    var FooterComponent = ListFooterComponent ? (<>
      {ListFooterComponent}
      <PlayBarChin />
    </>) : (PlayBarChin);
    var flatListProps = __assign(__assign({}, other), { ListFooterComponent: FooterComponent });
    if (sceneName) {
        return (<CollapsibleFlatList sceneName={sceneName} {...flatListProps}/>);
    }
    return (<AnimatedFlatList ref={ref} {...flatListProps}/>);
});
