#!/usr/bin/env python3

import logging
import time
from pprint import pprint
from subprocess import PIPE, Popen
from threading import Thread

import click
import requests

logging.basicConfig(
    format="%(levelname)-8s [%(asctime)s] %(message)s", level=logging.INFO
)
logger = logging.getLogger("cli")


environments = ("staging",)
services = ("all", "discovery", "content", "identity")
content_nodes = (
    "stage-creator-4",  # canary
    "stage-creator-5",
    "stage-creator-6",
    "stage-creator-7",
    "stage-creator-8",
    "stage-creator-9",
    "stage-creator-10",
    "stage-creator-11",
    "stage-user-metadata",
)
discovery_nodes = (
    "stage-discovery-1",
    "stage-discovery-2",
    "stage-discovery-3",
    "stage-discovery-4",  # canary
    "stage-discovery-5",
)
identity_nodes = (
    "stage-identity",
)
all_nodes = content_nodes + discovery_nodes + identity_nodes

FORCE_INSTRUCTIONS = "INSTRUCTIONS GO HERE."


# like run_cmd with msg formatting tweaks
def ssh(host, cmd, exit_on_error=True, show_output=False):
    return run_cmd(
        f"ssh {host} -- {cmd}",
        msg=f">> {host}: {cmd}",
        exit_on_error=exit_on_error,
        show_output=show_output,
    )


# execute shell command and capture the output
def run_cmd(cmd, exit_on_error=True, msg=None, show_output=False):
    log = logger.debug
    if show_output:
        log = logger.info
    log(msg if msg else f"< {cmd}")
    sp = Popen(cmd.split(" "), stdout=PIPE, stderr=PIPE)
    stdout, stderr = sp.communicate()
    stdout = stdout.strip().decode()
    stderr = stderr.strip().decode()

    if stdout:
        log(stdout)
    if stderr:
        logger.warning(stderr)
        if "Could not get object for" in stderr:
            log(
                "FIX: Run `git fetch` within your local audius-protocol repo, or the branch was deleted."
            )
        if exit_on_error:
            exit(1)
        else:
            raise RuntimeError("Previous command had stderr output.")

    return stdout


def standardize_branch(branches):
    for branch in branches:
        if "remotes/origin/master" in branch or "remotes/origin/HEAD" in branch:
            return "master"
        if "tags/@audius" in branch or "remotes/origin/release" in branch:
            return "release"
    return branch


def generate_deploy_list(service, hosts):
    deploy_list = []
    if service in ["all", "content"]:
        deploy_list += content_nodes
    if service in ["all", "discovery"]:
        deploy_list += discovery_nodes
    if service in ["all", "identity"]:
        deploy_list += identity_nodes

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


def get_release_tag(release_tags, host, github_user, github_token):
    output = ssh(host, "grep TAG audius-docker-compose/*/.env")
    tag = output.split()[0].split("=")[1].strip("'")

    try:
        branches = run_cmd(
            f"git name-rev --name-only {tag}", exit_on_error=False
        ).split("\n")
    except:
        branches = ["missing"]

    branch = standardize_branch(branches)

    # release_tags.update() is thread-safe, other interactions may not be
    release_tags.update(
        {
            host: {
                "branch": branch,
                "tag": tag,
            }
        }
    )
    if branch not in ("master", "release", "missing"):
        author, commit_date = run_cmd(f"git log --format='%an|%ci' {tag}^!").split("|")
        release_tags.update(
            {
                host: {
                    "author": author,
                    "commit_date": commit_date,
                    "branch": branch,
                    "tag": tag,
                }
            }
        )
    if branch == "missing":
        while True:
            try:
                r = requests.get(
                    f"https://api.github.com/repos/AudiusProject/audius-protocol/git/commits/{tag}",
                    headers={
                        "Accept": "application/vnd.github+json",
                    },
                    auth=(github_user, github_token),
                    timeout=5,
                )
            except:
                continue
            break
        r = r.json()
        release_tags.update(
            {
                host: {
                    "author": r["author"]["name"],
                    "branch": branch,
                    "commit_date": r["author"]["date"],
                    "tag": tag,
                    "url": r["html_url"],
                }
            }
        )


def generate_release_tags(deploy_list, parallel_mode, github_user, github_token):
    release_tags = {}
    threads = list()
    for host in deploy_list:
        thread = Thread(
            target=get_release_tag, args=(release_tags, host, github_user, github_token)
        )
        threads.append(thread)

    for thread in threads:
        thread.start()
        if not parallel_mode:
            thread.join(timeout=15)
            if thread.is_alive():
                print("Timeout seen with Github API.")
                exit(1)

    # required for parallel_mode, no-op for non-parallel mode
    for thread in threads:
        thread.join(timeout=15)
        if thread.is_alive():
            print("Timeout seen with Github API.")
            exit(1)

    return release_tags


