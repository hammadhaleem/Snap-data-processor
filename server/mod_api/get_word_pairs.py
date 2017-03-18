import pandas as pd
from __builtin__ import list
import numpy as np

def for_each_review_(review):
    del review['_id']
    scored_terms = review['score']
    for term in scored_terms.keys():
        term_list = term.split(" ")
        for t in term_list:
            try:
                scored_terms[term]['frequency'][t] = review['tf_idf'][t]


            except:
                scored_terms[term]['frequency'] = {}
                scored_terms[term]['frequency'][t] = review['tf_idf'][t]
                scored_terms[term]['frequency']['polarity'] = np.mean(review['final_pairs'][term])

    review['score'] = scored_terms

    del review['final_pairs']
    del review['tf_idf']
    return review


def get_word_pairs(review_list, mongo_connection):
    query = {
        'review_id': {
            '$in': review_list
        }
    }
    what = {
        'review_id': 1,
        'polarity': 1,
        'score': 1,
        'business_id': 1,
        'stars': 1,
        'tf_idf': 1,
        'final_pairs': 1
    }

    processed = list(mongo_connection.db.yelp_review_scored_pair_all.find(query, what))
    map(for_each_review_, processed)
    processed = pd.DataFrame(processed).set_index('review_id')

    ret = processed.reset_index().T.to_dict()

    return ret
