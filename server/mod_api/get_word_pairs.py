from __future__ import print_function
from __builtin__ import list
import numpy as np
import pprint
import nltk

# nltk.download('punkt')
# nltk.download('averaged_perceptron_tagger')


noun = ['NN', 'NNS', 'NNP', 'NNPS']
stopwords = ["i", "s"]
pp = pprint.PrettyPrinter(depth=6)


def get_type(data_dict):
    if len(data_dict.keys()) == 0:
        return None, None
    max = -99999
    ret = list(data_dict.keys())[0]

    for key in data_dict.keys():
        if data_dict[key] > max:
            max = data_dict[key]
            ret = key
    return ret, max


def for_each_review_(review, ret_data_dict):
    del review['_id']
    scored_terms = review['score']

    # text = ""
    # for line in review['text']:
    #     text = text + " " + line


    dict_ = {}

    para_ = []
    for text in list(review['text'].keys()):
        text = text.replace("  ", " ").strip().split(" ")
        if len(text) > 1:
            para_.append(text)

    text = nltk.pos_tag_sents(para_)

    for line in text:
        for word in line:
            dict_[word[0]] = word[1]

    for term in scored_terms.keys():
        ct = 0
        skip = False
        nn = None

        term = term.lower().strip()
        term_list = term.split(" ")

        for elem in term_list:
            if elem in dict_.keys():
                if elem in stopwords:
                    skip = True
                if skip is not True and dict_[elem] in noun:
                    ct += 1
                    nn = elem
            else:
                skip = True

        object = {
            'word_pairs': term,
            'frequency': {

            },
            'noun': nn
        }

        for t in term_list:
            try:
                object['frequency'][t] += review['tf_idf'][t]
            except:

                object['frequency'][t] = review['tf_idf'][t]

        if ct < 2 and skip is False and nn is not None:
            object['type'], object['tpye_score'] = get_type(scored_terms[term])
            object['polarity'] = np.mean(review['final'][term])
            object['business_id'] = review['business_id']
            object['review_id'] = review['review_id']

            try:
                obj = ret_data_dict[object['business_id']][term]
                # print (term, 'old', ret_data_dict[object['business_id']][term], 'new', object['frequency'])

                for txt in obj['frequency'].keys():
                    obj['frequency'][txt] += object['frequency'][txt]

                ret_data_dict[object['business_id']][term] = obj

            except Exception as e:
                if object['business_id'] in ret_data_dict.keys():
                    ret_data_dict[object['business_id']][term] = object
                else:
                    ret_data_dict[object['business_id']] = {}
                    ret_data_dict[object['business_id']][term] = object

            ret_data_dict[object['business_id']][term]['noun_frequency'] = \
                ret_data_dict[object['business_id']][term]['frequency'][nn]
            # elif skip is False:
            #     print " - ", term_list, term

    review['score'] = scored_terms

    del review

    return ret_data_dict


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
        'final': 1,
        'text': 1
    }

    processed = list(mongo_connection.db.yelp_review_scored_pair_all_truncated_reduced.find(query, what))
    ret_list = {}
    for review in processed:
        ret_list = for_each_review_(review, ret_list)

    ret_list['business_es'] = list(ret_list.keys())

    return ret_list
