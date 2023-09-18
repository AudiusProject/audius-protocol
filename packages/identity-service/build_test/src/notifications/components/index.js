"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = __importDefault(require("react-dom/server"));
const react_1 = __importDefault(require("react"));
// ESLint has trouble understanding these imports
const Head_1 = __importDefault(require("./Head")); // eslint-disable-line
const Body_1 = __importDefault(require("./Body")); // eslint-disable-line
const NotificationEmail = (props) => {
    return (<html>
      <Head_1.default title={props.title}/>
      <Body_1.default {...props}/>
    </html>);
};
const renderNotificationsEmail = (props) => {
    return server_1.default.renderToString(<NotificationEmail {...props}/>);
};
module.exports = renderNotificationsEmail;
