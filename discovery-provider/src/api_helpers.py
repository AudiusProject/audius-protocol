from flask import jsonify


def error_response(error, error_code=500):
    return jsonify({'success': False, 'error': error}), error_code


def success_response(response_entity=None, status=200):
    response_dictionary = {
        'data': response_entity
    }

    response_dictionary['success'] = True
    return jsonify(response_dictionary), status
