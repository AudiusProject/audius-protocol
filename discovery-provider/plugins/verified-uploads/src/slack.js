import { WebClient } from "@slack/web-api";

export default (token, channel) => {
  const web = new WebClient(token);
  return {
    sendMsg: (msg) =>
      web.chat.postMessage({
        text: msg,
        channel: channel,
      }),
  };
};
