import { useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { IconCaretRight } from '@audius/harmony-native';
import { Divider, Text } from 'app/components/core';
import { useNavigation } from 'app/hooks/useNavigation';
import { makeStyles } from 'app/styles';
import { spacing } from 'app/styles/spacing';
import { useThemeColors } from 'app/utils/theme';
import { InputErrorMessage } from './InputErrorMessage';
import { Pill } from './Pill';
var useStyles = makeStyles(function (_a) {
    var spacing = _a.spacing;
    return ({
        content: {
            marginVertical: spacing(4),
            paddingHorizontal: spacing(4)
        },
        select: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginHorizontal: spacing(2)
        },
        value: {
            marginHorizontal: spacing(2)
        },
        optionPills: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginTop: spacing(2)
        },
        pill: {
            marginTop: spacing(2),
            marginRight: spacing(2)
        }
    });
});
export var ContextualMenu = function (props) {
    var label = props.label, value = props.value, menuScreenName = props.menuScreenName, stylesProp = props.styles, errorMessage = props.errorMessage, error = props.error, lastItem = props.lastItem, renderValueProp = props.renderValue;
    var styles = useStyles();
    var neutralLight4 = useThemeColors().neutralLight4;
    var navigation = useNavigation();
    var handlePress = useCallback(function () {
        navigation.navigate(menuScreenName);
    }, [navigation, menuScreenName]);
    var defaultRenderValue = function (value) {
        var values = typeof value === 'string' ? [value] : value;
        return (<View style={styles.optionPills}>
        {values.map(function (value, i) { return (<Pill key={"".concat(value, "-").concat(i)} style={styles.pill}>
            <Text fontSize='small' weight='demiBold'>
              {value}
            </Text>
          </Pill>); })}
      </View>);
    };
    var renderValue = renderValueProp !== null && renderValueProp !== void 0 ? renderValueProp : defaultRenderValue;
    var hasValue = !value
        ? false
        : typeof value === 'string'
            ? value
            : value.length !== 0;
    return (<TouchableOpacity onPress={handlePress} style={stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.root}>
      <Divider style={stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.divider}/>
      <View style={[styles.content, stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.content]}>
        <View style={styles.select}>
          <Text fontSize='large' weight='demiBold'>
            {label}
          </Text>
          <IconCaretRight fill={neutralLight4} height={spacing(4)} width={spacing(4)}/>
        </View>
        {hasValue ? (<View style={styles.value}>{renderValue(value)}</View>) : null}
        {error && errorMessage ? (<InputErrorMessage message={errorMessage}/>) : null}
      </View>
      {lastItem ? <Divider style={stylesProp === null || stylesProp === void 0 ? void 0 : stylesProp.divider}/> : null}
    </TouchableOpacity>);
};
