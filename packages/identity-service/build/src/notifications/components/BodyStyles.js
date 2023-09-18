"use strict";
const React = require('react');
const BodyStyles = () => {
    return (<style type='text/css' dangerouslySetInnerHTML={{ __html: `
    html {
      margin: 0;
      padding: 0;
    }

    body {
      margin: 0;
      padding: 0;
    }

    p {
      margin: 1em 0;
      padding: 0;
    }

    a {
      color: #8F2CE8;
    }

    table {
      border-collapse: collapse;
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      display: block;
      margin: 0;
      padding: 0;
    }

    img,
    a img {
      border: 0;
      height: auto;
      outline: none;
      text-decoration: none;
    }

    h2 {
      color: #858199;
      font-size: 32px;
      font-weight: bold;
      letter-spacing: .02px;
      text-align: center;
      margin: 0 auto;
    }

    h3 {
      color: #C3C0CC;
      font-size: 16px;
      font-weight: bold;
      letter-spacing: .02px;
      line-height: 25px;
      text-align: center;
      /* margin-bottom: 10px; */
    }

    .pink {
      color: #E000DB;
    }

    .purple {
      color: #7E1BCC;
    }

    body,
    #bodyTable,
    #bodyCell {
      margin: 0;
      padding: 0;
      width: 100%;
      background: #FFFFFF;
      font-family: "Avenir Next LT Pro", Helvetica, Arial, sans-serif;
    }

    #outlook a {
      padding: 0;
    }

    img {
      -ms-interpolation-mode: bicubic;
    }

    table {
      mso-table-lspace: 0;
      mso-table-rspace: 0;
    }

    .ReadMsgBody {
      width: 100%;
    }

    .ExternalClass {
      width: 100%;
    }

    p,
    a,
    li,
    td,
    blockquote {
      mso-line-height-rule: exactly;
    }

    p,
    a,
    li,
    td,
    body,
    table,
    blockquote {
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
    }

    .button {
      background: #E000DB;
      font-size: 24px !important;
      color: #FFFFFF !important;
      font-weight: 700 !important;
      letter-spacing: 0.03px !important;
      text-decoration: none !important;
      user-select: none;
      cursor: pointer;
      line-height: 29px;
      border-radius: 8px;
      text-align: center;
      display: inline-block;
      padding: 16px 32px;
    }

    .ExternalClass,
    .ExternalClass p,
    .ExternalClass td,
    .ExternalClass div,
    .ExternalClass span,
    .ExternalClass font {
      line-height: 100%;
    }

    .templateImage {
      height: auto;
      max-width: 564px;
    }

    #footerContent {
      padding-top: 27px;
      padding-bottom: 18px;
    }

    #templateBody {
      padding-right: 94px;
      padding-left: 94px;
    }

    .notificationsContainer {
      max-width: 396px;
      margin-bottom: 32px;
    }
      
    .seeMoreOnAudius {
      padding: 8px 24px;
      border-radius: 17px;
      background-color: #7E1BCC;
      margin-bottom: 0px auto 32px;
    color: #FFFFFF;
    font-family: "Avenir Next LT Pro";
    font-size: 14px;
    font-weight: bold;
    letter-spacing: 0.15px;
    text-align: center;
    }

      
    .footerContainer {
      width: 100%;
    }

    .footerContainer table {
      table-layout: fixed;
    }

    #templateHeader {
      background-color: #FFFFFF;
      background-image: none;
      background-repeat: no-repeat;
      background-position: center;
      background-size: cover;
      border-top: 0;
      border-bottom: 0;
      padding-bottom: 0;
      border-radius: 8px 8px 0px 0px;
    }

    #templateHeader a,
    #templateHeader p a {
      color: #237A91;
      font-weight: normal;
      text-decoration: underline;
    }

    #templateBody {
      background-color: #FFFFFF;
      margin-bottom: 44px;
      padding-bottom: 36px;
      height: 100%;
      width: 100%;
      max-width: 720px;
      border-radius: 0 0 8px 8px;
      box-shadow: 0 16px 20px 0 rgba(232, 228, 234, 0.5);
    }

    #templateBody,
    #templateBody p {
      color: #858199;
      font-size: 18px;
      letter-spacing: .02px;
      line-height: 25px;
      text-align: center;
    }

    #templateBody a,
    #templateBody p a {
      color: #7E1BCC;
      font-weight: normal;
      text-decoration: underline;
    }

    #templateFooter {
      border-top: 1px solid #DAD9E0;
      width: 100%;
      padding: 0;
      background-color: #fbfbfc;
    }

    #socialBar img {
      height: 24px;
      width: 24px;
      padding: 0 20px;
    }
    #socialBar a:first-child img {
      padding: 0 20px 0 0;
    }

    #socialBar,
    #socialBar p {
      color: #C2C0CC;
      font-size: 16px;
      font-weight: bold;
      letter-spacing: .2px;
      text-align: center;
    }

    #templateFooter,
    #templateFooter p {
      color: #858199;
      font-family: "Gilroy", "Avenir Next LT Pro", Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 20px;
      text-align: center;
    }

    #templateFooter a,
    #templateFooter p a {
      vertical-align: bottom;
      color: #656565;
      font-weight: normal;
      text-decoration: underline;
    }

    #utilityBar {
      border: 0;
      padding-top: 9px;
      padding-bottom: 9px;
    }

    #utilityBar,
    #utilityBar p {
      color: #C2C0CC;
      font-size: 12px;
      line-height: 150%;
      text-align: center;
    }

    #utilityBar a,
    #utilityBar p a {
      color: #C2C0CC;
      font-weight: normal;
      text-decoration: underline;
    }

    .arrowIcon {
      height:8px;
      width:8px;
      margin-left:4px;
      display:inline-block;
      opacity: 0.5;
    }

    .arrowIcon path {
      fill: #858199;
    }

    @media (max-width: 720px) {

      body,
      table,
      td,
      p,
      a,
      li,
      blockquote {
        -webkit-text-size-adjust: none !important;
      }
    }

    @media (max-width: 720px) {
      .button {
        padding: 16px 24px;
      }
    }

    @media (max-width: 720px) {
      body {
        width: 100% !important;
        min-width: 100% !important;
      }
    }

    @media (max-width: 720px) {
      .templateImage {
        width: 100% !important;
      }
    }

    @media (max-width: 720px) {
      .columnContainer {
        max-width: 100% !important;
        width: 100% !important;
      }
    }

    @media (max-width: 720px) {
      .mobileHide {
        display: none;
      }
    }

    @media (max-width: 720px) {
      .utilityLink {
        display: block;
        padding: 9px 0;
      }
    }

    @media (max-width: 720px) {
      h1 {
        font-size: 22px !important;
        line-height: 175% !important;
      }
    }

    @media (max-width: 720px) {
      h4 {
        font-size: 16px !important;
        line-height: 175% !important;
      }
    }

    @media (max-width: 720px) {
      p {
        font-size: 16px !important;
      }
    }

    @media (max-width: 720px) {

      #templateHeader,
      #templateHeader p {
        font-size: 16px !important;
        line-height: 150% !important;
      }
    }

    @media (max-width: 720px) {
      #bodyCell {
        text-align: center;
      }
    }

    @media (max-width: 720px) {
      .templateContainer {
        display: table !important;
        max-width: 384px !important;
        width: 80% !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }
    }

    @media (max-width: 720px) {
      #templateBody {
        padding-right: 13px !important;
        padding-left: 13px !important;
      }
    }

    @media (max-width: 720px) {

      #templateBody,
      #templateBody p {
        font-size: 16px !important;
        line-height: 150% !important;
      }
    }

    @media (max-width: 720px) {
      .footerContainer table td {
        /* display: block; */
      }
    }

    @media (max-width: 720px) {

      #templateFooter,
      #templateFooter p {
        font-size: 14px !important;
        line-height: 150% !important;
      }
    }

    @media (max-width: 720px) {

      #socialBar,
      #socialBar p {
        font-size: 14px !important;
        line-height: 150% !important;
      }
    }

    @media (max-width: 720px) {

      #utilityBar,
      #utilityBar p {
        font-size: 14px !important;
        line-height: 150% !important;
      }
    }
  ` }}/>);
};
module.exports = BodyStyles;
