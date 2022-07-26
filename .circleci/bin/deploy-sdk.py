#!/usr/bin/env python3

import json
from pprint import pprint

import click
import requests


@click.command()
@click.option("-t", "--git-tag", required=True)
@click.option("-k", "--circle-api-key", envvar="CIRCLE_API_KEY", required=True)
def cli(git_tag, circle_api_key):
    org = "AudiusProject"
    project = "audius-protocol"
    branch = "master"
    data = {"branch": branch, "parameters": {"sdk_release_tag": git_tag}}
    r = requests.post(
        f"https://circleci.com/api/v2/project/github/{org}/{project}/pipeline",
        headers={"Content-Type": "application/json"},
        auth=(circle_api_key, ""),
        data=json.dumps(data),
        allow_redirects=True,
    )
    response = r.json()
    pprint(response)

    pipeline_number = response["number"]
    url = f"https://app.circleci.com/pipelines/github/AudiusProject/audius-protocol/{pipeline_number}"
    print(f"\n{url}")


if __name__ == "__main__":
    cli()
