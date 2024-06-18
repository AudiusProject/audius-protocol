from hashlib import sha256
from typing import List

import crc32c

dead_nodes = ["https://content.grassfed.network/"]


# Python equivalent of https://github.com/tysonmote/rendezvous/blob/be0258dbbd3d/rendezvous.go
class RendezvousHash:
    def __init__(self, *nodes: str):
        self.nodes: List[str] = [n for n in nodes if n not in dead_nodes]

    def add(self, *nodes: str) -> None:
        for node in nodes:
            if node not in dead_nodes:
                self.nodes.append(node)

    def get_nodes(self) -> List[str]:
        return self.nodes

    def get(self, key: str) -> str:
        ranked = self.rank_hybrid(key)
        if ranked:
            return ranked[0]
        return ""

    # HashMigration: use rank_sha256 after migration done
    def get_n(self, n: int, key: str) -> List[str]:
        return self.rank_hybrid(key)[:n]

    def rank_hybrid(self, key: str) -> List[str]:
        legacy = self.rank_crc32(2, key)
        modern = [h for h in self.rank_sha256(key) if h not in legacy]
        hybrid = legacy + modern
        return hybrid

    def rank_crc32(self, n: int, key: str) -> List[str]:
        scores = [(self.hash(node, key), node) for node in self.nodes]
        scores.sort(key=lambda x: (-x[0], x[1]))
        return [t[1] for t in scores[:n]]

    def rank_sha256(self, key: str) -> List[str]:
        tuples = [
            (h, sha256((h + key).encode("utf-8")).hexdigest()) for h in self.nodes
        ]
        tuples.sort(key=lambda t: (t[1], t[0]))
        return [t[0] for t in tuples]

    @staticmethod
    def hash(node: str, key: str) -> int:
        combined = (key + node).encode("utf-8")
        # Convert to unsigned 32-bit integer to match golang uint32 here: https://github.com/tysonmote/rendezvous/blob/be0258dbbd3d/rendezvous.go#L92
        return crc32c.crc32c(combined) & 0xFFFFFFFF
