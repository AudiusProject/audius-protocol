import { useCallback, useEffect, useRef } from 'react';
import { castActions } from '@audius/common/store';
import { requireNativeComponent, NativeEventEmitter, NativeModules } from 'react-native';
import { useDispatch } from 'react-redux';
var setIsCasting = castActions.setIsCasting;
var AIRPLAY_PORT_TYPE = 'AirPlay';
var AirplayViewManager = requireNativeComponent('AirplayView');
var AirplayEvent = NativeModules.AirplayEvent;
var airplayEventListener = new NativeEventEmitter(AirplayEvent);
export var useAirplay = function () {
    var openAirplayDialog = useCallback(function () {
        var airplay = NativeModules.AirplayViewManager;
        airplay.click();
    }, []);
    return { openAirplayDialog: openAirplayDialog };
};
/**
 * An airplay component that talks to the native layer and
 * lets the user broadcast and receive information from
 * a native AVRoutePickerView.
 *
 * Unlike other casting (e.g. chromecast), the Airplay
 * interface requires a native component to be silently rendered.
 * There may be other ways to do this, but documentation
 * for a react-native bridge is quite sparse.
 * See the implementation of AirplayViewManager.m in the ios
 * codebase.
 */
var Airplay = function () {
    var listenerRef = useRef(null);
    var dispatch = useDispatch();
    useEffect(function () {
        // On mount, we start scanning the network for airplay devices
        // and listen for changes to `deviceConnected`
        AirplayEvent.startScan();
        listenerRef.current = airplayEventListener.addListener('deviceConnected', function (device) {
            console.info("Connected to device ".concat(JSON.stringify(device)));
            if (device &&
                device.devices &&
                device.devices[0] &&
                device.devices[0].portType &&
                device.devices[0].portType === AIRPLAY_PORT_TYPE) {
                dispatch(setIsCasting({ isCasting: true }));
            }
            else {
                dispatch(setIsCasting({ isCasting: false }));
            }
        });
        return function () {
            var _a, _b;
            (_b = (_a = listenerRef.current) === null || _a === void 0 ? void 0 : _a.stop) === null || _b === void 0 ? void 0 : _b.call(_a);
        };
    }, [listenerRef, dispatch]);
    return <AirplayViewManager />;
};
export default Airplay;
