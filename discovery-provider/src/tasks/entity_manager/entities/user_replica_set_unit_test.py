from src.tasks.entity_manager.entities.user_replica_set import parse_update_sp_id


class Params:
    def __init__(self, metadata):
        self.metadata = metadata


def test_parse_update_sp_id():
    params = Params("1,2,3:2,3,4")
    result = parse_update_sp_id(params)
    assert result == ([1, 2, 3], [2, 3, 4])

    try:
        params = Params("1,2,3:a,3,4")
        result = parse_update_sp_id(params)
        assert False
    except Exception as e:
        assert str(e) == "sp id of a is not a digit"

    try:
        params = Params("1,2,3,4")
        result = parse_update_sp_id(params)
        assert False
    except Exception as e:
        assert str(e) == 'Invalid format entity_id should be ":" separated'

    try:
        params = Params("1,2,3:4")
        result = parse_update_sp_id(params)
        assert False
    except Exception as e:
        assert str(e) == "Too few updated sp ids"
