# coding: utf-8

# In[67]:

from __future__ import division
from __builtin__ import len
from __builtin__ import list
from __builtin__ import str

import json
import nltk
import numpy as np
import pandas as pd
import re
import time

from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from nltk.stem import WordNetLemmatizer
from nltk.util import ngrams
from pymongo import MongoClient
from textblob import TextBlob
from nltk.corpus import sentiwordnet as swn
from collections import Counter

start_time = time.time()
data_dir = '/home/hammad/dev/yelp/txt_sentoken'
classes = ['pos', 'neg']

port_stemmer = PorterStemmer()
word_net_lemmer = WordNetLemmatizer()

client = MongoClient()
db = client.yelp_comparative_analytics
allowed_words = ['not', 'no']
tags = set(['JJ', 'JJR', 'JJS', 'NN', 'NNS', 'NNP', 'NNPS'])

noun = ['NN', 'NNS', 'NNP', 'NNPS']
adj = ['JJ', 'JJR', 'JJS']

words = ['is', 'be', 'are', 'was', 'were']
stop_words = ['id', 'youll', 'youd', 'mr', 'youll', 'thru', 'tues']

word_dictionary_expand = {
    "woudn't": 'would not',
    "shouldn't": "should not",
    "can't": "cannot",
    "$": "dollar",
    "%": 'percentage',
    "mustn't": "must not",
    "couldn't": "could not",
    "ain't": "are not",
    "aren't": "are not",
    "you'll": "you will"
}


# In[69]:

def to_mongo_db(df, collection_name):
    records = json.loads(df.T.to_json()).values()
    db[collection_name].insert_many(records)


def _get_sentiment(star_polarity):
    if star_polarity >= 2.5:
        return 'pos'
    return 'neg'


# In[70]:

def sum_new(lis):
    sum_i = 0
    for elem in lis:
        try:
            sum_i += float(elem)
        except:
            pass
    return sum_i


def get_only_selected_types(list_of_elem):
    dict_i = {}
    for item in list_of_elem:
        dict_i[item[0]] = item[1]
    return dict_i


def get_only_selected_types_tags(list_of_elem, types):
    tokens = []
    for item in list_of_elem:
        if types[item] in tags or item in allowed_words:
            tokens.append(item)
    return tokens


def get_selected_words(dict_i):
    lis = list(dict_i.keys())
    return lis


def get_ngrams(token, number=2):
    return [' '.join(x) for x in list(set(ngrams(token, number)))]


def find_bigrams(input_list):
    bigram_list = []
    for i in range(len(input_list) - 1):
        bigram_list.append(' '.join([input_list[i], input_list[i + 1]]))
    return bigram_list


def find_trigrams(input_list):
    bigram_list = []
    for i in range(len(input_list) - 2):
        bigram_list.append(' '.join([input_list[i], input_list[i + 1], input_list[i + 2]]))
    return bigram_list


def get_tfidf(seq):
    return Counter(seq)


# In[71]:

word_dictionary = {}
word_count = 0

city = raw_input('Enter City ')
bus_type = 'restaurants'
table = 'yelp_review_patterns_las_vagas_restaurant'

# In[72]:

business = [x['business_id'] for x in
            list(db.yelp_business_information_processed.find({'type': bus_type, 'city': city}, {'business_id': 1}))]
print("[Info] Total business " + str(len(business)), 'time from start', (time.time() - start_time))

query = {
    'business_id': {'$in': business}
}
raw = list(db.yelp_reviews.find(query, {'business_id': 1, 'text': 1, 'stars': 1, 'review_id': 1}))
print("[Info] Total elements " + str(len(raw)), 'time from start', (time.time() - start_time))

reviews_df = pd.DataFrame(raw)
reviews_df = reviews_df.drop('_id', axis=1)

reviews_df['text'] = reviews_df.text.apply(lambda x: x.lower().strip())
reviews_df['sentences'] = reviews_df.text.apply(lambda x: nltk.sent_tokenize(x))


def fix_df(reviews_df):
    lis = []
    for _, row in reviews_df.iterrows():
        row = row.to_dict()
        sentences = row['sentences'][:]
        for sen in sentences:
            row1 = row.copy()
            row1['text'] = sen
            del row1['sentences']
            lis.append(row1)

    review = pd.DataFrame(lis)
    return review


