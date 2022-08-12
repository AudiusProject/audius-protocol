#!/usr/bin/env python3

import json
from os import path
from pprint import pprint

import click
import requests
from triggers import ensure_commit_on_master


@click.command()
@click.help_option("-h", "--help")
@click.option("-t", "--git-commit", help="Git commit to deploy from.", required=True)
@click.option(
    "-k",
    "--circle-api-key",
    help="Used when $CIRCLE_API_KEY is not set.",
    envvar="CIRCLE_API_KEY",
    required=True,
)
@click.option(
    "-u",
    "--slack-mentions-user",
    help="Used when $CIRCLE_SLACK_MENTIONS_USER is not set, for CircleCI @mentions",
    envvar="CIRCLE_SLACK_MENTIONS_USER",
    required=True,
)
def cli(git_commit, circle_api_key, slack_mentions_user):
    # only allow merged commits to be deployed
    ensure_commit_on_master(git_commit)

    # trigger a circleci job
    project = "audius-protocol"
    data = {
        "branch": "master",
        "parameters": {
            "sdk_release_commit": git_commit,
            "slack_mentions_user": slack_mentions_user,
        },
    }
    r = requests.post(
        f"https://circleci.com/api/v2/project/github/AudiusProject/{project}/pipeline",
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
    url = f"https://app.circleci.com/pipelines/github/AudiusProject/{project}/{pipeline_number}"
    print(f"\n{url}")


if __name__ == "__main__":
    # make --help message more "natural" by using bin/*.sh as the filename under Usage
    prog_name = path.basename(__file__).replace(".py", ".sh")
    cli(prog_name=prog_name)
