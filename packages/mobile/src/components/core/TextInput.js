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
import { useState, useRef, forwardRef, useCallback, useEffect } from 'react';
import { BlurView } from '@react-native-community/blur';
import { Platform, Keyboard, InputAccessoryView, Animated, TextInput as RNTextInput, View, Pressable } from 'react-native';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { IconCloseAlt } from '@audius/harmony-native';
import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation';
import { makeStyles } from 'app/styles';
import { spacing } from 'app/styles/spacing';
import { convertHexToRGBA } from 'app/utils/convertHexToRGBA';
import { mergeRefs } from 'app/utils/mergeRefs';
import { Theme, useThemeColors, useThemeVariant } from 'app/utils/theme';
import { TextButton } from './TextButton';
var messages = {
    done: 'Done'
};
var useStyles = makeStyles(function (_a) {
    var typography = _a.typography, palette = _a.palette, spacing = _a.spacing;
    return ({
        root: {
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 2,
            borderRadius: 8,
            borderWidth: 1,
            paddingVertical: spacing(2),
            paddingLeft: spacing(3),
            paddingRight: spacing(2),
            borderColor: palette.neutralLight7,
            backgroundColor: palette.neutralLight10
        },
        labelRoot: {
            paddingTop: spacing(8),
            paddingBottom: spacing(3)
        },
        label: {
            position: 'absolute',
            left: spacing(3),
            top: spacing(2)
        },
        labelText: {
            color: palette.neutral,
            fontFamily: typography.fontByWeight.medium
        },
        input: {
            flex: 1,
            color: palette.neutral,
            fontFamily: typography.fontByWeight.medium,
            minWidth: 40,
            flexGrow: 1,
            // Needed for android
            padding: 0
        },
        icon: {
            fill: palette.neutralLight5,
            width: spacing(4),
            height: spacing(4)
        },
        placeholderText: {
            color: palette.neutralLight7
        },
        startAdornment: {},
        endAdornment: {
            alignSelf: 'flex-end'
        },
        inputAccessory: {
            flexDirection: 'row',
            justifyContent: 'flex-end'
        },
        doneButton: {
            marginRight: spacing(4),
            marginVertical: spacing(3)
        }
    });
});
var activeLabelY = 0;
var inactiveLabelY = spacing(3);
var inputAccessoryViewID = 'audiusInputAccessoryView';
export var TextInput = forwardRef(function (props, ref) {
    var _a = usePressScaleAnimation(0.8), scale = _a.scale, handlePressIn = _a.handlePressIn, handlePressOut = _a.handlePressOut;
    var innerInputRef = useRef();
    var id = props.id, style = props.style, stylesProp = props.styles, label = props.label, Icon = props.Icon, iconProp = props.iconProp, clearable = props.clearable, onClear = props.onClear, startAdornment = props.startAdornment, endAdornment = props.endAdornment, value = props.value, onFocus = props.onFocus, onBlur = props.onBlur, placeholder = props.placeholder, hideInputAccessoryProp = props.hideInputAccessory, _b = props.autoCorrect, autoCorrect = _b === void 0 ? false : _b, error = props.error, other = __rest(props, ["id", "style", "styles", "label", "Icon", "iconProp", "clearable", "onClear", "startAdornment", "endAdornment", "value", "onFocus", "onBlur", "placeholder", "hideInputAccessory", "autoCorrect", "error"]);
    var autoFocus = other.autoFocus, returnKeyType = other.returnKeyType, hideKeyboard = other.hideKeyboard;
    var styles = useStyles();
    var _c = useState(Boolean(autoFocus)), isFocused = _c[0], setIsFocused = _c[1];
    var isLabelActive = isFocused || !!value || !!startAdornment;
    var labelY = useRef(new Animated.Value(isLabelActive ? activeLabelY : inactiveLabelY));
    var labelAnimation = useRef(new Animated.Value(isLabelActive ? 16 : 18));
    var borderFocusAnimation = useRef(new Animated.Value(isFocused ? 1 : 0));
    var iconProps = __assign(__assign({}, styles.icon), iconProp);
    var hideInputAccessory = (hideInputAccessoryProp !== null && hideInputAccessoryProp !== void 0 ? hideInputAccessoryProp : returnKeyType === 'search') ||
        Platform.OS === 'android';
    // Trigger label animation on mount if value is prefilled
    useEffect(function () {
        if (isLabelActive) {
            var labelYAnimation = Animated.spring(labelY.current, {
                toValue: activeLabelY,
                useNativeDriver: true
            });
            var labelFontSizeAnimation = Animated.spring(labelAnimation.current, {
                toValue: 16,
                useNativeDriver: false
            });
            var animations = [labelYAnimation, labelFontSizeAnimation];
            Animated.parallel(animations).start();
        }
    }, [isLabelActive]);
    var handleFocus = useCallback(function (e) {
        onFocus === null || onFocus === void 0 ? void 0 : onFocus(e);
        setIsFocused(true);
        if (hideKeyboard) {
            Keyboard.dismiss();
        }
        var animations = [];
        var borderFocusCompositeAnim = Animated.spring(borderFocusAnimation.current, {
            toValue: 1,
            useNativeDriver: false
        });
        animations.push(borderFocusCompositeAnim);
        if (!isLabelActive) {
            var labelYAnimation = Animated.spring(labelY.current, {
                toValue: activeLabelY,
                useNativeDriver: true
            });
            var labelFontSizeAnimation = Animated.spring(labelAnimation.current, {
                toValue: 16,
                useNativeDriver: false
            });
            animations = animations.concat([
                labelYAnimation,
                labelFontSizeAnimation
            ]);
        }
        Animated.parallel(animations).start();
    }, [onFocus, isLabelActive, hideKeyboard]);
    var handleBlur = useCallback(function (e) {
        onBlur === null || onBlur === void 0 ? void 0 : onBlur(e);
        setIsFocused(false);
        var animations = [];
        var borderFocusCompositeAnim = Animated.spring(borderFocusAnimation.current, {
            toValue: 0,
            useNativeDriver: false
        });
        animations.push(borderFocusCompositeAnim);
        if (isFocused && !value && !startAdornment) {
            var labelYAnimation = Animated.spring(labelY.current, {
                toValue: inactiveLabelY,
                useNativeDriver: true
            });
            var labelFontSizeAnimation = Animated.spring(labelAnimation.current, {
                toValue: 18,
                useNativeDriver: false
            });
            animations = animations.concat([
                labelYAnimation,
                labelFontSizeAnimation
            ]);
        }
        Animated.parallel(animations).start();
    }, [onBlur, isFocused, value, startAdornment]);
    var handlePressRoot = useCallback(function () {
        var _a;
        if (!isFocused) {
            (_a = innerInputRef.current) === null || _a === void 0 ? void 0 : _a.focus();
        }
    }, [isFocused]);
    var handlePressIcon = useCallback(function () {
        onClear === null || onClear === void 0 ? void 0 : onClear();
    }, [onClear]);
    var _d = useThemeColors(), neutral = _d.neutral, neutralLight4 = _d.neutralLight4, secondary = _d.secondary, neutralLight7 = _d.neutralLight7, accentRed = _d.accentRed;
    var themeVariant = useThemeVariant();
    return (<Pressable onPress={handlePressRoot}>
        <Animated.View style={[
            styles.root,
            label ? styles.labelRoot : undefined,
            style,
            stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.root,
            {
                borderColor: error
                    ? accentRed
                    : borderFocusAnimation.current.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                            convertHexToRGBA(neutralLight7),
                            convertHexToRGBA(secondary)
                        ]
                    })
            }
        ]}>
          {label ? (<Animated.View style={[
                styles.label,
                { transform: [{ translateY: labelY.current }] }
            ]}>
              <Animated.Text nativeID={id} style={[
                styles.labelText,
                stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.labelText,
                {
                    fontSize: labelAnimation.current,
                    color: labelAnimation.current.interpolate({
                        inputRange: [16, 18],
                        outputRange: [
                            convertHexToRGBA(neutralLight4),
                            convertHexToRGBA(neutral)
                        ]
                    })
                }
            ]}>
                {label}
              </Animated.Text>
            </Animated.View>) : null}
          {startAdornment ? (<View style={styles.startAdornment}>{startAdornment}</View>) : null}
          <RNTextInput ref={mergeRefs([innerInputRef, ref])} style={[styles.input, stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.input]} accessibilityLabel={Platform.OS === 'ios' ? label : undefined} accessibilityLabelledBy={Platform.OS === 'android' ? id : undefined} underlineColorAndroid='transparent' autoComplete='off' autoCorrect={autoCorrect} selectionColor={secondary} placeholderTextColor={styles.placeholderText.color} value={value} onFocus={handleFocus} onBlur={handleBlur} showSoftInputOnFocus={!hideKeyboard} placeholder={label && !isFocused && !startAdornment ? undefined : placeholder} inputAccessoryViewID={hideInputAccessory ? undefined : inputAccessoryViewID} {...other}/>
          {clearable && value ? (<Animated.View style={[{ transform: [{ scale: scale }] }]}>
              <TouchableWithoutFeedback onPress={handlePressIcon} onPressIn={handlePressIn} onPressOut={handlePressOut} hitSlop={{
                top: spacing(2),
                bottom: spacing(2),
                left: spacing(2),
                right: spacing(2)
            }}>
                <IconCloseAlt fill={iconProps.fill} height={iconProps.height} width={iconProps.width}/>
              </TouchableWithoutFeedback>
            </Animated.View>) : Icon ? (<Icon fill={iconProps.fill} height={iconProps.height} width={iconProps.width}/>) : null}
          {endAdornment ? (<View style={styles.endAdornment}>{endAdornment}</View>) : null}
        </Animated.View>
        {hideInputAccessory ? null : (<InputAccessoryView nativeID={inputAccessoryViewID}>
            <BlurView blurType={themeVariant === Theme.DEFAULT
                ? 'thinMaterialLight'
                : 'thinMaterialDark'} blurAmount={20} style={styles.inputAccessory}>
              <TextButton variant='secondary' title={messages.done} TextProps={{ fontSize: 'large', weight: 'demiBold' }} style={styles.doneButton} onPress={Keyboard.dismiss}/>
            </BlurView>
          </InputAccessoryView>)}
      </Pressable>);
});
