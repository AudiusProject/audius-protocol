import { WebClient } from "@slack/web-api";

export default () => {
  const { SLACK_TOKEN, SLACK_CHANNEL } = process.env;
  const web = new WebClient(SLACK_TOKEN);
  return {
    sendMsg: (msg) =>
      web.chat.postMessage({
        text: msg,
        channel: SLACK_CHANNEL,
      }),
  };
};
