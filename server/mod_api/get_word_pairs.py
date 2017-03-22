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
adj = ['JJ', 'JJR', 'JJS']
stopwords = ["i", "s", 'able']
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
        skip = False
        nn = None
        t_list = []
        l_list = []
        nn_count = 0

        term = term.lower().strip().replace("  ", " ")
        term_list = term.split(" ")
        list_words = []  # nltk.pos_tag(term_list)
        try:
            for word in term_list:
                list_words.append((word, dict_[word]))
        except Exception as e:
            print("not in sentence" + str(e))
            skip = True

        for elem in list_words:

            if len(elem[0]) < 3:
                skip = True

            if elem[1] in noun:
                nn_count += 1

                item = inflect_engine.singular_noun(elem[0])
                if not item:
                    item = elem[0]

                nn = item
                l_list.append(item)
            else:
                l_list.append(elem[0])

        term_list = l_list
        term_mod = ' '.join(l_list)

        object = {
            'word_pairs': term,
            'frequency': {

            },
            'noun': nn
        }

        for singular in term_list:
            object['frequency'][singular] = 1
            t_list.append(singular)

        object['word_pairs'] = term_mod

        if nn_count == 1 and skip is False and nn is not None:

            object['type'], object['type_score'] = get_type(scored_terms[term])
            object['polarity'] = np.mean(review['final'][term])
            object['business_id'] = review['business_id']
            object_type = object['type']

            try:
                obj = ret_data_dict[object['business_id']][object_type][term_mod]
                object['polarity'] = np.sum(review['final'][term])
                object['polarity'] = (object['polarity'] + obj['polarity'])

                for txt in obj['frequency'].keys():
                    object['frequency'][txt] += obj['frequency'][txt]

                    ret_data_dict[object['business_id']][object_type][term_mod] = object

            except:
                object['polarity'] = np.sum(review['final'][term])

                try:
                    ret_data_dict[object['business_id']][object_type][term_mod] = object
                except:
                    try:
                        dict = ret_data_dict[object['business_id']]
                    except:
                        ret_data_dict[object['business_id']] = {}

                    ret_data_dict[object['business_id']][object_type] = {}
                    ret_data_dict[object['business_id']][object_type][term_mod] = object

            ret_data_dict[object['business_id']][object_type][term_mod]['noun_frequency'] = object['frequency'][nn]
        # else:
            # print(" - ", "list : ", list_words, "noun_count : ", nn_count, "skip : ", skip, "noun : ", nn,
            #       (nn_count == 1 and skip is False and nn is not None))  # , list(review['text'].keys()))

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
    for types_ in data_dict.keys():
        data = data_dict[types_]
        data_bid = {}
        for words in data.keys():
            term_obj = data[words]
            # print (term_obj)
            noun = term_obj['noun']
            if english.check(noun) is True:
                try:
                    data_bid[noun]['objects'].append(term_obj)
                    data_bid[noun]['count'] += term_obj['noun_frequency']
                    data_bid[noun]['objects'] = sorted( data_bid[noun]['noun_frequency'], key=lambda k: k['count'], reverse=True)

                except Exception as e:
                    data_bid[noun] = {
                        'objects': [],
                        'count': 0
                    }
                    data_bid[noun]['objects'].append(term_obj)

                    data_bid[noun]['count'] = term_obj['noun_frequency']

        lis = []
        for item in data_bid.keys():
            lis.append(data_bid[item])

        ret_dict[types_] = {
                '_all_noun_in_bid': data_bid.keys(),
                'lis_of_words': sorted(lis, key=lambda k: k['count'], reverse=True)
        }

    return ret_dict
