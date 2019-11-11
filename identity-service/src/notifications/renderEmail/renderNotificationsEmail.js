"use strict";

var ReactDOMServer = require('react-dom/server');

var Email = require('./components');

var renderNotificationsEmail = function renderNotificationsEmail() {
  var emailElement = React.createElement(Email, null);
  return ReactDOMServer.renderToString(emailElement);
};

module.exports = renderNotificationsEmail;
var x = renderNotificationsEmail();
console.log(x);