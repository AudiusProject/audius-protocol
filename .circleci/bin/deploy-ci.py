#!/usr/bin/env python3

import logging
import json
import time
from os import getenv
from pprint import pprint
from subprocess import PIPE, Popen
from threading import Thread

import click
import requests

logging.basicConfig(
    format="%(levelname)-8s [%(asctime)s] %(message)s", level=logging.INFO
)
logger = logging.getLogger("cli")


ENVIRONMENTS = ("staging",)
SERVICES = ("all", "discovery", "creator", "identity")
CREATOR_NODES = (
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
DISCOVERY_NODES = (
    "stage-discovery-1",
    "stage-discovery-2",
    "stage-discovery-3",
    "stage-discovery-4",  # canary
    "stage-discovery-5",
)
IDENTITY_NODES = ("stage-identity",)
ALL_NODES = CREATOR_NODES + DISCOVERY_NODES + IDENTITY_NODES

MASTER = "master"
MISSING = "missing"
RELEASE = "release"
PRE_DEPLOY = "pre-deploy"
POST_DEPLOY = "post-deploy"

RAISE = "raise"
EXIT_1 = "exit-1"
IGNORE = "ignore"


def get_service_from_host(host):
    """Helper to detect the audius-cli service target."""

    if host in CREATOR_NODES:
        return "creator-node"
    if host in DISCOVERY_NODES:
        return "discovery-provider"
    if host in IDENTITY_NODES:
        return "identity-service"


def ssh(host, cmd, exit_on_error=RAISE, show_output=False, dry_run=False):
    """Helper for `run_cmd()` designed for running commands on a host via SSH."""

    ssh_cmd = f"ssh -o LogLevel=quiet {host} -- {cmd}"
    if dry_run:
        logger.info(f"Dry run: {ssh_cmd}")
    else:
        return run_cmd(
            ssh_cmd,
            msg=f">> {host}: {cmd}",
            exit_on_error=exit_on_error,
            show_output=show_output,
        )


def run_cmd(cmd, exit_on_error=RAISE, msg=None, show_output=False):
    """
    Execute a shell command and return stdout.
    Exit or raise error on stderr.
    """

    # set the appropriate log level
    log = logger.debug
    if show_output:
        log = logger.info

    # run command and grab stdout/stderr
    log(msg if msg else f"< {cmd}")
    sp = Popen(cmd.split(" "), stdout=PIPE, stderr=PIPE)
    stdout, stderr = sp.communicate()
    stdout = stdout.strip().decode()
    stderr = stderr.strip().decode()

    # log stdout
    if stdout:
        log(stdout)

    # if stderr is present:
    # * log stderr
    # * either: exit(1) or raise RuntimeError
    if stderr:
        logger.warning(stderr)
        if "Could not get object for" in stderr:
            log(
                "FIX: Run `git fetch` within your local audius-protocol repo, or the branch was deleted."
            )
        if exit_on_error == RAISE:
            raise RuntimeError("Previous command had stderr output.")
        elif exit_on_error == EXIT_1:
            exit(1)
        else:
            pass

    return stdout


def standardize_branch_name(branches):
    """Helper to sanatize branch names into enums, when possible"""

    for branch in branches:
        if "origin/master" in branch or "origin/HEAD" in branch:
            return MASTER
        if "origin/release" in branch:
            return RELEASE
    return branch


def get_release_tag_by_host(snapshot, host, github_user, github_token):
    """
    Collect metadata for current release tag, given a host.

    A release tag can either be:

    * in the `master` branch
    * in a `release` branch
    * in a feature/PR branch
        * In which case, we'll collect author and commit_data metadata.
    * an unknown commit (due to previously squashing and merging a feature branch)
        * In which case, we'll collect author, commit_data, branch, and Github URL metadata.
    """

    # grab release tag from host
    output = ssh(host, "grep TAG audius-docker-compose/*/.env", exit_on_error=RAISE)
    tag = output.split()[0].split("=")[1].strip("'")

    # grab all branches from git tree that contain release tag
    try:
        branches = run_cmd(f"git branch -r --contains {tag}").split("\n")
    except Exception:
        logger.exception("branch not found")
        branches = [MISSING]

    branch = standardize_branch_name(branches)

    # snapshot.update() is thread-safe, other interactions may not be
    snapshot.update(
        {
            host: {
                "branch": branch,
                "tag": tag,
            }
        }
    )

    # grab author and commit date from git tree for deployed feature-branches
    if branch not in (MASTER, RELEASE, MISSING):
        author, commit_date = run_cmd(f"git log --format='%an|%ci' {tag}^!").split("|")
        snapshot.update(
            {
                host: {
                    "author": author,
                    "commit_date": commit_date,
                    "branch": branch,
                    "tag": tag,
                }
            }
        )

    # grab author, commit date, and url metadata from Github,
    # when commits have been squased and branches have been merged and deleted
    if branch == MISSING:
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
        snapshot.update(
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


def release_snapshot(deploy_list, parallel_mode, github_user, github_token):
    """
    Grab the current release tags across all hosts in a `deploy_list`.

    `parallel_mode` can be disabled for simpler debugging.
    """

    snapshot = {}

    # create a thread per host, for async release-tag collection
    threads = list()
    for host in deploy_list:
        thread = Thread(
            target=get_release_tag_by_host,
            args=(snapshot, host, github_user, github_token),
        )
        threads.append(thread)
        thread.start()

        # allow sequentially running commands for debug purposes
        if not parallel_mode:
            thread.join(timeout=15)
            if thread.is_alive():
                print("Timeout seen with Github API.")
                exit(1)

    # required for parallel_mode
    # no-op for non-parallel mode, since thread.join() has already been called above
    for thread in threads:
        thread.join(timeout=15)
        if thread.is_alive():
            print("Timeout seen with Github API.")
            exit(1)

    return snapshot


def update_release_summary(
    release_summary,
    release_step,
    parallel_mode=True,
    github_user=None,
    github_token=None,
    force=False,
):
    """
    Save current snapshot of release tags.

    When in PRE_DEPLOY mode, mark nodes as:

    * `upgradeable`, when a node is currently using a githash found in `master` or a `release` branch.
    * `skipped`, when a node has been manually deployed to.
    """

    release_summary[release_step] = release_snapshot(
        release_summary["deploy_list"], parallel_mode, github_user, github_token
    )

    if release_step == PRE_DEPLOY:
        release_summary["upgradeable"] = []
        release_summary["skipped"] = {}
        for host, metadata in release_summary[release_step].items():
            if metadata["branch"] in (MASTER, RELEASE) or force:
                release_summary["upgradeable"].append(host)
            else:
                release_summary["skipped"][host] = metadata


def print_release_summary(release_summary):
    """
    Helper to print a release summary.

    Dedicate error logs when `failed` releases are encountered.
    """

    print("=" * 40)
    pprint(release_summary, sort_dicts=True)

    if "failed" in release_summary and release_summary["failed"]:
        print("=" * 40)
        logging.error("Failed:")
        logging.error("See logs for the following failed hosts:")
        pprint(release_summary["failed"], sort_dicts=True)


def generate_deploy_list(services, hosts):
    """Create a set of hosts to be deployed to, given possibly conflicting CLI parameters."""

    deploy_list = []
    for service in services:
        if service in ["all", "creator"]:
            deploy_list += CREATOR_NODES
        if service in ["all", "discovery"]:
            deploy_list += DISCOVERY_NODES
        if service in ["all", "identity"]:
            deploy_list += IDENTITY_NODES

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


def format_artifacts(heading=None, hosts=None, release_summary=None):
    """Send summary output to stdout and /tmp/summary.md|json for artifact collection."""

    # write summary.md
    if hosts:
        hosts.sort()
        summary = [f"{heading}:"]
        for h in hosts:
            summary.append(f"* {h}")

        print("\n".join(summary))
        with open("/tmp/summary.md", "a") as f:
            f.write("\n".join(summary))
            f.write("\n\n")

    # write summary.json
    if release_summary:
        with open("/tmp/summary.json", "w") as f:
            f.write(json.dumps(release_summary, indent=4))


@click.command()
@click.option("-u", "--github-user", required=True)
@click.option("-g", "--github-token", required=True)
@click.option("-t", "--git-tag", required=False)
@click.option(
    "-f",
    "--force",
    is_flag=True,
    default=False,
    help="Deploy over nodes running feature branches",
)
@click.option(
    "-e", "--environment", type=click.Choice(ENVIRONMENTS, case_sensitive=False)
)
@click.option(
    "-s",
    "--services",
    type=click.Choice(SERVICES),
    required=False,
    default=("all",),
    multiple=True,
)
@click.option(
    "-h", "--hosts", type=click.Choice(ALL_NODES), required=False, multiple=True
)
@click.option(
    "--parallel-mode/--no-parallel-mode",
    " /-P",
    show_default=True,
    default=True,
    help="Run this script in parallel mode.",
)
@click.option(
    "-d",
    "--dry-run",
    is_flag=True,
    default=False,
    help="Hold off on actual deploy",
)
def cli(
    github_user,
    github_token,
    git_tag,
    force,
    environment,
    services,
    hosts,
    parallel_mode,
    dry_run,
):
    """
    Deploy a git_tag (defaults to latest `master` commit when unspecified)
    across a combination of: environments, services, and hosts.
    """

    if not git_tag:
        git_tag = run_cmd("git log -n 1 --pretty=format:%H master")

    # gather and display current release state, pre-deploy
    release_summary = {
        "deploy_list": generate_deploy_list(services, hosts),
        "git_tag": git_tag,
    }
    update_release_summary(
        release_summary,
        PRE_DEPLOY,
        parallel_mode=parallel_mode,
        github_user=github_user,
        github_token=github_token,
        force=force,
    )
    print_release_summary(release_summary)

    # add future logic to avoid multiple parallel deployments
    seconds = 1
    print(f"Waiting {seconds} seconds for manual inspection of parallel jobs.")
    time.sleep(seconds)

    # perform release on `upgradeable` hosts
    print("v" * 40)
    release_summary["upgraded"] = []
    release_summary["failed_pre_check"] = []
    release_summary["failed"] = []
    for host in release_summary["upgradeable"]:
        try:
            # log additional information
            ssh(host, "hostname", show_output=True)
            ssh(
                host,
                "cd audius-docker-compose; git log -n 1 --pretty=format:%H",
                show_output=True,
            )

            # check healthcheck pre-deploy
            service = get_service_from_host(host)
            health_check = ssh(
                host, f"audius-cli health-check {service}", show_output=True
            )
            health_check = health_check.split("\n")[-1]
            if health_check != "Service is healthy":
                release_summary["failed_pre_check"].append(host)

            # perform release
            # NOTE: `git pull` and `docker pull` write to stderr,
            # so we can't readily catch "errors"
            ssh(
                host,
                "yes | audius-cli pull",
                show_output=True,
                exit_on_error=IGNORE,
                dry_run=dry_run,
            )
            ssh(
                host,
                f"yes | audius-cli set-tag {git_tag}",
                show_output=True,
                dry_run=dry_run,
            )
            ssh(
                host,
                f"yes | audius-cli launch {service}",
                show_output=True,
                exit_on_error=IGNORE,
                dry_run=dry_run,
            )
            # # ssh(host, "yes | audius-cli upgrade", show_output=True, dry_run=dry_run)
            release_summary["upgraded"].append(host)
        except:
            release_summary["failed"].append(host)
        print("-" * 40)
    print("^" * 40)

    # gather and display current release state, post-deploy
    update_release_summary(
        release_summary,
        POST_DEPLOY,
        parallel_mode=parallel_mode,
        github_user=github_user,
        github_token=github_token,
    )
    print_release_summary(release_summary)

    # save release states as artifacts
    format_artifacts("Failed precheck (unhealthy)", release_summary["failed_pre_check"])
    format_artifacts(
        f"Upgraded to `{git_tag if git_tag else 'master'}`",
        release_summary["upgraded"],
    )
    format_artifacts("Failed", release_summary["failed"])
    format_artifacts(release_summary=release_summary)


if __name__ == "__main__":
    cli()
