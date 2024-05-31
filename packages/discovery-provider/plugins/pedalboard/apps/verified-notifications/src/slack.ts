import { WebClient } from "@slack/web-api";

const slackToken = process.env.SLACK_TOKEN
const web = new WebClient(slackToken)

export const sendSlackMsg = (channel: string | undefined, header: string, body: any) => {
    if (channel === undefined) throw new Error("channel not defined in slack msg send")
    const msg = `${header} ${formatter(body)}`;
    return web.chat.postMessage({
        text: msg,
        channel,
    });
}

const formatter = (data: any) => {
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
