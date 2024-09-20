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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
import { useCallback, useEffect, useRef, useState } from 'react';
import { formatCollectionName, formatTrackName, formatUserName, isAudiusUrl, squashNewLines } from '@audius/common/utils';
import { ResolveApi } from '@audius/sdk';
import { css } from '@emotion/native';
import { View } from 'react-native';
import Autolink from 'react-native-autolink';
import { Text, TextLink } from '@audius/harmony-native';
import { audiusSdk } from 'app/services/sdk/audius-sdk';
var instanceOfTrackResponse = ResolveApi.instanceOfTrackResponse, instanceOfUserResponse = ResolveApi.instanceOfUserResponse, instanceOfPlaylistResponse = ResolveApi.instanceOfPlaylistResponse;
var Link = function (_a) {
    var children = _a.children, url = _a.url, other = __rest(_a, ["children", "url"]);
    var _b = useState(), unfurledContent = _b[0], setUnfurledContent = _b[1];
    useEffect(function () {
        if (isAudiusUrl(url) && !unfurledContent) {
            var fn = function () { return __awaiter(void 0, void 0, void 0, function () {
                var sdk, res;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, audiusSdk()];
                        case 1:
                            sdk = _a.sent();
                            return [4 /*yield*/, sdk.resolve({ url: url })];
                        case 2:
                            res = _a.sent();
                            if (res.data) {
                                if (instanceOfTrackResponse(res)) {
                                    setUnfurledContent(formatTrackName({ track: res.data }));
                                }
                                else if (instanceOfPlaylistResponse(res)) {
                                    setUnfurledContent(formatCollectionName({ collection: res.data[0] }));
                                }
                                else if (instanceOfUserResponse(res)) {
                                    setUnfurledContent(formatUserName({ user: res.data }));
                                }
                            }
                            return [2 /*return*/];
                    }
                });
            }); };
            fn();
        }
    }, [url, unfurledContent, setUnfurledContent]);
    return (<TextLink {...other} url={url}>
      {unfurledContent !== null && unfurledContent !== void 0 ? unfurledContent : children}
    </TextLink>);
};
export var UserGeneratedText = function (props) {
    var allowPointerEventsToPassThrough = props.allowPointerEventsToPassThrough, source = props.source, style = props.style, children = props.children, linkProps = props.linkProps, other = __rest(props, ["allowPointerEventsToPassThrough", "source", "style", "children", "linkProps"]);
    var linkContainerRef = useRef(null);
    var _a = useState({}), linkRefs = _a[0], setLinkRefs = _a[1];
    var _b = useState({}), links = _b[0], setLinks = _b[1];
    var _c = useState({}), linkLayouts = _c[0], setLinkLayouts = _c[1];
    var _d = useState(), linkContainerLayout = _d[0], setLinkContainerLayout = _d[1];
    useEffect(function () {
        var layouts = {};
        var linkKeys = Object.keys(links);
        // Measure the layout of each link
        linkKeys.forEach(function (key) {
            var linkRef = linkRefs[key];
            if (linkRef) {
                // Need to use `measureInWindow` instead of `onLayout` or `measure` because
                // android doesn't return the correct layout for nested text elements
                linkRef.measureInWindow(function (x, y, width, height) {
                    var _a;
                    layouts = __assign(__assign({}, layouts), (_a = {}, _a[key] = { x: x, y: y, width: width, height: height }, _a));
                    // If all the links have been measured, update state
                    if (linkKeys.length === Object.keys(layouts).length) {
                        setLinkLayouts(layouts);
                    }
                });
            }
        });
        if (linkContainerRef.current) {
            linkContainerRef.current.measureInWindow(function (x, y, width, height) {
                return setLinkContainerLayout({ x: x, y: y, width: width, height: height });
            });
        }
    }, [links, linkRefs, linkContainerRef]);
    // We let Autolink lay out each link invisibly, and capture their position and data
    var renderHiddenLink = useCallback(function (text, match, index) { return (<View onLayout={function () {
            setLinks(function (links) {
                var _a;
                return (__assign(__assign({}, links), (_a = {}, _a[index] = {
                    text: text,
                    match: match
                }, _a)));
            });
        }} ref={function (el) {
            if (el) {
                setLinkRefs(function (linkRefs) {
                    var _a;
                    if (linkRefs[index]) {
                        return linkRefs;
                    }
                    return __assign(__assign({}, linkRefs), (_a = {}, _a[index] = el, _a));
                });
            }
        }} 
    // Negative margin needed to handle View overflow
    style={css({ opacity: 0, marginTop: -3 })}>
        <Text {...other}>{text}</Text>
      </View>); }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []);
    var renderLink = useCallback(function (text, match) { return (<Link {...other} variant='visible' textVariant={other.variant} url={match.getAnchorHref()} {...linkProps}>
        {text}
      </Link>); }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []);
    var renderText = useCallback(function (text) { return (<Text suppressHighlighting {...other}>
        {text}
      </Text>); }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []);
    return (<View>
      <View pointerEvents={allowPointerEventsToPassThrough ? 'none' : undefined} ref={linkContainerRef}>
        <Autolink renderLink={allowPointerEventsToPassThrough ? renderHiddenLink : renderLink} renderText={renderText} email url style={[{ marginBottom: 3 }, style]} text={squashNewLines(children)}/>
      </View>
      {/* We overlay copies of each link on top of the invisible links */}
      <View style={{ position: 'absolute' }}>
        {Object.entries(links).map(function (_a) {
            var index = _a[0], _b = _a[1], text = _b.text, match = _b.match;
            var linkLayout = linkLayouts[index];
            return linkLayout && linkContainerLayout ? (<Link {...other} variant='visible' textVariant={other.variant} key={"".concat(linkLayout.x, " ").concat(linkLayout.y, " ").concat(index)} style={{
                    position: 'absolute',
                    top: linkLayout.y - linkContainerLayout.y,
                    left: linkLayout.x - linkContainerLayout.x
                }} url={match.getAnchorHref()} source={source} {...linkProps}>
              {text}
            </Link>) : null;
        })}
      </View>
    </View>);
};
