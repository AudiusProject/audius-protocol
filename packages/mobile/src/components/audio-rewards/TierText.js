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
import { GradientText } from 'app/components/core';
var tierGradientMap = {
    none: {
        colors: undefined
    },
    bronze: {
        colors: ['rgba(141, 48, 8, 0.5)', 'rgba(182, 97, 11, 1)']
    },
    silver: {
        colors: ['rgba(179, 182, 185, 0.5)', 'rgba(189, 189, 189, 1)']
    },
    gold: {
        colors: ['rgba(231, 154, 7, 0.5)', 'rgba(236, 173, 11, 1)']
    },
    platinum: {
        colors: ['#B3ECF9', '#57C2D7']
    }
};
export var TierText = function (props) {
    var tier = props.tier, other = __rest(props, ["tier"]);
    return <GradientText {...other} colors={tierGradientMap[tier].colors}/>;
};
