from typing import NewType

EthAddress = NewType("EthAddress", str)


class Attestation:
    def __init__(
        self,
        *,
        amount: int,
        oracle_address: EthAddress,
        user_address: EthAddress,
        challenge_id: str,
        challenge_specifier: str,
    ):
        self.amount = amount
        self.oracle_address = oracle_address
        self.challenge_id = challenge_id
        self.user_address = user_address
        self.challenge_specifier = challenge_specifier

    def stringify(self):
        # Format:
        # recipient + "_" + amount + "_" + ID (challengeId + specifier) + "_" + bot_oracle
        return "_".join(
            [
                self.user_address,
                str(self.amount),
                self._get_combined_id(),
                self.oracle_address,
            ]
        )

    def _get_combined_id(self):
        return f"{self.challenge_id}::{self.challenge_specifier}"

# Define custom errors
class ChallengeIncomplete(Exception):
    """Could not attest because challenge incomplete"""
    pass

class ChallengeAlreadyDisbursed(Exception):
    """Could not attest because already disbursed"""
    pass

def get_attestation():
    # Algorithm:
    #   - Check that the challenge is finished, and not yet disbursed