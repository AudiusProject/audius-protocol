#!/usr/bin/env python3

import json
from os import getenv

import requests
from flask import Flask

app = Flask(__name__)

CIRCLE_API_KEY = getenv("CIRCLE_API_KEY")
DISCORD_WEBHOOK = getenv("DISCORD_WEBHOOK")
SLASH_AMOUNT = getenv("SLASH_AMOUNT")


def trigger_circle_ci_job(parameters):
    # trigger a circleci job
    project = "audius-protocol"
    data = {
        "branch": "master",
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
    pprint(response)

    # print quick url
    pipeline_number = response["number"]
    url = f"https://app.circleci.com/pipelines/github/AudiusProject/{project}/{pipeline_number}"
    print(f"\n{url}")


def host_to_signer(host):
    r = requests.get(
        f"https://{host}/health_check",
        headers={"Content-Type": "application/json"},
    )
    response = r.json()
    return response["data"]["signer"]


@app.route("/", methods=["POST"])
def index():
    host = request.form["host"]
    alert_name = request.form["alert_name"]
    threshold = request.form["threshold"]
    value = request.form["value"]
    level = request.form["level"]

    signer = host_to_signer(host)

    with open(f"audius-protocol/alerts.json") as f:
        alerts = json.load(f)
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
            r = requests.post(
                DISCORD_WEBHOOK,
                data=json.dumps(data),
                headers={"Content-Type": "application/json"},
            )
            response = r.json()

            # print response messages
            pprint(response)
        
    if level == "critical":
        trigger_circle_ci_job(
            {
                "slash_address": signer,
            }
        )
