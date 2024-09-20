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
import { useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Button, Flex, useTheme, Divider } from '@audius/harmony-native';
import { AppDrawer, NativeDrawer, useDrawerState } from 'app/components/drawer';
import { useDrawer } from 'app/hooks/useDrawer';
var defaultMessages = {
    cancel: 'Cancel'
};
export var ConfirmationDrawerContent = function (props) {
    var messagesProp = props.messages, onConfirm = props.onConfirm, onCancel = props.onCancel, onClose = props.onClose, _a = props.variant, variant = _a === void 0 ? 'destructive' : _a, Icon = props.icon, addBottomInset = props.addBottomInset, children = props.children;
    var messages = __assign(__assign({}, defaultMessages), messagesProp);
    var insets = useSafeAreaInsets();
    var spacing = useTheme().spacing;
    var handleConfirm = useCallback(function () {
        onClose();
        onConfirm();
    }, [onClose, onConfirm]);
    var handleCancel = useCallback(function () {
        onClose();
        onCancel === null || onCancel === void 0 ? void 0 : onCancel();
    }, [onClose, onCancel]);
    return (<Flex gap='xl' pv='xl' ph='l'>
      <Flex direction='row' gap='s' alignItems='center' justifyContent='center'>
        {Icon ? <Icon size='xl' color='subdued'/> : null}
        <Text variant='label' size='xl' strength='strong' color='subdued'>
          {messages.header}
        </Text>
      </Flex>
      <Divider />
      <Text size='l' textAlign='center'>
        {messages.description}
      </Text>
      {children}
      <Flex gap='l'>
        <Button variant={variant === 'destructive' ? 'destructive' : 'primary'} fullWidth onPress={handleConfirm}>
          {messages.confirm}
        </Button>
        <Button variant='secondary' fullWidth onPress={handleCancel}>
          {messages.cancel}
        </Button>
      </Flex>
      {addBottomInset ? <Flex h={insets.bottom + spacing.xl}/> : null}
    </Flex>);
};
var NativeConfirmationDrawer = function (props) {
    var drawerName = props.drawerName, other = __rest(props, ["drawerName"]);
    var onCancel = other.onCancel;
    var onClose = useDrawer(drawerName).onClose;
    return (<NativeDrawer drawerName={drawerName} onClose={onCancel}>
      <ConfirmationDrawerContent onClose={onClose} {...other}/>
    </NativeDrawer>);
};
export var ConfirmationDrawer = function (props) {
    return 'drawerName' in props ? (<NativeConfirmationDrawer {...props}/>) : (<CommonConfirmationDrawer {...props}/>);
};
var CommonConfirmationDrawer = function (props) {
    var modalName = props.modalName, other = __rest(props, ["modalName"]);
    var onCancel = other.onCancel;
    var onClose = useDrawerState(modalName).onClose;
    return (<AppDrawer modalName={modalName} onClose={onCancel}>
      <ConfirmationDrawerContent onClose={onClose} {...other}/>
    </AppDrawer>);
};
