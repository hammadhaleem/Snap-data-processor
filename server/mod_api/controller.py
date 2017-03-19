from __future__ import print_function

from __builtin__ import len
from __builtin__ import list
from __builtin__ import set
from __builtin__ import str
from bson.json_util import dumps
from flask import Blueprint, jsonify, url_for

from server import app, mongo_connection, cache
from server.mod_api.get_word_pairs import get_word_pairs
from server.mod_api.graph_get import graph_in_box
from server.mod_api.nlp import nlp_analysis
from server.mod_api.utils import get_user_information_from_mongo, \
    get_business_graph, get_user_information_list, haversine, get_user_business_ratings

from server.mod_api.get_reviews import get_nlp_analysis

mod_api = Blueprint('api', __name__, url_prefix='/api')
app.url_map.strict_slashes = False


@mod_api.route('/')
@mod_api.route('/index')
def api_index():
    return jsonify(data={
        'get_business_information': '<None, business_id>',
        'get_business_information_city': '<city>',
        'get_business_graph': '<business_id>',
        'get_user_information': '<user_id>',
        'get_social_graph_of_two_business': "<business_id1 > , <business_id2>",
        'get_social_graph_common': "<business_id1 > , <business_id2>",
        'get_cities': "<None>",
        'get_types': '<None>',
        'get_business_information_city_type': "<city> / <type>",
        'get_business_information_lat_lon': '<lat1 , lon1 > , <lat2 , long2>',
        'get_competition_graph': "business_id , distance",
        'examples': [
            'http://localhost:5002/api/get_business_information_city/las_vegas',
            'http://localhost:5002/api/get_business_information_city/tempe',
            'http://localhost:5002/api/get_business_information_city_type/tempe/health',
            'http://localhost:5002/api/get_business_information_city_type/las_vegas/restaurants',
            'http://localhost:5002/api/get_business_information_lat_lon/-111.952229/33.422129/-111.926308/33.407227',
            'http://localhost:5002/api/get_competition_graph/nEE4k6PJkRGuV3nWoVUGRw/500',
            'http://localhost:5002/api/get_competition_graph/nEE4k6PJkRGuV3nWoVUGRw/1000',
            'http://localhost:5002/api/get_competition_graph/zUHIDqm_UKdnSygmWKtyRg/500',
            'http://localhost:5002/api/get_competition_graph/zUHID qm_UKdnSygmWKtyRg/1000',
            'http://localhost:5002/api/get_cities',
            'http://localhost:5002/api/get_types',
            "http://localhost:5002/api/nlp/review_analysis/['1o0g0ymmHl6HRgrg3KEM5w' , '1nJaL6VBUHR1DlErpnsIBQ' , '4cDrkvLInTuSlBU9zNOi8Q' , '4cCxazHh5DfWJ9eOcfvlSA' , 'nslcUj3coPzFFzeSYrkqrQ' , '4cOrGZfCKbhhdjZohhBkPQ']/"
        ],
        'helper': [
            'http://www.birdtheme.org/useful/v3tool.html',
            'http://www.bogotobogo.com/python/MongoDB_PyMongo/python_MongoDB_RESTAPI_with_Flask.php'
        ]
    })


@mod_api.route('/get_cities')
def get_cities():
    cities = mongo_connection.db

    pipeline = [
        {"$group": {"_id": "$city", "count": {"$sum": 1}}}
    ]

    cities = cities.yelp_business_information_processed_all.aggregate(pipeline)
    dict_tmp = []
    for elem in cities:
        dict_tmp.append([elem[u'_id'], int(elem[u'count'])])

    dict_tmp = sorted(dict_tmp, key=lambda x: x[1], reverse=True)
    return jsonify(cities=dict_tmp)


@mod_api.route('/get_types')
def get_types():
    types = mongo_connection.db.yelp_business_information_processed_all
    types = types.distinct('type')
    return jsonify(types=types)


@mod_api.route('/get_business_information_city_type/<city>/<type>')
def business_information_city_type(city, type):
    yelp_business_information = mongo_connection.db.yelp_business_information_processed_all
    data_query = yelp_business_information.find({'city': city, 'type': type},
                                                {"business_id": 1,
                                                 'longitude': 1,
                                                 'review_count': 1,
                                                 'name': 1,
                                                 'latitude': 1,
                                                 'stars': 1,
                                                 'city': 1,
                                                 'rating': 1,
                                                 'price_range': 1,
                                                 'type': 1,
                                                 'review_distribution': 1
                                                 })

    output = []
    for business in data_query:
        data_dict = {
            "business_id": business['business_id'],
            'longitude': business['longitude'],
            'review_count': business['review_count'],
            'name': business['name'],
            'latitude': business['latitude'],
            'stars': business['stars'],
            'city': business['city'],
            'type': business['type']
        }

        try:
            data_dict['rating'] = business['review_distribution']
        except Exception as e:
            data_dict['rating'] = None

        try:
            data_dict['price_range'] = business['price_range']
        except Exception as e:
            data_dict['price_range'] = None

        output.append(data_dict)

    return jsonify(output)


