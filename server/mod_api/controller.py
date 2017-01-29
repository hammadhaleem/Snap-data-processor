from __future__ import print_function

from flask import Blueprint, jsonify

from server import app

# Define the blueprint: 'dashboards', set its url prefix: app.url/dashboards
mod_api = Blueprint('api', __name__, url_prefix='/api')
app.url_map.strict_slashes = False


@mod_api.route('/')
@mod_api.route('/index')
def api_index():
    return jsonify(data={})