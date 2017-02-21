from __future__ import print_function

from flask import Blueprint, jsonify

from server import app, mongo_connection, cache
from bson.json_util import dumps
import json

from server.mod_api.utils import get_user_friends, get_users_for_business, get_user_information_from_mongo

mod_api = Blueprint('api', __name__, url_prefix='/api')
app.url_map.strict_slashes = False


# http://www.bogotobogo.com/python/MongoDB_PyMongo/python_MongoDB_RESTAPI_with_Flask.php


@mod_api.route('/')
@mod_api.route('/index')
def api_index():
    return jsonify(data={
        'get_business_information': '<None, business_id>',
        'get_business_information_city': '<city>',
        'get_business_graph': '<business_id>',
        'get_user_information': '<user_id>'
    })


@mod_api.route('/get_business_information/')
@mod_api.route('/get_business_information/<business_id>')
def business_information(business_id=None):
    yelp_business_information = mongo_connection.db.yelp_business_information

    if business_id is None:
        output = []
        cache_key = "business_id_none_cached"

        yelp_business_information_return = cache.get(cache_key)

        if yelp_business_information_return is None:
            for business in yelp_business_information.find({}, {"business_id": 1}):
                output.append({'business_id': business['business_id']})

            cache.set(cache_key, output, timeout=300)
            return jsonify(output)
        else:
            return jsonify(yelp_business_information_return)
    else:
        user = dumps(yelp_business_information.find({'business_id': business_id}))
        return user


@mod_api.route('/get_business_information_city/<city>')
def business_information_city(city=None):
    yelp_business_information = mongo_connection.db.yelp_business_information

    output = []
    for business in yelp_business_information.find({'city': city}, {"business_id": 1}):
        output.append({'business_id': business['business_id']})
    return jsonify(output)


@mod_api.route('/get_user_information/<user_id>')
def get_user_information(user_id=None):
    user_information = cache.get(str(user_id) + "_user_information")
    if user_information is not None:
        output = user_information
    else:
        output = get_user_information_from_mongo(user_id)
        cache.set(str(user_id) + "_user_information", output, timeout=30)
    return jsonify(output)


@mod_api.route('/get_business_graph/<business_id>')
def business_graph(business_id=None):
    if business_id is not None:
        business_id_list = cache.get(str(business_id) + "_graph_user_list")
        if business_id_list is not None:
            user_list = business_id_list
        else:
            user_list = get_users_for_business(business_id)
            cache.set(str(business_id) + "_graph_user_list", user_list, timeout=300)

        business_id_edges = cache.get(str(business_id) + "_graph_user_edges")
        if business_id_edges is not None:
            friends_edges = business_id_edges
        else:
            friends_edges = get_user_friends(user_list)
            cache.set(str(business_id) + "_graph_user_edges", friends_edges, timeout=300)

        list_output = []

        for elem in user_list:
            list_output.append({
                'user_id': elem,
                'flag': 0
            })

        edge_output = []
        for elem in friends_edges:
            edge_output.append({
                'start': elem[0],
                'end': elem[1],
                'flag': 0
            })

        return jsonify(
            nodes=list_output,
            edges=edge_output
        )
