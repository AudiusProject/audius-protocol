from typing import Any, NoReturn

from anchorpy import close_workspace, create_workspace
from constants import AUDIUS_DATA_PROGRAM_NAME, AUDIUS_DATA_PROGRAM_PATH


# A POC for calling ix through anchorpy.
async def call_instruction(instruction_name: str, args: Any) -> NoReturn:
    # Read the deployed program from the workspace.
    workspace = create_workspace(path=AUDIUS_DATA_PROGRAM_PATH)
    # The program to execute.
    program = workspace[AUDIUS_DATA_PROGRAM_NAME]
    # Execute the RPC.
    await program.rpc[instruction_name](args)
    # Close all HTTP clients in the workspace, otherwise we get warnings.
    await close_workspace(workspace)
