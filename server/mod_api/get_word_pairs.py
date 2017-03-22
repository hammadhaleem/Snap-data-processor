from __future__ import print_function

from __builtin__ import len
from __builtin__ import list
import numpy as np
import pprint
import nltk
import enchant
import inflect


english = enchant.Dict("en_US")

inflect_engine = inflect.engine()

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
        l_list = []
        for elem in term_list:
            if elem in dict_.keys():

                item = inflect_engine.singular_noun(elem)
                if item is False:
                    item = elem

                if elem in stopwords:
                    skip = True
                if skip is not True and dict_[elem] in noun:
                    ct += 1
                    nn = item

                if len(elem) < 3:
                    skip = True
                l_list.append(item)
            else:
                skip = True

        term_list = l_list
        term_mod = ' '.join(l_list)

        object = {
            'word_pairs': term,
            'frequency': {

            },
            'noun': nn
        }

        t_list = []
        for singular in term_list:
            object['frequency'][singular] = 1
            t_list.append(singular)

        object['word_pairs'] = term_mod

        # if term_mod != term:
        #     print (term_mod , term)

        if ct < 2 and skip is False and nn is not None:

            # print(nn, term_mod, term, inflect_engine.singular_noun(nn))

            object['type'], object['tpye_score'] = get_type(scored_terms[term])
            object['polarity'] = np.mean(review['final'][term])
            object['business_id'] = review['business_id']

            try:
                obj = ret_data_dict[object['business_id']][term_mod]
                object['polarity'] = np.sum(review['final'][term])
                object['polarity'] = (object['polarity'] + obj['polarity'])
            except:
                object['polarity'] = np.sum(review['final'][term])


            try:
                obj = ret_data_dict[object['business_id']][term_mod]
                # print (term, 'old', ret_data_dict[object['business_id']][term], 'new', object['frequency'])

                for txt in obj['frequency'].keys():
                    obj['frequency'][txt] += object['frequency'][txt]

                ret_data_dict[object['business_id']][term_mod] = obj

            except Exception as e:
                if object['business_id'] in ret_data_dict.keys():
                    ret_data_dict[object['business_id']][term_mod] = object
                else:
                    ret_data_dict[object['business_id']] = {}
                    ret_data_dict[object['business_id']][term_mod] = object

            ret_data_dict[object['business_id']][term_mod]['noun_frequency'] = \
                ret_data_dict[object['business_id']][term_mod]['frequency'][nn]
            # else:
            #     print(" - ", nltk.pos_tag(term_list))  # , list(review['text'].keys()))

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


def create_groups(data_dict):
    ret_dict = {}
    for bid in data_dict['business_es']:
        data = data_dict[bid]
        data_bid = {}
        for term_obj in data:
            noun = term_obj['noun']

            if english.check(noun) is True:
                try:
                    data_bid[noun]['objects'].append(term_obj)
                    data_bid[noun]['count'] += term_obj['noun_frequency']
                except Exception as e:
                    data_bid[noun] = {
                        'objects': [],
                        'count': 0
                    }
                    # print(e, term_obj)
                    data_bid[noun]['objects'].append(term_obj)
                    data_bid[noun]['count'] = term_obj['noun_frequency']

        lis = []
        for noun in data_bid.keys():
                lis.append({
                    'key': noun,
                    'value' : data_bid[noun],
                    'count': data_bid[noun]['count']
                })


        ret_dict[bid] = {
            '_all_noun_in_bid':  data_bid.keys(),
            'lis_of_words' : sorted(lis, key=lambda k: k['count'], reverse=True)
        }

    ret_dict['business_es'] = data_dict['business_es']
    return ret_dict
