import logging
from enum import Enum

from sqlalchemy import desc
from sqlalchemy.orm.session import Session

from src.models.social.play import Play
from src.utils.config import shared_config

logger = logging.getLogger(__name__)


class Env(Enum):
    Dev = 1
    Stage = 2
    Prod = 3


class CutoverManager:
    """Class that controls the cutover blocks based on env.

    Constants are in this format: ENV_NETWORK_FINAL|STARTING_BLOCK
    Negative one indicates they are not in effect yet.
    """

    DEV_SOL_FINAL_SLOT: int = 100
    DEV_CORE_STARTING_BLOCK: int = 10
    STAGE_SOL_FINAL_SLOT: int = -1
    STAGE_CORE_STARTING_BLOCK: int = -1
    PROD_SOL_FINAL_SLOT: int = -1
    PROD_CORE_STARTING_BLOCK: int = -1

    cutover: bool = False
    env: Env

    def __init__(self) -> None:
        environment = shared_config["discprov"]["env"]
        match shared_config["discprov"]["env"]:
            case "prod":
                self.env = Env.Prod
            case "stage":
                self.env = Env.Stage
            case "dev" | "local":
                self.env = Env.Dev
            case _:
                raise Exception(f"unknown env {environment}")

    # maybe should pass in solana and core clients here?
    def has_cutover(self, session: Session) -> bool:
        # if already calculated, return true
        if self.cutover:
            return self.cutover

        highest_slot_query = (
            session.query(Play)
            .filter(Play.slot != None)
            .filter(Play.signature != None)
            .order_by(desc(Play.slot))
        ).first()

        match self.env:
            case Env.Dev:
                if (
                    highest_slot_query is not None
                    and highest_slot_query.slot >= self.DEV_SOL_FINAL_SLOT
                ):
                    self.cutover = True
            case Env.Stage:
                # don't cutover in stage
                return False
                if (
                    highest_slot_query is not None
                    and highest_slot_query.slot >= self.STAGE_SOL_FINAL_SLOT
                ):
                    self.cutover = True
            case Env.Prod:
                # don't cutover in prod
                return False
                if (
                    highest_slot_query is not None
                    and highest_slot_query.slot >= self.PROD_CORE_STARTING_BLOCK
                ):
                    self.cutover = True

        # check against constants in env
        # return true or false if cutover has been hit
        return self.cutover

    def get_adjusted_core_block_num(self, block_num: int) -> int:
        """Returns a new core block number with the final solana slot added.
        Used before inserting into the db."""
        match self.env:
            case Env.Dev:
                return block_num + self.DEV_SOL_FINAL_SLOT
            case Env.Stage:
                return block_num + self.STAGE_SOL_FINAL_SLOT
            case Env.Prod:
                return block_num + self.PROD_SOL_FINAL_SLOT

    def get_original_core_block_num(self, adjusted_block_num: int) -> int:
        """Returns the original core block number with the final solana slot subtracted.
        Used if you need to query a core block from the db."""
        match self.env:
            case Env.Dev:
                return adjusted_block_num - self.DEV_SOL_FINAL_SLOT
            case Env.Stage:
                return adjusted_block_num - self.STAGE_SOL_FINAL_SLOT
            case Env.Prod:
                return adjusted_block_num - self.PROD_SOL_FINAL_SLOT


CUTOVER_MANAGER = CutoverManager()
