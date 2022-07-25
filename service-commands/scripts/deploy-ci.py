#!/usr/bin/env python3

import logging
from os import system
from pprint import pprint
from subprocess import PIPE, Popen

import click
import requests

logging.basicConfig(
    format="%(levelname)-8s [%(asctime)s] %(message)s", level=logging.INFO
)
logger = logging.getLogger("cli")


environments = ["staging"]
services = ["all", "discovery", "content"]
content_nodes = [
    "stage-creator-4",  # canary
    "stage-creator-5",
    "stage-creator-6",
    "stage-creator-7",
    "stage-creator-8",
    "stage-creator-9",
    "stage-creator-10",
    "stage-creator-11",
    "stage-user-metadata",
]
discovery_nodes = [
    "stage-discovery-1",
    "stage-discovery-2",
    "stage-discovery-3",
    "stage-discovery-4",  # canary
    "stage-discovery-5",
]
all_nodes = content_nodes + discovery_nodes

FORCE_INSTRUCTIONS = "INSTRUCTIONS GO HERE."


# like run_cmd with msg formatting tweaks
def ssh(host, cmd, exit_on_error=True):
    return run_cmd(
        f"ssh {host} -- {cmd}",
        msg=f">> {host}: {cmd}",
        exit_on_error=exit_on_error,
    )


# execute shell command and capture the output
def run_cmd(cmd, exit_on_error=True, msg=None):
    logger.info(msg if msg else f"< {cmd}")
    sp = Popen(cmd.split(" "), stdout=PIPE, stderr=PIPE)
    stdout, stderr = sp.communicate()
    stdout = stdout.strip().decode()
    stderr = stderr.strip().decode()

    if stdout:
        logger.info(stdout)
    if stderr:
        logger.info(stdout)
        logger.error(stderr)
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
        if "remotes/origin/master" in branch:
            return "master"
        if "tags/@audius" in branch:
            return "release"
    return branch


def generate_deploy_list(service, hosts):
    deploy_list = []
    if service in ["all", "content"]:
        deploy_list += content_nodes
    if service in ["all", "discovery"]:
        deploy_list += discovery_nodes

    # make sure hosts is not a superset of deploy_list
    for host in hosts:
        if host not in deploy_list:
            logger.error(f"'{host}' not found within service nodes for '{service}'")
            logger.error("Did you mean to use both -s and -h?")
            exit(1)

    # only deploy the subset of hosts
    if hosts:
        deploy_list = hosts

    return deploy_list


def generate_release_tags(deploy_list):
    release_tags = {}
    for host in deploy_list:
        output = ssh(host, "grep TAG audius-docker-compose/*/.env")
        tag = output.split()[0].split("=")[1].strip("'")

        try:
            branches = run_cmd(
                f"git name-rev --name-only {tag}", exit_on_error=False
            ).split("\n")
        except:
            branches = ["missing"]

        branch = standardize_branch(branches)
        release_tags[host] = {
            "branch": branch,
            "tag": tag,
        }
        if branch not in ("master", "release", "missing"):
            author, commit_date = run_cmd(f"git log --format='%an|%ci' {tag}^!").split(
                "|"
            )
            release_tags[host] = {
                "author": author,
                "commit_date": commit_date,
                "branch": branch,
                "tag": tag,
            }
        if branch == "missing":
            r = requests.get(
                f"https://api.github.com/repos/AudiusProject/audius-protocol/git/commits/{tag}",
                headers={
                    "Accept": "application/vnd.github+json",
                    # f"Authorization": "token {token}",  # required when performing too many requests
                },
            )
            r = r.json()
            release_tags[host] = {
                "author": r["author"]["name"],
                "branch": branch,
                "commit_date": commit_date,
                "tag": tag,
                "url": r["html_url"],
            }
    return release_tags


def display_release_tags(
    release_tags,
    deploy_list,
    affected_hosts=None,
    skipped_hosts=None,
    failed_hosts=None,
):
    if not affected_hosts and not skipped_hosts:
        key = "pre-deploy"
        logging_messages = ["Current state:", "Upgrading:", "Skipping:"]
    else:
        key = "post-deploy"
        logging_messages = ["New state:", "Upgraded:", "Skipped:"]

    release_tags[key] = generate_release_tags(deploy_list)
    logger.info(logging_messages[0])
    pprint(release_tags, sort_dicts=False)

    if not affected_hosts and not skipped_hosts:
        affected_hosts = []
        skipped_hosts = {}
        for host, metadata in release_tags[key].items():
            if metadata["branch"] in ("master", "release"):
                affected_hosts.append(host)
            else:
                skipped_hosts[host] = metadata

    logging.info(logging_messages[1])
    pprint(affected_hosts)

    logging.error(logging_messages[2])
    pprint(skipped_hosts)
    logging.info(FORCE_INSTRUCTIONS)

    if failed_hosts:
        logging.error("See logs for the following failed hosts:")
        pprint(failed_hosts)

    return affected_hosts, skipped_hosts


@click.command()
@click.option(
    "-e", "--environment", type=click.Choice(environments, case_sensitive=False)
)
@click.option(
    "-s", "--service", type=click.Choice(services), required=False, default="all"
)
@click.option(
    "-h", "--hosts", type=click.Choice(all_nodes), required=False, multiple=True
)
@click.option("-t", "--git-tag", required=False)
def cli(environment, service, hosts, git_tag):
    release_tags = {}
    deploy_list = generate_deploy_list(service, hosts)

    affected_hosts, skipped_hosts = display_release_tags(release_tags, deploy_list)

    failed_hosts = []
    for host in affected_hosts:
        try:
            ssh(host, "hostname", exit_on_error=False)
            if git_tag:
                ssh(host, "yes | audius-cli pull", exit_on_error=False)
                ssh(host, f"yes | audius-cli set-tag {git_tag}", exit_on_error=False)
                ssh(
                    host, f"yes | audius-cli launch {service_type}", exit_on_error=False
                )
            else:
                ssh(host, "yes | audius-cli upgrade", exit_on_error=False)
        except:
            failed_hosts.append(host)

    display_release_tags(
        release_tags, deploy_list, affected_hosts, skipped_hosts, failed_hosts
    )


if __name__ == "__main__":
    cli()
