import json
from collections import OrderedDict
from pathlib import Path
from typing import Any, Container, Dict, List, Optional, TypedDict

import base58
from anchorpy import Idl, InstructionCoder
from solders.instruction import Instruction


class ParsedTxInstr(TypedDict):
    instruction_name: str
    accounts: List[str]
    account_names_map: Dict[str, str]
    data: Any


class AnchorParser:
    def __init__(self, idl_path: str, program_id: str):
        data = self._get_json_data(idl_path, program_id)
        self.instruction_account_name_dict = self._get_instruction_account_name_dict(
            data
        )
        self.idl = Idl.from_json(json.dumps(data))
        self.instruction_coder = InstructionCoder(self.idl)

    def parse_instruction(
        self,
        instruction: Instruction,
    ) -> ParsedTxInstr:
        encoded_ix_data = base58.b58encode(instruction.data)
        idl_instruction_name = self._get_instruction_name(encoded_ix_data)
        account_addresses = self._get_instruction_context_accounts(instruction)
        decoded_data = self._decode_instruction_data(encoded_ix_data)

        instruction_name_camel_case = self._convert_snake_to_camel_case(
            idl_instruction_name
        )
        account_name_address_dict = self._map_account_name_to_address(
            instruction_name_camel_case, account_addresses
        )
        return {
            "instruction_name": idl_instruction_name,
            "accounts": account_addresses,
            "account_names_map": account_name_address_dict,
            "data": decoded_data,
        }

    def _get_json_data(self, idl_path: str, program_id: str) -> Dict:
        path = Path(idl_path)
        with path.open() as f:
            data = json.load(f)

        # Modify 'metadata':'address' field if mismatched with config
        if data["metadata"]["address"] != program_id:
            data["metadata"]["address"] = program_id

        return data

    def _get_instruction_account_name_dict(self, data: dict) -> OrderedDict:
        instruction_account_name_dict = OrderedDict()
        for instruction in data["instructions"]:
            instruction_account_name_dict[instruction["name"]] = [
                account["name"] for account in instruction["accounts"]
            ]
        return instruction_account_name_dict

    def _decode_instruction_data(self, encoded_ix_data: bytes) -> Optional[Container]:
        ix = base58.b58decode(encoded_ix_data)
        ix_sighash = ix[0:8]
        data = ix[8:]
        decoder = self.instruction_coder.sighash_layouts.get(ix_sighash)
        if not decoder:
            return None
        else:
            decoded_data = decoder.parse(data)
            return decoded_data

    # Maps account indices for ix context to pubkeys
    def _get_instruction_context_accounts(self, instruction: Instruction) -> List[str]:
        self.instruction_coder.ix_layout
        return [str(account_meta.pubkey) for account_meta in instruction.accounts]

    def _get_instruction_name(self, encoded_ix_data: bytes) -> str:
        # Default to empty string for empty instruction names (program deployments)
        idl_instruction_name = self.instruction_coder.sighash_to_name.get(
            base58.b58decode(encoded_ix_data)[0:8], ""
        )
        return idl_instruction_name

    def _map_account_name_to_address(
        self, instruction_name: str, account_addresses: List[str]
    ) -> Dict:
        if not instruction_name:
            return {}

        account_name_address_dict = OrderedDict()
        for i in range(len(account_addresses)):
            account_name = self.instruction_account_name_dict[instruction_name][i]
            account_name_address_dict[account_name] = account_addresses[i]
        return account_name_address_dict

    def _convert_snake_to_camel_case(self, string: str) -> str:
        words = string.split("_")
        return words[0] + "".join(word.capitalize() for word in words[1:])