@mod_api.route('/get_business_information/')
@mod_api.route('/get_business_information/<business_id>')
@mod_api.route('/get_business_information/<business_id>/<next_page>')
def business_information(business_id=None, next_page=None):
    yelp_business_information = mongo_connection.db.yelp_business_information_processed_all

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
                'stars': 1,
                'city': 1
            }):
                output.append({
                    "business_id": business['business_id'],
                    'longitude': business['longitude'],
                    'review_count': business['review_count'],
                    'name': business['name'],
                    'latitude': business['latitude'],
                    'stars': business['stars'],
                    'city': business['city']
                })

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
    yelp_business_information = mongo_connection.db.yelp_business_information_processed_all

    output = []
    for business in yelp_business_information.find({'city': city}, {
        "business_id": 1,
        'longitude': 1,
        'review_count': 1,
        'name': 1,
        'latitude': 1,
        'stars': 1,
        'city': 1,
        'type': 1,
        'price_range': 1,
        'review_distribution': 1
    }):

        data_dict = {
            "business_id": business['business_id'],
            'longitude': business['longitude'],
            'review_count': business['review_count'],
            'name': business['name'],
            'latitude': business['latitude'],
            'stars': business['stars'],
            'city': business['city'],
            'type': business['type']}

        try:
            data_dict['rating'] = business['review_distribution']
        except Exception as e:
            data_dict['rating'] = None

        try:
            data_dict['price_range'] = business['price_range']
        except Exception as e:
            data_dict['price_range'] = None

        output.append(data_dict)
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
        user_dict = get_user_information_list(user_list)
        for elem in user_list:
            list_output.append({
                'user_id': elem,
                'group': 0,
                'details': user_dict[elem]
            })

        edge_output = []
        for elem in friends_edges:
            if elem[0] in user_list and elem[1] in user_list:
                edge_output.append({
                    'start': elem[0],
                    'end': elem[1],
                    'group': 0
                })

        return jsonify(nodes=list_output, edges=edge_output)
    else:
        return jsonify(data=None)


@mod_api.route('/get_social_graph_common/<business_id1>/<business_id2>')
def get_business_graph_two_common(business_id1, business_id2):
    business_id1, business_id2 = sorted([business_id1, business_id2])
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

    sum_after = len(user_list1) + len(friends_edges1) + len(user_list2) + len(friends_edges2) \
                + 2 * len(common_users) + 2 * len(common_edges)

    if sum_before != sum_after:
        raise "Set error !"

    edge_output = []
    list_output = []

    all_users = list(set(list(user_list1) + list(user_list2) + list(common_users)))
    user_dict = get_user_information_list(list(all_users))
    user_dict = get_user_business_ratings(user_dict, business_id1, business_id2)

    ''' common business '''
    for elem in list(common_users):
        list_output.append({
            'user_id': elem,
            'group': 2,
            'details': user_dict[elem],
            'index': all_users.index(elem)
        })

    done = []
    for elem in list(common_edges):
        if elem[0] in common_users and elem[1] in common_users and elem not in done:
            edge_output.append({
                'start': elem[0],
                'end': elem[1],
                'group': 2,
                'source': all_users.index(elem[0]),
                'target': all_users.index(elem[1])
            })

            done.append((elem[0], elem[1]))
            done.append((elem[1], elem[0]))

    return jsonify(nodes=list_output, links=edge_output)


