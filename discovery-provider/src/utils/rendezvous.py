from typing import List

import crc32c


# Python equivalent of https://github.com/tysonmote/rendezvous/blob/be0258dbbd3d/rendezvous.go
class RendezvousHash:
    def __init__(self, *nodes: str):
        self.nodes: List[bytes] = [bytes(node, "utf-8") for node in nodes]

    def add(self, *nodes: str) -> None:
        for node in nodes:
            self.nodes.append(bytes(node, "utf-8"))

    def get(self, key: str) -> str:
        max_node = max(
            (node for node in self.nodes),
            default=None,
            key=lambda node: self.hash(node, bytes(key, "utf-8")),
        )
        return max_node.decode("utf-8") if max_node is not None else ""

    def get_n(self, n: int, key: str) -> List[str]:
        scores = [(self.hash(node, bytes(key, "utf-8")), node) for node in self.nodes]
        scores.sort(key=lambda x: (-x[0], x[1]))
        return [node.decode("utf-8") for _, node in scores[:n]]

    def get_nodes(self) -> List[str]:
        return [node.decode("utf-8") for node in self.nodes]

    @staticmethod
    def hash(node: bytes, key: bytes) -> int:
        combined = key + node
        # Convert to unsigned 32-bit integer to match golang uint32 here: https://github.com/tysonmote/rendezvous/blob/be0258dbbd3d/rendezvous.go#L92
        return crc32c.crc32c(combined) & 0xFFFFFFFF
