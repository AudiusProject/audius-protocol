import pytest

from src.utils.rendezvous import RendezvousHash


def test_create_new_hash():
    nodes = ["node1", "node2", "node3"]
    hash_obj = RendezvousHash(*nodes)
    assert hash_obj.get_nodes() == nodes


def test_add_additional_nodes():
    nodes = ["node1", "node2", "node3"]
    hash_obj = RendezvousHash(*nodes)
    new_nodes = ["node4", "node5"]
    hash_obj.add(*new_nodes)
    assert hash_obj.get_nodes() == nodes + new_nodes


def test_return_highest_scoring_node():
    nodes = ["node1", "node2", "node3"]
    hash_obj = RendezvousHash(*nodes)
    key = "test-key"
    highest_node = hash_obj.get(key)
    assert highest_node in nodes


def test_return_top_n_nodes():
    nodes = ["node1", "node2", "node3"]
    hash_obj = RendezvousHash(*nodes)
    key = "test-key"
    top2_nodes = hash_obj.get_n(2, key)
    assert len(top2_nodes) == 2
    assert all(node in nodes for node in top2_nodes)


@pytest.mark.parametrize(
    "key,expected",
    [
        ("", "d"),
        ("foo", "e"),
        ("bar", "c"),
    ],
)
def test_hash_get(key, expected):
    hash_obj = RendezvousHash()
    hash_obj.add("a", "b", "c", "d", "e")
    got_node = hash_obj.get(key)
    assert got_node == expected


# Ensures the hash results match the results of the equivalent Go code.
# See https://github.com/tysonmote/rendezvous/blob/be0258dbbd3d0df637b328d951067124541e7b6a/rendezvous_test.go
@pytest.mark.parametrize(
    "n,key,expected",
    [
        (1, "foo", ["e"]),
        (2, "bar", ["c", "e"]),
        (3, "baz", ["d", "a", "b"]),
        (2, "biz", ["b", "a"]),
        (0, "boz", []),
        (100, "floo", ["d", "a", "b", "c", "e"]),
    ],
)
def test_hash_get_n(n, key, expected):
    hash_obj = RendezvousHash()
    hash_obj.add("a", "b", "c", "d", "e")
    got_nodes = hash_obj.get_n(n, key)
    assert got_nodes == expected