@mod_api.route('/get_social_graph_of_two_business/<business_id1>/<business_id2>')
def business_graph_two(business_id1, business_id2):
    business_id1, business_id2 = sorted([business_id1, business_id2])
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

    sum_after = len(user_list1) + len(friends_edges1) + len(user_list2) \
                + len(friends_edges2) + 2 * len(common_users) + 2 * len(common_edges)

    if sum_before != sum_after:
        raise "Set error !"

    ''' Create data for output ! '''
    list_output = []
    edge_output = []

    all_users = list(set(list(user_list1) + list(user_list2) + list(common_users)))
    user_dict = get_user_information_list(all_users)

    '''  First business '''
    for elem in list(user_list1):
        list_output.append({
            'user_id': elem,
            'group': 0,
            'details': user_dict[elem],
            'index': all_users.index(elem)
        })

    ''' Second business '''
    for elem in list(user_list2):
        list_output.append({
            'user_id': elem,
            'group': 1,
            'details': user_dict[elem],
            'index': all_users.index(elem)
        })

    ''' Common business '''
    for elem in list(common_users):
        list_output.append({
            'user_id': elem,
            'group': 2,
            'details': user_dict[elem],
            'index': all_users.index(elem)
        })

    ## Remove duplicates and add edges

    done = []

    for elem in list(friends_edges1):
        if elem[0] in user_list1 and elem[1] in user_list1 and elem not in done:
            edge_output.append({
                'start': elem[0],
                'end': elem[1],
                'group': 0,
                'source': all_users.index(elem[0]),
                'target': all_users.index(elem[1])
            })

            done.append((elem[0], elem[1]))
            done.append((elem[1], elem[0]))

    for elem in list(friends_edges2):
        if elem[0] in user_list2 and elem[1] in user_list2 and elem not in done:
            edge_output.append({
                'start': elem[0],
                'end': elem[1],
                'group': 1,
                'source': all_users.index(elem[0]),
                'target': all_users.index(elem[1])
            })

            done.append((elem[0], elem[1]))
            done.append((elem[1], elem[0]))

    for elem in list(common_edges):
        if elem[0] in common_users and elem[1] in common_users and elem not in done:
            edge_output.append({
                'start': elem[0],
                'end': elem[1],
                'group': 2,
                'source': all_users.index(elem[0]),
                'target': all_users.index(elem[1])
            })

            done.append((elem[0], elem[1]))
            done.append((elem[1], elem[0]))

    return jsonify(nodes=list_output, links=edge_output)


@mod_api.route('/get_business_information_lat_lon/<lat1>/<lon1>/<lat2>/<lon2>')
def get_business_information_lat_lon(lat1, lon1, lat2, lon2):
    ''' Example queries

        http://0.0.0.0:5002/api/get_business_information_lat_lon/-111/33/-112/34
        http://0.0.0.0:5002/api/get_business_information_lat_lon/-111.952229/33.422129/-111.926308/33.407227

        http://www.birdtheme.org/useful/v3tool.html

    '''
    lat1 = float(lat1)
    lat2 = float(lat2)
    lon1 = float(lon1)
    lon2 = float(lon2)

    polygon = []
    polygon.append((lat1, lon1))
    polygon.append((lat1, lon2))
    polygon.append((lat2, lon2))
    polygon.append((lat2, lon1))
    polygon.append((lat1, lon1))

    yelp_business_information = mongo_connection.db.yelp_business_information_processed_all
    query = {
        'geometry': {
            '$geoWithin': {
                '$geometry': {
                    'type': "Polygon",
                    'coordinates': [polygon]
                }
            }
        }
    }
    data_query = list(yelp_business_information.find(query))

    output = []
    for business in data_query:
        data_dict = {
            "business_id": business['business_id'],
            'longitude': business['longitude'],
            'review_count': business['review_count'],
            'name': business['name'],
            'latitude': business['latitude'],
            'stars': business['stars'],
            'city': business['city']
        }

        try:
            data_dict['rating'] = business['review_distribution']
        except Exception as e:
            data_dict['rating'] = None

        try:
            data_dict['price_range'] = business['price_range']
        except Exception as e:
            data_dict['price_range'] = None

        output.append(data_dict)

    return jsonify(polygon=polygon, data=output)


@mod_api.route('/get_competition_graph/<business_id>/')
@mod_api.route('/get_competition_graph/<business_id>/<distance_meters>')
def competition_graph(business_id='mmKrNeBIIevuNljAWVNgXg', distance_meters=1000):
    distance_meters = float(distance_meters)

    yelp_business_information = mongo_connection.db.yelp_business_information_processed_all

    business_data = list(yelp_business_information.find({'business_id': business_id}, {
        'business_id': 1,
        'longitude': 1,
        'review_count': 1,
        'name': 1,
        'latitude': 1,
        'stars': 1,
        'city': 1,
        'type': 1,
        'price_range': 1,
        'rating': 1
    }))[0]

    business_data.pop('_id')

    query = {
        'geometry':
            {'$near':
                {
                    '$geometry': {'type': "Point",
                                  'coordinates': [business_data['longitude'], business_data['latitude']]},
                    '$maxDistance': distance_meters
                }
            }
        ,
        'type': business_data['type']
    }
    data_query = list(yelp_business_information.find(query, {
        'business_id': 1,
        'longitude': 1,
        'review_count': 1,
        'name': 1,
        'latitude': 1,
        'stars': 1,
        'city': 1,
        'type': 1
    }))

    for elem in data_query:
        elem.pop("_id")
        elem['distance_meters'] = haversine(
            elem['longitude'],
            elem['latitude'],
            business_data['longitude'],
            business_data['latitude']
        )

    yelp_social_ = mongo_connection.db.yelp_business_graph_type_all
    connections = list(
        yelp_social_.find({
            'source': business_id,
            'distance_meters': {
                '$lte': float(distance_meters)
            },
            'type': business_data['type']
        }))
    map(lambda d: d.pop('_id'), connections)

    print((len(data_query), len(connections)))

    return jsonify(all=data_query, data=business_data, common_graph=connections)


