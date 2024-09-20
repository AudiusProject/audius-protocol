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
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import { PlayBarChin } from './PlayBarChin';
/**
 * KeyboardAwareScrollView that can wrap an inner Virtualized List, allowing inner lists to
 * scroll the entire ScrollView
 *
 * This gives us much more flexibility with the layout and styling of FlatLists,
 * for example styling the FlatList content separately from the Header
 */
export var VirtualizedKeyboardAwareScrollView = function (props) {
    var children = props.children, other = __rest(props, ["children"]);
    var listHeader = Array.isArray(children) ? <>{children}</> : children;
    return (<KeyboardAwareFlatList ListHeaderComponent={listHeader} data={null} renderItem={function () { return null; }} scrollIndicatorInsets={{ right: Number.MIN_VALUE }} ListFooterComponent={PlayBarChin} {...other}/>);
};
