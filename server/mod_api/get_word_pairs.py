import pandas as pd


def get_word_pairs(business_id, mongo_connection):
    query = {
        'business_id': business_id
    }

    processed = list(mongo_connection.db.yelp_reviews_analysis_adj_noun_restaurants_tokens.find(query))
    for raw in processed:
        del raw['_id']

    review_ids = [x['review_id'] for x in processed]

    data = {
        'review_id': 1,
        'text':1
    }
    query = {
        'review_id': {
            '$in': review_ids
        }
    }

    raw_review = list(mongo_connection.db.yelp_reviews.find(query,data))

    for raw in raw_review:
        del raw['_id']

    review = pd.DataFrame(raw_review).set_index('review_id')
    processed = pd.DataFrame(processed).set_index('review_id')

    ret = processed.join(review).reset_index().T.to_dict()

    return ret