@mod_api.route('/get_business_graph_box/<lat1>/<lon1>/<lat2>/<lon2>')
def get_business_graph_box_no_city(lat1, lon1, lat2, lon2):
    """ Example queries

        /api/get_business_graph_box/tempe/health/-111.94647721946242/33.42943568280503/-111.93797998130323/33.417615716327546/

    """
    lat1 = float(lat1)
    lat2 = float(lat2)
    lon1 = float(lon1)
    lon2 = float(lon2)

    polygon = [(lat1, lon1), (lat1, lon2), (lat2, lon2), (lat2, lon1), (lat1, lon1)]

    nodes, link = graph_in_box(city=None, type=None, polygon=polygon)
    return jsonify(nodes=nodes, links=link)


@mod_api.route('/get_business_graph_box/<city>/<type>/<lat1>/<lon1>/<lat2>/<lon2>')
def get_business_graph_box(city, type, lat1, lon1, lat2, lon2):
    """ Example queries

        /api/get_business_graph_box/tempe/health/-111.94647721946242/33.42943568280503/-111.93797998130323/33.417615716327546/

    """
    lat1 = float(lat1)
    lat2 = float(lat2)
    lon1 = float(lon1)
    lon2 = float(lon2)

    polygon = [(lat1, lon1), (lat1, lon2), (lat2, lon2), (lat2, lon1), (lat1, lon1)]

    nodes, link = graph_in_box(city, type, polygon)
    return jsonify(nodes=nodes, links=link)


@mod_api.route('/get_review_information/<business_id1>/<business_id2>')
def review_information_agg(business_id1, business_id2):
    business_ids = sorted([business_id1, business_id2])
    yelp_business_information = mongo_connection.db.yelp_reviews

    query = {
        'business_id': {
            '$in': business_ids
        }
    }

    what = {
        'business_id': 1,
        'review_id': 1,
        'date': 1,
        'user_id': 1,
        'stars': 1
    }

    user_list = {
        business_id1: [],
        business_id2: []
    }

    data_dict = {
        business_id1: [],
        business_id2: []
    }

    lis = list(yelp_business_information.find(query, what))

    lis = sorted(lis, key=lambda k: k['date'])

    date_list = [e['date'] for e in lis]

    max_date = max(date_list)
    min_date = min(date_list)

    for elem in lis:
        del elem['_id']
        user_list[elem['business_id']].append(elem['user_id'])
        data_dict[elem['business_id']].append(elem)

    user_list[business_id2] = set(user_list[business_id2])
    user_list[business_id1] = set(user_list[business_id1])

    for elem in data_dict[business_id1]:
        if elem['user_id'] in user_list[business_id2]:
            elem['common'] = 'true'
        else:
            elem['common'] = 'false'

    for elem in data_dict[business_id2]:
        if elem['user_id'] in set(user_list[business_id1]):
            elem['common'] = 'true'
        else:
            elem['common'] = 'false'

    return jsonify(data=data_dict, max_date=max_date, min_date=min_date)


@mod_api.route('/nlp/review_analysis/<review_list>/')
def get_review_analysis(review_list):
    #  http://localhost:5002/api/nlp/review_analysis/UvcH52d-FQ3waD5Z0LmFCQ/
    #  http://localhost:5002/api/nlp/review_analysis/
    #           ['1o0g0ymmHl6HRgrg3KEM5w',
    #            '1nJaL6VBUHR1DlErpnsIBQ',
    #            '4cDrkvLInTuSlBU9zNOi8Q',
    #            '4cCxazHh5DfWJ9eOcfvlSA',
    #            'nslcUj3coPzFFzeSYrkqrQ',
    #            '4cOrGZfCKbhhdjZohhBkPQ']/
    # bit better?
    #
    # review_list = mongo_connection.db.yelp_reviews.find(
    #                   {'business_id':
    #                           {'$in' :
    #                               ['ndQTAJzhhkrl1i5ToEGSZw' , 'jiOREht1_iH8BPDBe9kerw']
    #                           }
    #                   }
    #               )
    # review_list = [x['review_id'] for x in review_list]
    # nlp_analysis_res = get_word_pairs(review_list, mongo_connection)

    final_result_ = {}
    nlp_analysis_res = get_word_pairs(eval(review_list), mongo_connection)
    final_result_['business_es'] = sorted(nlp_analysis_res['business_es'])
    for bid in final_result_['business_es']:
        final_result_[bid] = []
        data = nlp_analysis_res[bid]
        for item in sorted(data.keys()):
            final_result_[bid].append(nlp_analysis_res[bid][item])

    return jsonify(final_result_)
