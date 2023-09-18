"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const BodyStyles_1 = __importDefault(require("./BodyStyles"));
const FontStyles_1 = __importDefault(require("./FontStyles"));
const Head = (props) => {
    return (<div>
      <div dangerouslySetInnerHTML={{
            __html: `
          <!--[if gte mso 15]>
            <xml>
              <o:OfficeDocumentSettings>
                <o:AllowPNG />
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          <![endif]-->
      `
        }}/>
      <meta charset={'UTF-8'}/>
      <meta http-equiv={'x-ua-compatible'} content={'IE=edge'}/>
      <meta name={'viewport'} content={'width=device-width, initial-scale=1'}/>
      <meta name={'x-apple-disable-message-reformatting'}/>
      <title>{props.title}</title>
      <FontStyles_1.default />
      <BodyStyles_1.default />
    </div>);
};
exports.default = Head;