def display_release_tags(
    release_tags,
    deploy_list,
    affected_hosts=None,
    skipped_hosts=None,
    failed_hosts=None,
    parallel_mode=True,
    github_user=None,
    github_token=None,
):
    if not affected_hosts and not skipped_hosts:
        key = "pre-deploy"
        logging_messages = ["Current state:", "Upgrading:", "Skipping:"]
    else:
        key = "post-deploy"
        logging_messages = ["New state:", "Upgraded:", "Skipped:"]

    release_tags[key] = generate_release_tags(
        deploy_list, parallel_mode, github_user, github_token
    )
    print("=" * 40)
    logger.info(logging_messages[0])
    pprint(release_tags, sort_dicts=True)

    if not affected_hosts and not skipped_hosts:
        affected_hosts = []
        skipped_hosts = {}
        for host, metadata in release_tags[key].items():
            if metadata["branch"] in ("master", "release"):
                affected_hosts.append(host)
            else:
                skipped_hosts[host] = metadata

    print("=" * 40)
    logger.info(logging_messages[1])
    pprint(affected_hosts, sort_dicts=True)

    print("=" * 40)
    logging.error(logging_messages[2])
    pprint(skipped_hosts, sort_dicts=True)
    logger.info(FORCE_INSTRUCTIONS)

    if failed_hosts:
        print("=" * 40)
        logging.error("Failed:")
        logging.error("See logs for the following failed hosts:")
        pprint(failed_hosts, sort_dicts=True)

    return affected_hosts, skipped_hosts


def format_hosts(heading, hosts):
    if hosts:
        hosts.sort()
        summary = [f"{heading}:"]
        for h in hosts:
            summary.append(f"* {h}")

        print("\n".join(summary))
        with open("/tmp/summary.txt", "a") as f:
            f.write("\n".join(summary))
            f.write("\n\n")


def format_skipped(skipped):
    keys = [k for k in skipped.keys()]
    keys.sort()
    summary = ["Skipped:"]
    for k in keys:
        summary.append(f"* {k}: {skipped[k]['author']}")

    print("\n".join(summary))
    with open("/tmp/summary.txt", "w") as f:
        f.write("\n".join(summary))
        f.write("\n\n")


@click.command()
@click.option("-u", "--github-user", required=True)
@click.option("-g", "--github-token", required=True)
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
@click.option(
    "--parallel-mode/--no-parallel-mode",
    " /-P",
    show_default=True,
    default=True,
    help="Run this script in parallel mode.",
)
def cli(github_user, github_token, environment, service, hosts, git_tag, parallel_mode):
    release_tags = {}
    deploy_list = generate_deploy_list(service, hosts)

    affected_hosts, skipped_hosts = display_release_tags(
        release_tags,
        deploy_list,
        parallel_mode=parallel_mode,
        github_user=github_user,
        github_token=github_token,
    )

    seconds = 1
    print(f"Waiting {seconds} seconds for manual inspection of parallel jobs.")
    time.sleep(seconds)

    print("v" * 40)
    failed_hosts = []
    for host in affected_hosts:
        try:
            ssh(host, "hostname", exit_on_error=False, show_output=True)
            if service == "identity" and not git_tag:
                logger.error("A --git-tag is required when deploying identity")
                raise
            # if git_tag:
            #     ssh(host, "yes | audius-cli pull", exit_on_error=False, show_output=True)
            #     ssh(host, f"yes | audius-cli set-tag {git_tag}", exit_on_error=False, show_output=True)
            #     ssh(host, f"yes | audius-cli launch {service}", exit_on_error=False, show_output=True)
            # else:
            #     ssh(host, "yes | audius-cli upgrade", exit_on_error=False, show_output=True)
            print("-" * 40)
        except:
            failed_hosts.append(host)
    print("^" * 40)

    display_release_tags(
        release_tags,
        deploy_list,
        affected_hosts,
        skipped_hosts,
        failed_hosts,
        parallel_mode=parallel_mode,
        github_user=github_user,
        github_token=github_token,
    )

    format_skipped(skipped_hosts)
    format_hosts(f"Upgraded to `{git_tag if git_tag else 'master'}`", affected_hosts)
    format_hosts("Failed", failed_hosts)


if __name__ == "__main__":
    cli()
