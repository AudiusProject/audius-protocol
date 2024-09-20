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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useMemo, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { useScrollToTop } from 'app/hooks/useScrollToTop';
import { makeStyles } from 'app/styles';
import { FlatList } from './FlatList';
var getSkeletonData = function (skeletonCount) {
    if (skeletonCount === void 0) { skeletonCount = 6; }
    return Array(Math.min(skeletonCount, 6)).fill({ _loading: true });
};
var DefaultLoadingCard = function () { return null; };
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing;
    return ({
        cardList: {
            paddingRight: 0
        },
        columnWrapper: {
            paddingLeft: spacing(3)
        },
        card: {
            width: '50%',
            paddingRight: spacing(3),
            paddingBottom: spacing(3)
        }
    });
});
export function CardList(props) {
    var renderItem = props.renderItem, disableTopTabScroll = props.disableTopTabScroll, dataProp = props.data, isLoadingProp = props.isLoading, _a = props.LoadingCardComponent, LoadingCardComponent = _a === void 0 ? DefaultLoadingCard : _a, _b = props.FlatListComponent, FlatListComponent = _b === void 0 ? FlatList : _b, totalCount = props.totalCount, other = __rest(props, ["renderItem", "disableTopTabScroll", "data", "isLoading", "LoadingCardComponent", "FlatListComponent", "totalCount"]);
    var styles = useStyles();
    var ref = useRef(null);
    var isLoading = isLoadingProp !== null && isLoadingProp !== void 0 ? isLoadingProp : !dataProp;
    useScrollToTop(function () {
        var _a;
        (_a = ref.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({
            offset: 0,
            animated: true
        });
    }, disableTopTabScroll);
    var data = useMemo(function () {
        var skeletonData = isLoading ? getSkeletonData(totalCount) : [];
        return __spreadArray(__spreadArray([], (dataProp !== null && dataProp !== void 0 ? dataProp : []), true), skeletonData, true);
    }, [dataProp, isLoading, totalCount]);
    var handleRenderItem = useCallback(function (info) {
        var _a;
        var itemElement = '_loading' in info.item ? (<LoadingCardComponent />) : ((_a = renderItem === null || renderItem === void 0 ? void 0 : renderItem(info)) !== null && _a !== void 0 ? _a : null);
        return <View style={styles.card}>{itemElement}</View>;
    }, [LoadingCardComponent, renderItem, styles.card]);
    return (<FlatListComponent style={styles.cardList} columnWrapperStyle={styles.columnWrapper} ref={ref} data={data} renderItem={handleRenderItem} numColumns={2} {...other}/>);
}
