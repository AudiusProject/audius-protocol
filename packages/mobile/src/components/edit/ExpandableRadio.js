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
import { useContext } from 'react';
import { Radio, RadioGroupContext, Text } from '@audius/harmony-native';
export var ExpandableRadio = function (props) {
    var description = props.description, checkedContent = props.checkedContent, radioProps = __rest(props, ["description", "checkedContent"]);
    var value = radioProps.value;
    var currentValue = useContext(RadioGroupContext).value;
    var checked = value === currentValue;
    return (<Radio size='large' {...radioProps}>
      {checked ? (<>
          {description ? <Text>{description}</Text> : null}
          {checkedContent || null}
        </>) : null}
    </Radio>);
};