review = fix_df(reviews_df)
print("[Info] Load and clean dataframe", (time.time() - start_time))


# In[74]:

def format_word_split(txt):
    """Turns a text document to a list of formatted words.
    Get rid of possessives, special characters, multiple spaces, etc.
    """
    tt = txt.lower().strip()

    for word in word_dictionary_expand.keys():
        tt = tt.replace(word, word_dictionary_expand[word])

    tt = re.sub('[^A-Za-z0-9]+', ' ', tt)

    return tt


# In[75]:

review['polarity'] = review.text.apply(lambda x: TextBlob(x).sentiment.polarity)
review['text'] = review.text.apply(lambda x: format_word_split(x))
print("[Info] Get polarity", (time.time() - start_time))
review.head()


# In[76]:

def remove_stop(x):
    ret = []
    for elem in x:
        if elem not in stop_words:
            ret.append(elem)
    return ret


# In[77]:

review['tokens'] = review.text.apply(lambda x: nltk.word_tokenize((x)))
review['tokens'] = review.tokens.apply(lambda x: remove_stop(x))
review['tf_idf'] = review.tokens.apply(lambda x: get_tfidf(x))
print ("[Info] -2 phase completed ", (time.time() - start_time))

# In[78]:

review['pos_tagged'] = review.tokens.apply(lambda x: nltk.pos_tag(x))
review['bi_grams'] = review.tokens.apply(lambda x: find_bigrams(x))
review['tri_grams'] = review.tokens.apply(lambda x: find_trigrams(x))
review['type'] = review.pos_tagged.apply(lambda x: get_only_selected_types(x))
print("[Info] -1 phase completed", (time.time() - start_time))

# In[79]:

review['tokens_spl'] = review.apply(lambda x: get_only_selected_types_tags(x['tokens'], x['type']), axis=1)
review['bi_grams_spl'] = review.tokens_spl.apply(lambda x: find_bigrams(x))
review['tri_grams_spl'] = review.tokens_spl.apply(lambda x: find_trigrams(x))
print("[Info] Zero phase completed", (time.time() - start_time))


# In[80]:

##  rule one only extract adj , noun pairs
def get_sets():
    lis = []
    for n in noun:
        for a in adj:
            lis.append(a + "," + n)
            lis.append(n + "," + a)

    return set(lis)


word_sets = list(get_sets())
print(" Only find word_sets", word_sets)


def get_only_required_sets(bigrams, types, words_set):
    ret = []

    for gram in bigrams:
        lis = []
        gram_split = gram.split(" ")
        for elem in gram_split:
            lis.append(types[elem])

        if ','.join(lis) in words_set:
            ret.append(' '.join(gram_split))

    return ret


# In[81]:

review['rule_one'] = review.apply(lambda row: get_only_required_sets(row['bi_grams'], row['type'], word_sets), axis=1)
review['rule_one_special'] = review.apply(lambda row: get_only_required_sets(row['bi_grams_spl'], row['type'], word_sets), axis=1)
print("[Info] First phase completed", (time.time() - start_time))


# In[82]:

##  rule one only extract adj , noun pairs
##  following the templates as defined in here
##  print adj

def reduce_set(word_sets, types):
    return_lis = []
    for words in word_sets:
        ret = []
        for elem in words:
            if types[elem] in tags:
                ret.append((elem, types[elem]))

        ret = sorted(ret, key=lambda x: x[1], reverse=False)
        ret = [x[0] for x in ret]
        return_lis.append(' '.join(ret))
    return return_lis


templates = [
    (adj, words, noun),
    (noun, words, adj),
    (noun, words, noun),
]


def find_rules_based_templates(word_list, types, templates, words, size=3):
    list_length = len(word_list)
    ret = []
    i = 0
    while i < list_length:
        word_set = word_list[i:i + size]
        if len(set(word_set).intersection(words)) > 0:
            lis = []
            for word in word_set:
                if types[word] in tags:
                    lis.append(types[word])
                else:
                    lis.append(word)

            for template in templates:
                if len(template) == len(lis):
                    check = True
                    for ct in range(0, len(template)):
                        if (lis[ct] in template[ct]):
                            pass
                        else:
                            check = False
                    if check is True:
                        ret.append(word_set)
        i += 1
    return ret


# In[83]:

