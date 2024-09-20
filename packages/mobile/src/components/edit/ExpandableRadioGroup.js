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
import { Children } from 'react';
import { ScrollView } from 'react-native';
import { Divider, RadioGroup } from '@audius/harmony-native';
export var ExpandableRadioGroup = function (props) {
    var children = props.children, other = __rest(props, ["children"]);
    var childCount = Children.count(children);
    return (<ScrollView>
      <RadioGroup pt='l' ph='xl' gap='xl' backgroundColor='white' {...other}>
        {Children.map(children, function (child, index) { return (<>
            {child}
            {child && index !== childCount - 1 ? <Divider /> : null}
          </>); })}
      </RadioGroup>
    </ScrollView>);
};
