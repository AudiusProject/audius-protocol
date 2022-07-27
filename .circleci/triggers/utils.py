import logging
from subprocess import PIPE, Popen

logging.basicConfig(
    format="%(levelname)-8s [%(asctime)s] %(message)s", level=logging.INFO
)
logger = logging.getLogger("utils")


def run_cmd(cmd, exit_on_error=True, msg=None):
    """Execute shell command and capture the output"""
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
    """Return 'master' and 'release' for all detected master/release branches"""
    for branch in branches:
        if "master" in branch or "remotes/origin/HEAD" in branch:
            return "master"
        if "tags/@audius" in branch or "remotes/origin/release" in branch:
            return "release"
    return branch


def ensure_tag_on_master(tag):
    """Ensure tag has been merged before proceeding"""
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
