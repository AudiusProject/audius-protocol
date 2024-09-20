var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { Fragment, useState, useEffect, useRef, useCallback } from 'react';
import { Animated, Pressable, View, Text } from 'react-native';
import { light } from 'app/haptics';
import { makeStyles } from 'app/styles';
// Note, offset is the inner padding of the container div
var offset = 3;
var springToValue = function (animation, value, finished) {
    Animated.spring(animation, {
        toValue: value,
        tension: 160,
        friction: 15,
        useNativeDriver: false
    }).start(finished);
};
var useStyles = makeStyles(function (_a) {
    var palette = _a.palette, typography = _a.typography, spacing = _a.spacing;
    return ({
        tabs: {
            borderRadius: 6,
            backgroundColor: palette.neutralLight7,
            flexDirection: 'row',
            alignItems: 'center',
            padding: offset
        },
        tab: {
            paddingVertical: spacing(2),
            paddingHorizontal: spacing(4),
            borderRadius: 4,
            justifyContent: 'center',
            alignItems: 'center'
        },
        text: {
            color: palette.neutral,
            fontSize: 13,
            fontFamily: typography.fontByWeight.demiBold
        },
        separator: {
            width: 1,
            backgroundColor: palette.neutralLight5,
            height: 15
        },
        hideSeparator: {
            opacity: 0
        },
        slider: {
            position: 'absolute',
            top: 3,
            bottom: 3,
            borderRadius: 4,
            backgroundColor: palette.white,
            shadowOpacity: 0.1,
            shadowOffset: {
                width: 0,
                height: 2
            }
        },
        fullWidth: {
            width: '100%'
        },
        tabFullWidth: {
            flexGrow: 1,
            textAlign: 'center'
        }
    });
});
export var SegmentedControl = function (props) {
    var options = props.options, selectedProp = props.selected, _a = props.defaultSelected, defaultSelected = _a === void 0 ? options[0].key : _a, onSelectOption = props.onSelectOption, fullWidth = props.fullWidth, equalWidth = props.equalWidth, style = props.style, stylesProp = props.styles;
    var styles = useStyles();
    var _b = useState(options.map(function () { return 0; })), optionWidths = _b[0], setOptionWidths = _b[1];
    var _c = useState(0), maxOptionWidth = _c[0], setMaxOptionWidth = _c[1];
    var _d = useState(false), initLeft = _d[0], setInitLeft = _d[1];
    var leftAnim = useRef(new Animated.Value(0)).current;
    var widthAnim = useRef(new Animated.Value(0)).current;
    var _e = useState(defaultSelected), selected = _e[0], setSelected = _e[1];
    var selectedOption = selectedProp !== null && selectedProp !== void 0 ? selectedProp : selected;
    var handleSelectOption = function (option) {
        light();
        onSelectOption === null || onSelectOption === void 0 ? void 0 : onSelectOption(option);
        setSelected(option);
    };
    var getLeftValue = useCallback(function () {
        var selectedOptionIdx = options.findIndex(function (option) { return option.key === selectedOption; });
        return optionWidths
            .slice(0, selectedOptionIdx)
            .reduce(function (totalWidth, width) { return totalWidth + width; }, offset);
    }, [optionWidths, options, selectedOption]);
    useEffect(function () {
        var selectedOptionIdx = options.findIndex(function (option) { return option.key === selectedOption; });
        var width = optionWidths[selectedOptionIdx];
        var left = getLeftValue();
        springToValue(leftAnim, left);
        springToValue(widthAnim, width);
    }, [options, selectedOption, leftAnim, widthAnim, optionWidths, getLeftValue]);
    // Watch for the options widths to be populated and then set the initial left value of the selector thumb
    useEffect(function () {
        if (!initLeft && optionWidths.every(function (val) { return val !== 0; })) {
            leftAnim.setValue(getLeftValue());
            setMaxOptionWidth(optionWidths.reduce(function (a, b) { return Math.max(a, b); }, 0));
            setInitLeft(true);
        }
    }, [optionWidths, initLeft, options, leftAnim, selectedOption, getLeftValue]);
    var setOptionWidth = function (i) { return function (event) {
        var width = event.nativeEvent.layout.width;
        if (i === 0) {
            springToValue(leftAnim, offset);
            springToValue(widthAnim, width);
        }
        setOptionWidths(__spreadArray(__spreadArray(__spreadArray([], optionWidths.slice(0, i), true), [
            width
        ], false), optionWidths.slice(i + 1), true));
        // Set the width of the selector thumb to the width of the selected option
        if (options[i].key === selectedOption) {
            widthAnim.setValue(width);
        }
    }; };
    var sliderElement = (<Animated.View style={[styles.slider, { left: leftAnim, width: widthAnim }]}/>);
    return (<View style={[
            styles.tabs,
            fullWidth && styles.fullWidth,
            style,
            stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.root
        ]}>
      {sliderElement}
      {options.map(function (option, index) {
            var shouldHideSeparator = selectedOption === option.key ||
                // Hide separator right of the last option
                index === options.length - 1 ||
                // Hide separator right of an option if the next one is selected
                selectedOption === options[index + 1].key;
            return (<Fragment key={option.text}>
            <Pressable onLayout={setOptionWidth(index)} style={[
                    styles.tab,
                    stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.tab,
                    fullWidth && styles.tabFullWidth,
                    equalWidth && maxOptionWidth > 0 && { width: maxOptionWidth }
                ]} onPress={function () { return handleSelectOption(option.key); }}>
              <Text style={[
                    styles.text,
                    stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.text,
                    selectedOption === option.key && (stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.activeText)
                ]}>
                {option.text}
              </Text>
            </Pressable>
            {index !== options.length - 1 ? (<View style={[
                        styles.separator,
                        shouldHideSeparator && styles.hideSeparator
                    ]}/>) : null}
          </Fragment>);
        })}
    </View>);
};
