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
import { useCallback } from 'react';
import { TouchableHighlight, View } from 'react-native';
import { Text } from 'app/components/core';
import { makeStyles } from 'app/styles';
import { useThemeColors } from 'app/utils/theme';
import { AppDrawer, useDrawerState } from '../drawer/AppDrawer';
var useStyles = makeStyles(function (_a) {
    var palette = _a.palette, typography = _a.typography, spacing = _a.spacing;
    return ({
        row: {
            height: 56,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: palette.neutralLight8
        },
        title: {
            fontSize: typography.fontSize.medium
        },
        action: {
            fontSize: typography.fontSize.xl,
            paddingTop: spacing(1),
            color: palette.secondary
        },
        actionIcon: {
            minWidth: 42
        },
        destructiveAction: {
            color: palette.accentRed
        }
    });
});
export var ActionDrawerContent = function (props) {
    var rows = props.rows, stylesProp = props.styles, disableAutoClose = props.disableAutoClose, children = props.children, onClose = props.onClose;
    var styles = useStyles();
    var didSelectRow = useCallback(function (index) {
        var callback = rows[index].callback;
        if (!disableAutoClose) {
            onClose === null || onClose === void 0 ? void 0 : onClose();
        }
        if (callback) {
            callback();
        }
    }, [rows, onClose, disableAutoClose]);
    var neutralLight9 = useThemeColors().neutralLight9;
    return (<View>
      {children}
      {rows.map(function (_a, index) {
            var text = _a.text, _b = _a.isDestructive, isDestructive = _b === void 0 ? false : _b, icon = _a.icon, style = _a.style;
            return (<TouchableHighlight key={"".concat(text, "-").concat(index)} onPress={function () {
                    didSelectRow(index);
                }} underlayColor={neutralLight9}>
          <View style={[styles.row, stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.row]}>
            {icon ? <View style={styles.actionIcon}>{icon}</View> : null}
            <Text fontSize='xl' weight='demiBold' color={isDestructive ? 'accentRed' : 'secondary'} style={style}>
              {text}
            </Text>
          </View>
        </TouchableHighlight>);
        })}
    </View>);
};
// `ActionDrawer` is a drawer that presents a list of clickable rows with text
var ActionDrawer = function (props) {
    var modalName = props.modalName, rows = props.rows, stylesProp = props.styles, disableAutoClose = props.disableAutoClose, children = props.children, other = __rest(props, ["modalName", "rows", "styles", "disableAutoClose", "children"]);
    var onClose = useDrawerState(modalName).onClose;
    return (<AppDrawer modalName={modalName} {...other}>
      <ActionDrawerContent onClose={onClose} rows={rows} styles={stylesProp} disableAutoClose={disableAutoClose}>
        {children}
      </ActionDrawerContent>
    </AppDrawer>);
};
export default ActionDrawer;
