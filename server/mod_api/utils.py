from server import mongo_connection, cache
import json


def get_user_information_from_mongo(user_id):
    yelp_users = mongo_connection.db.yelp_users

    output = []
    for user in yelp_users.find({'user_id': user_id}, {'_id': 0}):
        for key in user.keys():
            if type(user[key]) is list:
                user[key] = json.dumps(user[key])
        output.append(user)
    return output[0]


def get_user_information_list(user_list):
    users = mongo_connection.db.yelp_users.find({'user_id': {"$in": user_list}}, {'friends': 1, 'user_id': 1, 'name' : 1, 'review_count' : 1, 'average_stars' : 1})
    user_dict = {}
    for user in users :
        infor = {
            'friends_count' : len(user['friends']),
            'user_id' : user['user_id'],
            'name' : user['name'],
            'review_count' : user['review_count'],
            'average_stars' : user['average_stars']
        }
        user_dict[user['user_id']] = infor
    return user_dict



def get_user_friends(user_list):
    users = mongo_connection.db.yelp_users.find({'user_id': {"$in": user_list}}, {'friends': 1, 'user_id': 1})
    edges = []
    for user in users:
        friends = user['friends']
        user_id = user['user_id']
        for friend in friends:
            edges.append((user_id, friend))
            edges.append((friend, user_id))

    edges = list(set(edges))

    return edges


def get_users_for_business(business_id):
    user_list = []
    reviews = mongo_connection.db.yelp_reviews.find({'business_id': business_id}, {"user_id": 1})
    tips = mongo_connection.db.yelp_tips.find({'business_id': business_id}, {"user_id": 1})

    for user in reviews:
        user_list.append(user['user_id'])
    for user in tips:
        user_list.append(user['user_id'])

    user_list = list(set(user_list))
    return user_list


def get_business_graph(business_id):
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

    return user_list, friends_edges
