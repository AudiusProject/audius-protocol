#!/usr/bin/env bash

import json
from os import getenv

import click
import requests


@click.command()
@click.option("-t", "--git-tag")
def cli(git_tag):
    org = "AudiusProject"
    repo = "audius-project"
    branch = "master"
    data = {"branch": branch, "parameters": {"sdk_release_tag": git_tag}}
    r = requests.post(
        f"https://circleci.com/api/v2/project/github/{org}/{repo}/pipeline",
        headers={"Content-Type": "application/json"},
        auth=(getenv("CIRCLE_API_KEY"),),
        data=json.dumps(data),
        allow_redirects=True,
    )


if __name__ == "__main__":
    cli()
