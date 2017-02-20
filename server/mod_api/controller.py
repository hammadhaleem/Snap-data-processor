from __future__ import print_function

from flask import Blueprint, jsonify

from server import app, mongo_connection
from bson.json_util import dumps
# Define the blueprint: 'dashboards', set its url prefix: app.url/dashboards
mod_api = Blueprint('api', __name__, url_prefix='/api')
app.url_map.strict_slashes = False

# http://www.bogotobogo.com/python/MongoDB_PyMongo/python_MongoDB_RESTAPI_with_Flask.php

@mod_api.route('/')
@mod_api.route('/index')
def api_index():
    return jsonify(data={
        'get_common_users': '<business_id>',
        'get_business_information': '<None, business_id>',
        'get_business_information_city': '<city>'
    })


@mod_api.route('/get_business_information/')
@mod_api.route('/get_business_information/<business_id>')
def business_information(business_id=None):
    yelp_business_information = mongo_connection.db.yelp_business_information

    if business_id is None:
        output = []
        for business in yelp_business_information.find({}, {"business_id": 1}):
            output.append({'business_id': business['business_id']})
        return jsonify(output)
    else:
        user = dumps(yelp_business_information.find({'business_id': business_id}))

        return user
