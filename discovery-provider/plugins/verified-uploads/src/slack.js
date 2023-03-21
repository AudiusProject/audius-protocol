import { WebClient } from "@slack/web-api";

const Slack = () => {
  const { SLACK_TOKEN, SLACK_CHANNEL } = process.env;
  const web = new WebClient(SLACK_TOKEN);
  return {
    sendMsg: (header, body) => {
      const msg = `${header} ${formatter(body)}`;
      return web.chat.postMessage({
        text: msg,
        channel: SLACK_CHANNEL,
      });
    },
  };
};

const formatter = (data) => {
  const msg = [];
  for (const [key, value] of Object.entries(data)) {
    // omit any null entries of the track
    if (value != null) {
      msg.push(`${key}: ${value}`);
    }
  }
  const inner = msg.join("\n");
  return "```" + inner + "```";
};

export const slack = Slack();
