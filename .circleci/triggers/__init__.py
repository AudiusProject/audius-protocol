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
    """Return 'main' and 'release' for all detected main/release branches"""
    result = None
    for branch in branches:
        if "remotes/origin/main" in branch:
            if not result:
                result = "main"
        if "remotes/origin/release" in branch:
            result = "release"
    if not result:
        result = branch.strip()
    return result


def ensure_commit_on_main(commit):
    """Ensure commit has been merged before proceeding"""
    if commit == "main":
        print("Commit cannot be 'main'.")
        exit(1)
    try:
        branches = run_cmd(
            f"git branch -a --contains {commit}", exit_on_error=False
        ).split("\n")
    except:
        branches = ["missing"]

    branch = standardize_branch(branches)

    if branch not in ("main", "release"):
        print(f"Commit not found on main, nor release branches: {branch}")
        exit(1)
