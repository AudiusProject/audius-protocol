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
import Drawer from '../drawer';
import { ActionDrawerContent } from './ActionDrawer';
/** ActionDrawer that isn't coupled to redux */
export var ActionDrawerWithoutRedux = function (props) {
    var rows = props.rows, stylesProp = props.styles, disableAutoClose = props.disableAutoClose, children = props.children, other = __rest(props, ["rows", "styles", "disableAutoClose", "children"]);
    var onClose = other.onClose;
    return (<Drawer {...other}>
      <ActionDrawerContent onClose={onClose} rows={rows} styles={stylesProp} disableAutoClose={disableAutoClose}>
        {children}
      </ActionDrawerContent>
    </Drawer>);
};