review['rule_two'] = review.apply(lambda x: find_rules_based_templates(x['tokens'], x['type'], templates, words),
                                  axis=1)
review['rule_two_reduce'] = review.apply(lambda x: reduce_set(x['rule_two'], x['type']), axis=1)
print("[Info] Second phase completed", (time.time() - start_time))

# In[84]:

review['text'] = review.apply(lambda x: (x['text'], x['polarity']), axis=1)
review['tokens'] = review.apply(lambda x: (x['tokens'], x['polarity']), axis=1)
review['rule_one'] = review.apply(lambda x: (x['rule_one'], x['polarity']), axis=1)
print("[Info] Third phase completed", (time.time() - start_time))

# In[85]:

review['rule_one_special'] = review.apply(lambda x: (x['rule_one_special'], x['polarity']), axis=1)
review['rule_two'] = review.apply(lambda x: (x['rule_two'], x['polarity']), axis=1)
review['rule_two_reduce'] = review.apply(lambda x: (x['rule_two_reduce'], x['polarity']), axis=1)
print("[Info] Fourth phase completed", (time.time() - start_time))


# In[86]:

def _join_list_text(data_lis):
    dictionary = {}
    for lis in list(data_lis):

        polarity = lis[1]
        elem = lis[0]

        if elem in dictionary.keys():
            dictionary[elem] += polarity
        else:
            dictionary[elem] = polarity

    return dictionary


def _join_list_token(data_lis):
    dictionary = {}
    for lis in data_lis:

        polarity = lis[1]
        elem = lis[0]
        elem = ' '.join(elem)

        if elem in dictionary.keys():
            dictionary[elem] += polarity
        else:
            dictionary[elem] = polarity

    return dictionary


def _join_list(data_lis):
    dictionary = {}
    for lis in data_lis:

        polarity = lis[1]
        sublist = lis[0]
        for elem in sublist:

            if elem in dictionary.keys():
                dictionary[elem] += polarity
            else:
                dictionary[elem] = polarity

    return dictionary


def _join_list_two(data_lis):
    dictionary = {}
    for lis in data_lis:

        polarity = lis[1]
        sublist = lis[0]
        for elem in sublist:
            elem = ' '.join(elem)

            if elem in dictionary.keys():
                dictionary[elem] += polarity
            else:
                dictionary[elem] = polarity

    return dictionary


def _sum_of_dict(list_of_dict):
    data_dict = {}
    for d in list_of_dict:
        for k, v in d.items():
            if d in data_dict.keys():
                data_dict[k] += v
            else:
                data_dict[k] = v

    return data_dict


# In[87]:


print("[Info] Fifth phase completed, merge ", (time.time() - start_time))

# In[88]:

review_df_final = review.groupby(['review_id', 'business_id']).agg({
    'text': _join_list_text,
    'tokens': _join_list_token,
    'stars': np.mean,
    'polarity': sum,
    'rule_one': _join_list,
    'rule_one_special': _join_list,
    'rule_two': _join_list_two,
    'rule_two_reduce': _join_list,
    'tf_idf': _sum_of_dict

}).reset_index()


# In[89]:

def create_set(lis):
    data_dict = {}
    for dicti in lis:
        for k, v in dicti.items():
            if k in data_dict.keys():
                data_dict[k].append(v)
            else:
                data_dict[k] = []
                data_dict[k].append(v)

    return data_dict


# In[90]:

review_df_final['final_pairs'] = review_df_final\
    .apply(lambda row: create_set([row['rule_one'], row['rule_one_special'], row['rule_two_reduce']]), axis=1)


review_df_final['final_pairs_reduced'] = review_df_final\
    .apply(lambda row: create_set([row['rule_one'], row['rule_two_reduce']]), axis=1)
# In[91]:

print("[Info] Sixth phase completed, pair created ", (time.time() - start_time))

# In[92]:

review_df_final.head(n=10)
columns = ['review_id', 'business_id', 'tokens', 'polarity', 'stars', 'text', 'final_pairs', 'tf_idf']
review_df = review_df_final[columns].copy()

# In[93]:

print(review_df_final.head(n=2))

to_mongo_db(review_df_final, 'yelp_reviews_terms_adj_noun_truncated')

print("[Info] Seventh  phase completed, written to DB ", (time.time() - start_time))
