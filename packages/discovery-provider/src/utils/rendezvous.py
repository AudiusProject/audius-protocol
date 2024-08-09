from hashlib import sha256
from typing import List

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
        ranked = self.rank_sha256(key)
        if ranked:
            return ranked[0]
        return ""

    def get_n(self, n: int, key: str) -> List[str]:
        return self.rank_sha256(key)[:n]

    def rank_sha256(self, key: str) -> List[str]:
        tuples = [
            (h, sha256((h + key).encode("utf-8")).hexdigest()) for h in self.nodes
        ]
        tuples.sort(key=lambda t: (t[1], t[0]))
        return [t[0] for t in tuples]
