import { createContext, useContext } from 'react';
import { AudiusHomeLink } from './AudiusHomeLink';
import { BackButton } from './BackButton';
export var defaultScreenOptions = {
    animation: 'default',
    fullScreenGestureEnabled: true,
    headerShadowVisible: false,
    headerTitleAlign: 'center',
    headerBackVisible: false,
    headerLeft: function (props) {
        var canGoBack = props.canGoBack;
        if (canGoBack)
            return <BackButton />;
        return null;
    },
    title: '',
    headerTitle: function () { return <AudiusHomeLink />; }
};
export var ScreenOptionsContext = createContext({ options: defaultScreenOptions, updateOptions: function () { } });
export var useScreenOptions = function () {
    var _a;
    // These are managed via useState in SignOnStack
    var _b = (_a = useContext(ScreenOptionsContext)) !== null && _a !== void 0 ? _a : {}, options = _b.options, updateOptions = _b.updateOptions;
    return { options: options, updateOptions: updateOptions };
};
