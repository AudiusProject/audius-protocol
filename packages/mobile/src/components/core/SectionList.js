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
import { forwardRef, useContext } from 'react';
import { Portal } from '@gorhom/portal';
import { Animated, Platform, RefreshControl, View } from 'react-native';
import { useCollapsibleScene } from 'react-native-collapsible-tab-view';
import { useThemeColors } from 'app/utils/theme';
import { CollapsibleTabNavigatorContext } from '../top-tab-bar';
import { PlayBarChin } from './PlayBarChin';
import { PullToRefresh, useOverflowHandlers } from './PullToRefresh';
/**
 * Create a custom hook for the collapsible scene.
 * This is necessary because SectionLists by default do not have a
 * "scrollTo" built in, which breaks the collapsible tab library.
 * Inside this custom hook, we create a realRef method that pulls the
 * scroll responder out from inside the SectionList.
 */
var useCollapsibleSectionListScene = function (sceneName) {
    var scrollPropsAndRef = useCollapsibleScene(sceneName);
    var scrollableRef = function (ref) {
        scrollPropsAndRef.ref(ref === null || ref === void 0 ? void 0 : ref.getScrollResponder());
    };
    return __assign(__assign({}, scrollPropsAndRef), { ref: scrollableRef });
};
var CollapsibleSectionList = function (props) {
    var sceneName = props.sceneName, onScroll = props.onScroll, other = __rest(props, ["sceneName", "onScroll"]);
    var _a = useContext(CollapsibleTabNavigatorContext), refreshing = _a.refreshing, onRefresh = _a.onRefresh, collapsibleScrollAnim = _a.scrollY;
    var _b = useCollapsibleSectionListScene(sceneName), ref = _b.ref, scrollProps = __rest(_b, ["ref"]);
    var _c = useThemeColors(), neutral = _c.neutral, staticWhite = _c.staticWhite;
    return (<View>
      {Platform.OS === 'ios' && onRefresh ? (<Portal hostName='PullToRefreshPortalHost'>
          <PullToRefresh isRefreshing={refreshing} onRefresh={onRefresh} scrollAnim={collapsibleScrollAnim} topOffset={40} color={staticWhite}/>
        </Portal>) : null}
      <Animated.SectionList {...other} {...scrollProps} ref={ref} 
    // @ts-ignore `forkEvent` is not defined on the type but it exists
    onScroll={Animated.forkEvent(scrollProps.onScroll, onScroll)} refreshControl={Platform.OS === 'ios' ? undefined : (<RefreshControl progressViewOffset={scrollProps.progressViewOffset} refreshing={!!refreshing} onRefresh={onRefresh !== null && onRefresh !== void 0 ? onRefresh : undefined} colors={[neutral]}/>)}/>
    </View>);
};
var AnimatedSectionList = forwardRef(function AnimatedSectionList(props, ref) {
    var _a;
    var refreshing = props.refreshing, onRefresh = props.onRefresh, onScroll = props.onScroll, other = __rest(props, ["refreshing", "onRefresh", "onScroll"]);
    var neutral = useThemeColors().neutral;
    var scrollResponder = (_a = ref === null || ref === void 0 ? void 0 : ref.current) === null || _a === void 0 ? void 0 : _a.getScrollResponder();
    var _b = useOverflowHandlers({
        isRefreshing: Boolean(refreshing),
        scrollResponder: scrollResponder,
        onRefresh: onRefresh,
        onScroll: onScroll
    }), isRefreshing = _b.isRefreshing, isRefreshDisabled = _b.isRefreshDisabled, handleRefresh = _b.handleRefresh, scrollAnim = _b.scrollAnim, handleScroll = _b.handleScroll, onScrollBeginDrag = _b.onScrollBeginDrag, onScrollEndDrag = _b.onScrollEndDrag;
    return (<View>
      {Platform.OS === 'ios' && handleRefresh ? (<PullToRefresh isRefreshing={isRefreshing} onRefresh={handleRefresh} scrollAnim={scrollAnim} isRefreshDisabled={isRefreshDisabled} yOffsetDisappearance={-16}/>) : null}

      <Animated.SectionList {...other} scrollToOverflowEnabled refreshControl={Platform.OS === 'ios' ? undefined : (<RefreshControl refreshing={!!isRefreshing} onRefresh={onRefresh !== null && onRefresh !== void 0 ? onRefresh : undefined} colors={[neutral]}/>)} 
    // Have to cast here because Animated version doesn't type getScrollResponder
    ref={ref} onScroll={handleScroll} onScrollBeginDrag={onScrollBeginDrag} onScrollEndDrag={onScrollEndDrag}/>
    </View>);
});
export var SectionList = forwardRef(function SectionList(props, ref) {
    var ListFooterComponent = props.ListFooterComponent, other = __rest(props, ["ListFooterComponent"]);
    var sceneName = useContext(CollapsibleTabNavigatorContext).sceneName;
    var FooterComponent = ListFooterComponent ? (<>
      {ListFooterComponent}
      <PlayBarChin />
    </>) : (PlayBarChin);
    var sectionListProps = __assign(__assign({}, other), { ListFooterComponent: FooterComponent });
    if (sceneName) {
        return (<CollapsibleSectionList sceneName={sceneName} {...sectionListProps}/>);
    }
    return <AnimatedSectionList ref={ref} {...sectionListProps}/>;
});
