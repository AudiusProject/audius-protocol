#!/usr/bin/env python3

import json
import logging
from pprint import pprint
from subprocess import PIPE, Popen

import click
import requests

logging.basicConfig(
    format="%(levelname)-8s [%(asctime)s] %(message)s", level=logging.INFO
)
logger = logging.getLogger("cli")


# execute shell command and capture the output
def run_cmd(cmd, exit_on_error=True, msg=None):
    logger.debug(msg if msg else f"< {cmd}")
    sp = Popen(cmd.split(" "), stdout=PIPE, stderr=PIPE)
    stdout, stderr = sp.communicate()
    stdout = stdout.strip().decode()
    stderr = stderr.strip().decode()

    if stdout:
        logger.debug(stdout)
    if stderr:
        logger.debug(stdout)
        logger.debug(stderr)
        if "Could not get object for" in stderr:
            logger.info(
                "FIX: Run `git fetch` within your local audius-protocol repo, or the branch was deleted."
            )
        if exit_on_error:
            exit(1)
        else:
            raise RuntimeError("Previous command had stderr output.")

    return stdout


def standardize_branch(branches):
    for branch in branches:
        if "master" in branch or "remotes/origin/HEAD" in branch:
            return "master"
        if "tags/@audius" in branch or "remotes/origin/release" in branch:
            return "release"
    return branch


def check_tag(tag):
    try:
        branches = run_cmd(
            f"git name-rev --name-only {tag}", exit_on_error=False
        ).split("\n")
    except:
        branches = ["missing"]

    branch = standardize_branch(branches)

    if branch not in ("master", "release"):
        print(f"Commit not found on master, nor release branches: {branch}")
        exit(1)


@click.command()
@click.option("-t", "--git-tag", required=True)
@click.option("-k", "--circle-api-key", envvar="CIRCLE_API_KEY", required=True)
def cli(git_tag, circle_api_key):
    check_tag(git_tag)
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
