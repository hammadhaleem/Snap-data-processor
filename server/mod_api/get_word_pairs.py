import pandas as pd
from __builtin__ import list


def get_word_pairs(review_list, mongo_connection):
    query = {
        'review_id': {
            '$in': review_list
        }
    }
    what = {
        'review_id' : 1,
        'polarity' : 1,
        'score' : 1,
        'business_id' : 1,
        'stars' : 1
    }

    processed = list(mongo_connection.db.yelp_review_scored_pairs.find(query,what))
    for raw in processed:
        del raw['_id']

    processed = pd.DataFrame(processed).set_index('review_id')

    ret = processed.reset_index().T.to_dict()

    return ret
