#!/usr/bin/env python3

import json
from pprint import pprint

import click
import requests
from triggers.utils import ensure_tag_on_master


@click.command()
@click.help_option("-h", "--help")
@click.option("-t", "--git-tag", help="Git tag or commit to deploy from", required=True)
@click.option(
    "-k",
    "--circle-api-key",
    help="Used when $CIRCLE_API_KEY is not set",
    envvar="CIRCLE_API_KEY",
    required=True,
)
def cli(git_tag, circle_api_key):
    # only allow merged git_tags to be deployed
    ensure_tag_on_master(git_tag)

    # trigger a circleci job
    org = "AudiusProject"
    project = "audius-protocol"
    branch = "jc-inf-209"
    data = {"branch": branch, "parameters": {"sdk_release_tag": git_tag}}
    r = requests.post(
        f"https://circleci.com/api/v2/project/github/{org}/{project}/pipeline",
        allow_redirects=True,
        auth=(circle_api_key, ""),
        data=json.dumps(data),
        headers={"Content-Type": "application/json"},
    )
    response = r.json()

    # print response messages
    pprint(response)

    # print quick url
    pipeline_number = response["number"]
    url = f"https://app.circleci.com/pipelines/github/{org}/{project}/{pipeline_number}"
    print(f"\n{url}")


if __name__ == "__main__":
    cli(prog_name="deploy-sdk.sh")
