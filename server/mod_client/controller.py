from __future__ import print_function

from flask import Blueprint, jsonify

from server import app

# Define the blueprint: 'dashboards', set its url prefix: app.url/dashboards
mod_client = Blueprint('client', __name__, url_prefix='/client')
app.url_map.strict_slashes = False


@mod_client.route('/')
@mod_client.route('/index')
def client_index():
    return jsonify(data={})