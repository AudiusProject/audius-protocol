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
import { useCallback, useState } from 'react';
import { trimToAlphaNumeric } from '@audius/common/utils';
import { uniq } from 'lodash';
import { View } from 'react-native';
import { IconSave } from '@audius/harmony-native';
import { makeStyles } from 'app/styles';
import { useThemeColors } from 'app/utils/theme';
import { Text } from './Text';
import { TextInput } from './TextInput';
var useStyles = makeStyles(function (_a) {
    var palette = _a.palette, spacing = _a.spacing, typography = _a.typography;
    return ({
        tags: {
            flexDirection: 'row',
            flexWrap: 'wrap'
        },
        tag: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: palette.secondary,
            paddingHorizontal: spacing(2),
            paddingVertical: spacing(1),
            marginRight: spacing(1),
            marginVertical: 2,
            borderRadius: 2
        },
        tagText: {
            textTransform: 'uppercase',
            fontSize: typography.fontSize.xs,
            fontFamily: typography.fontByWeight.bold,
            color: palette.staticWhite
        },
        placeholderTag: {
            backgroundColor: palette.secondaryLight2
        },
        placeholderText: {
            marginRight: spacing(1)
        },
        input: {
            marginVertical: spacing(1)
        }
    });
});
var emptyTags = [];
export var TagInput = function (props) {
    var _a;
    var value = props.value, onChangeText = props.onChangeText, placeholder = props.placeholder, onFocus = props.onFocus, onBlur = props.onBlur, maxTags = props.maxTags, other = __rest(props, ["value", "onChangeText", "placeholder", "onFocus", "onBlur", "maxTags"]);
    var _b = useState(''), inputValue = _b[0], setInputValue = _b[1];
    var _c = useState(false), isFocused = _c[0], setIsFocused = _c[1];
    var staticWhite = useThemeColors().staticWhite;
    var styles = useStyles();
    var tags = value === '' ? emptyTags : (_a = value === null || value === void 0 ? void 0 : value.split(',')) !== null && _a !== void 0 ? _a : emptyTags;
    var tagElements = tags === null || tags === void 0 ? void 0 : tags.map(function (tag, index) { return (<View key={"".concat(tag, "-").concat(index)} style={styles.tag}>
      <Text style={styles.tagText}>{tag}</Text>
    </View>); });
    var startAdornment = tagElements ? (<View style={styles.tags}>
      {tagElements}
      {placeholder && !isFocused ? (<View style={[styles.tag, styles.placeholderTag]}>
          <Text style={[styles.tagText, styles.placeholderText]}>
            {placeholder}
          </Text>
          <IconSave fill={staticWhite} height={12} width={12}/>
        </View>) : null}
    </View>) : null;
    var tagCount = tags.length;
    var nearLimit = (7.0 / 8.0) * maxTags;
    var tagCountColor = tagCount < nearLimit
        ? 'neutralLight4'
        : tagCount < maxTags
            ? 'warning'
            : 'error';
    var endAdornment = (<Text variant='body' color={tagCountColor}>
      {tagCount}/10
    </Text>);
    var handleChangeText = useCallback(function (value) {
        if (!value.includes(' ') && tagCount !== maxTags) {
            setInputValue(value);
        }
    }, [tagCount, maxTags]);
    var handleAddTag = useCallback(function () {
        onChangeText === null || onChangeText === void 0 ? void 0 : onChangeText(uniq(__spreadArray(__spreadArray([], tags, true), [trimToAlphaNumeric(inputValue)], false)).join(','));
        setInputValue('');
    }, [inputValue, onChangeText, tags]);
    var handleFocus = useCallback(function (e) {
        onFocus === null || onFocus === void 0 ? void 0 : onFocus(e);
        setIsFocused(true);
    }, [onFocus]);
    var handleBlur = useCallback(function (e) {
        onBlur === null || onBlur === void 0 ? void 0 : onBlur(e);
        if (inputValue) {
            handleAddTag();
        }
        setIsFocused(false);
    }, [onBlur, inputValue, handleAddTag]);
    var handleKeyPress = useCallback(function (e) {
        var keyValue = e.nativeEvent.key;
        var removeTagKeys = ['Backspace'];
        var addTagKeys = [' ', ','];
        if (!inputValue && removeTagKeys.includes(keyValue)) {
            onChangeText === null || onChangeText === void 0 ? void 0 : onChangeText(tags.slice(0, -1).join(','));
        }
        else if (inputValue && addTagKeys.includes(keyValue)) {
            handleAddTag();
        }
    }, [inputValue, tags, onChangeText, handleAddTag]);
    var handleSubmitEditing = useCallback(function () {
        if (inputValue) {
            handleAddTag();
        }
    }, [inputValue, handleAddTag]);
    return (<TextInput value={inputValue} onChangeText={handleChangeText} onKeyPress={handleKeyPress} startAdornment={startAdornment} endAdornment={endAdornment} returnKeyType='next' blurOnSubmit={!inputValue} onSubmitEditing={handleSubmitEditing} onFocus={handleFocus} onBlur={handleBlur} styles={{ input: styles.input }} {...other}/>);
};
