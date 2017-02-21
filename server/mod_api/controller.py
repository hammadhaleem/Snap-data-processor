from __future__ import print_function

from bson.json_util import dumps
from flask import Blueprint, jsonify, url_for

from server import app, mongo_connection, cache
from server.mod_api.utils import get_user_information_from_mongo, \
    get_business_graph

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
        'get_user_information': '<user_id>',
        'get_social_graph_of_two_business': "<business_id1 > , <business_id2>",
        'get_social_graph_common' : "<business_id1 > , <business_id2>"
    })


@mod_api.route('/get_business_information/')
@mod_api.route('/get_business_information/<business_id>')
@mod_api.route('/get_business_information/<business_id>/<next_page>')
def business_information(business_id=None, next_page=None):
    yelp_business_information = mongo_connection.db.yelp_business_information

    if business_id is None or business_id == "ALL":

        if next_page is None:
            next_page = 0
        else:
            next_page = int(next_page)

        output = []
        cache_key = "business_id_none_cached"

        yelp_business_information_return = cache.get(cache_key)

        if yelp_business_information_return is None:
            for business in yelp_business_information.find({}, {
                "business_id": 1,
                'longitude': 1,
                'review_count': 1,
                'name': 1,
                'latitude': 1,
                'stars': 1
            }):
                output.append({
                    "business_id": business['business_id'],
                    'longitude': business['longitude'],
                    'review_count': business['review_count'],
                    'name': business['name'],
                    'latitude': business['latitude'],
                    'stars': business['stars']})

            cache.set(cache_key, output, timeout=300)

            return jsonify(business=output[next_page: next_page + 100],
                           next=url_for('api.business_information', business_id='ALL', next_page=next_page + 100),
                           total=len(output))
        else:

            output = yelp_business_information_return
            return jsonify(business=output[next_page: next_page + 100],
                           next=url_for('api.business_information', business_id='ALL', next_page=next_page + 100),
                           total=len(output)
                           )
    else:
        user = dumps(yelp_business_information.find({'business_id': business_id}))
        return user


@mod_api.route('/get_business_information_city/<city>')
def business_information_city(city=None):
    yelp_business_information = mongo_connection.db.yelp_business_information

    output = []
    for business in yelp_business_information.find({'city': city}, {
        "business_id": 1,
        'longitude': 1,
        'review_count': 1,
        'name': 1,
        'latitude': 1,
        'stars': 1
    }):
        output.append({
            "business_id": business['business_id'],
            'longitude': business['longitude'],
            'review_count': business['review_count'],
            'name': business['name'],
            'latitude': business['latitude'],
            'stars': business['stars']})
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
        user_list, friends_edges = get_business_graph(business_id)
        list_output = []

        for elem in user_list:
            list_output.append({
                'user_id': elem,
                'flag': 0
            })

        edge_output = []
        for elem in friends_edges:
            if elem[0] in user_list and elem[1] in user_list:
                edge_output.append({
                    'start': elem[0],
                    'end': elem[1],
                    'flag': 0
                })

        return jsonify(nodes=list_output, edges=edge_output)
    else:
        return jsonify(data=None)


@mod_api.route('/get_social_graph_common/<business_id1>/<business_id2>')
def get_business_graph_two_common(business_id1, business_id2):
    data1 = get_business_graph(business_id1)

    data2 = get_business_graph(business_id2)

    if data1 is None or data2 is None:
        return None

    user_list1, friends_edges1 = data1
    user_list2, friends_edges2 = data2

    sum_before = len(user_list1) + len(friends_edges1) + len(user_list2) + len(friends_edges2)

    common_users = set(set(user_list1)).intersection(set(user_list2))
    common_edges = set(set(friends_edges1)).intersection(set(friends_edges2))

    user_list1 = set(user_list1) - common_users
    friends_edges1 = set(friends_edges1) - common_edges

    user_list2 = set(user_list2) - common_users
    friends_edges2 = set(friends_edges2) - common_edges

    sum_after = len(user_list1) + len(friends_edges1) + len(user_list2) + len(friends_edges2) + 2 * len(
        common_users) + 2 * len(common_edges)

    if sum_before != sum_after:
        raise "Set error !"

    edge_output = []
    list_output = []

    ''' Third business '''
    for elem in list(common_users):
        list_output.append({
            'user_id': elem,
            'flag': 2
        })

    for elem in list(common_edges):
        edge_output.append({
            'start': elem[0],
            'end': elem[1],
            'flag': 2
        })

    return jsonify(nodes=list_output, edges=edge_output)


@mod_api.route('/get_social_graph_of_two_business/<business_id1>/<business_id2>')
def business_graph_two(business_id1, business_id2):
    data1 = get_business_graph(business_id1)

    data2 = get_business_graph(business_id2)

    if data1 is None or data2 is None:
        return None

    user_list1, friends_edges1 = data1
    user_list2, friends_edges2 = data2

    sum_before = len(user_list1) + len(friends_edges1) + len(user_list2) + len(friends_edges2)

    common_users = set(set(user_list1)).intersection(set(user_list2))
    common_edges = set(set(friends_edges1)).intersection(set(friends_edges2))

    user_list1 = set(user_list1) - common_users
    friends_edges1 = set(friends_edges1) - common_edges

    user_list2 = set(user_list2) - common_users
    friends_edges2 = set(friends_edges2) - common_edges

    sum_after = len(user_list1) + len(friends_edges1) + len(user_list2) + len(friends_edges2) + 2 * len(
        common_users) + 2 * len(common_edges)

    if sum_before != sum_after:
        raise "Set error !"

    ''' Create data for output ! '''

    list_output = []
    edge_output = []

    '''  First business '''
    for elem in list(user_list1):
        list_output.append({
            'user_id': elem,
            'flag': 0
        })

    for elem in list(friends_edges1):
        edge_output.append({
            'start': elem[0],
            'end': elem[1],
            'flag': 0
        })

    ''' Second business '''
    for elem in list(user_list2):
        list_output.append({
            'user_id': elem,
            'flag': 1
        })

    for elem in list(friends_edges2):
        edge_output.append({
            'start': elem[0],
            'end': elem[1],
            'flag': 1
        })

    ''' Third business '''
    for elem in list(common_users):
        list_output.append({
            'user_id': elem,
            'flag': 2
        })

    for elem in list(common_edges):
        edge_output.append({
            'start': elem[0],
            'end': elem[1],
            'flag': 2
        })

    return jsonify(nodes=list_output, edges=edge_output)
