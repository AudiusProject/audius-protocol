#!/usr/bin/env python3

from datetime import datetime
import json
from os import getenv
from pprint import pformat

import requests
from flask import Flask, request

app = Flask(__name__)
app.debug = True

CIRCLE_API_KEY = getenv("CIRCLE_API_KEY")
DISCORD_WEBHOOK = getenv("DISCORD_WEBHOOK")
SLASH_AMOUNT = getenv("SLASH_AMOUNT")


def trigger_circle_ci_job(parameters):
    project = "audius-protocol"
    data = {
        "branch": "main",
        "parameters": parameters,
    }
    r = requests.post(
        f"https://circleci.com/api/v2/project/github/AudiusProject/{project}/pipeline",
        allow_redirects=True,
        auth=(CIRCLE_API_KEY, ""),
        data=json.dumps(data),
        headers={"Content-Type": "application/json"},
    )
    response = r.json()
    app.logger.error(pformat(response))


def host_to_signer(host):
    r = requests.get(
        f"https://{host}/health_check",
        headers={"Content-Type": "application/json"},
    )
    response = r.json()
    return response["signer"]


@app.route("/", methods=["POST"])
def index():
    request_data = request.get_json()
    app.logger.error(pformat(request_data))

    with open("audius-protocol/alerts.json") as f:
        alerts = json.load(f)

    for alert in request_data["alerts"]:
        alert_name = alert['labels']['alertname']
        starts_at = datetime.strptime(alert['startsAt'].split('.')[0], '%Y-%m-%dT%H:%M:%S')
        alert_life = datetime.utcnow() - starts_at

        level = "notification"
        if alert_life.days > 2:
            level = "critical"

        labels = alert['valueString'].lstrip('[').rstrip(']').strip().split()
        value = labels[-1].split('=')[1]
        labels = labels[0:-1]

        # TODO: extract from labels
        host = "discoveryprovider5.staging.audius.co"
        threshold = "threshold"

        signer = host_to_signer(host)

        for discord_handle in alerts[signer]:
            content = []
            if level == "critical":
                content += [
                    f"Host '{host}' has fallen outside of desired SLAs.",
                    f"Slashing '{signer}' amount: {SLASH_AMOUNT}",
                ]
            else:
                content += [
                    f"Host '{host}' falling outside of desired SLAs.",
                ]
            content += [
                f"Alertname: {alert_name}",
                f"Threshold: {threshold}",
                f"Value: {value}",
            ]
            data = {"content": "\n".join(content), "embeds": None, "attachments": []}

            # TODO: can we send Discord DMs?
            app.logger.error(f"Discord handle: {discord_handle}")
            app.logger.error(pformat(data))
            # r = requests.post(
            #     DISCORD_WEBHOOK,
            #     data=json.dumps(data),
            #     headers={"Content-Type": "application/json"},
            # )
            # response = r.text
            # app.logger.info(pformat(response))

        if level == "critical":
            trigger_circle_ci_job(
                {
                    "reservations": "asdf",
                    # "slash_address": signer,
                    # "slash_amount": SLASH_AMOUNT,
                }
            )

    return {}, 200


if __name__ == "__main__":
    app.run(debug=True)
