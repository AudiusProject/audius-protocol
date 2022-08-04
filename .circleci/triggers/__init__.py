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
    result = None
    for branch in branches:
        if "remotes/origin/master" in branch:
            if not result:
                result = "master"
        if "remotes/origin/release" in branch:
            result = "release"
    if not result:
        result = branch.strip()
    return result


def ensure_commit_on_master(commit):
    """Ensure commit has been merged before proceeding"""
    if commit == "master":
        print("Commit cannot be 'master'.")
        exit(1)
    try:
        branches = run_cmd(
            f"git branch -a --contains {commit}", exit_on_error=False
        ).split("\n")
    except:
        branches = ["missing"]

    branch = standardize_branch(branches)

    if branch not in ("master", "release"):
        print(f"Commit not found on master, nor release branches: {branch}")
        exit(1)
