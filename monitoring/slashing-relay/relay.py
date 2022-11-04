#!/usr/bin/env python3

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
    # trigger a circleci job
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

    # print response messages
    app.logger.error(pformat(response))

    # print quick url
    pipeline_number = response["number"]
    url = f"https://app.circleci.com/pipelines/github/AudiusProject/{project}/{pipeline_number}"
    app.logger.info(f"\n{url}")


def host_to_signer(host):
    r = requests.get(
        f"https://{host}/health_check",
        headers={"Content-Type": "application/json"},
    )
    response = r.json()
    return response["data"]["signer"]


@app.route("/", methods=["POST"])
def index():
    request_data = request.get_json()

    with open("audius-protocol/alerts.json") as f:
        alerts = json.load(f)

    for alert in request_data["alerts"]:
        alert_name = alert['labels']['alertname']
        app.logger.error(alert["labels"]["instance"])
        labels = alert['valueString'].lstrip('[').rstrip(']').strip().split()
        value = labels[-1].split('=')[1]
        labels = labels[0:-1]
        app.logger.error(value)
        app.logger.error(labels)

        # signer = host_to_signer(host)

        signer = "signer"
        level = "none"
        host = "host"
        alert_name = "alert_name"
        threshold = "threshold"
        value = "value"

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
            app.logger.debug(pformat(data))
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
