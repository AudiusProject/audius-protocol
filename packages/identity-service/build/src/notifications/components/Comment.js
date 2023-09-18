"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = __importDefault(require("react-dom/server"));
const react_1 = __importDefault(require("react"));
const WrapComponent = (props) => {
    const renderedChildren = server_1.default.renderToStaticMarkup(props.children);
    return <div dangerouslySetInnerHTML={{
            __html: `
    <!--[if ${props.if}]>${props.extraWrapper}<![endif]-->
    ${renderedChildren}
    <!--[if ${props.if}]>${props.endExtraWrapper}</td></tr></table></center><![endif]-->
  `
        }}/>;
};
exports.default = WrapComponent;
