var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { PureComponent, useEffect } from 'react';
import * as Sentry from '@sentry/react-native';
import { useToast } from 'app/hooks/useToast';
import { make, track } from 'app/services/analytics';
import { EventNames } from 'app/types/analytics';
var ErrorToast = function (props) {
    var error = props.error;
    // Do nothing other than trigger a toast when error changes
    var toast = useToast().toast;
    useEffect(function () {
        if (error) {
            console.error(error);
            toast({ content: 'Something went wrong', type: 'error' });
        }
    }, [toast, error]);
    return null;
};
var ErrorBoundary = /** @class */ (function (_super) {
    __extends(ErrorBoundary, _super);
    function ErrorBoundary() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = {
            error: null
        };
        return _this;
    }
    ErrorBoundary.prototype.componentDidCatch = function (error, errorInfo) {
        // On catch set the error state so it triggers a toast
        this.setState({ error: error === null || error === void 0 ? void 0 : error.message });
        Sentry.withScope(function (scope) {
            scope.setExtras(errorInfo);
            Sentry.captureException(error);
        });
        track(make({
            eventName: EventNames.APP_ERROR,
            message: error === null || error === void 0 ? void 0 : error.message
        }));
    };
    ErrorBoundary.prototype.render = function () {
        return (<>
        <ErrorToast error={this.state.error}/>
        {this.props.children}
      </>);
    };
    return ErrorBoundary;
}(PureComponent));
export default ErrorBoundary;
