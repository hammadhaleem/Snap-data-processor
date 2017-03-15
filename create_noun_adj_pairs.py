from __future__ import division

import json
import nltk
import numpy as np
import pandas as pd
import re
import time
from __builtin__ import len
from __builtin__ import list
from __builtin__ import str
from collections import Counter
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from nltk.stem import WordNetLemmatizer
from nltk.util import ngrams
from pymongo import MongoClient
from textblob import TextBlob

start_time = time.time()
data_dir = '/home/hammad/dev/yelp/txt_sentoken'
classes = ['pos', 'neg']

port_stemmmer = PorterStemmer()
word_net_lemmer = WordNetLemmatizer()

client = MongoClient()
db = client.yelp_comparative_analytics
allowed_words = ['not', 'no']
tags = set(['JJ', 'JJR', 'JJS', 'NN', 'NNS', 'NNP', 'NNPS'])


# In[2]:

def to_mongo_db(df, collection_name):
    records = json.loads(df.T.to_json()).values()
    db[collection_name].insert_many(records)


def _get_sentiment(star_polarity):
    if star_polarity >= 2.5:
        return 'pos'
    return 'neg'


# In[3]:

def get_sets():
    lis = []
    noun = ['NN', 'NNS', 'NNP', 'NNPS']
    adj = ['JJ', 'JJR', 'JJS']
    for n in noun:
        for a in adj:
            lis.append(a + "," + n)
            lis.append(n + "," + a)

    return set(lis)


def sum_new(lis):
    sum_i = 0
    for elem in lis:
        try:
            sum_i += float(elem)
        except:
            pass
    return sum_i


word_sets = list(get_sets())

# In[4]:

word_dictionary = {}
word_count = 0
stop_words = stopwords.words('english')

city = 'las_vegas'
bus_type = 'restaurants'
table = 'yelp_review_patterns_las_vagas_restaurant'

# In[ ]:
city = (raw_input("Enter city"))

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

# In[6]:

reviews_df['text'] = reviews_df.text.apply(lambda x: x.lower().strip())
reviews_df['sentances'] = reviews_df.text.apply(lambda x: nltk.sent_tokenize(x))

lis = []
for _, row in reviews_df.iterrows():
    row = row.to_dict()
    sentances = row['sentances'][:]
    for sen in sentances:
        row1 = row.copy()
        row1['text'] = sen
        del row1['sentances']
        lis.append(row1)

review = pd.DataFrame(lis)
print("[Info] Load and clean dataframe", (time.time() - start_time))

# In[7]:

review['polarity'] = review.text.apply(lambda x: TextBlob(x).sentiment.polarity)
review['star_polarity'] = review['polarity'] + reviews_df['stars']
review['sentiment'] = review.star_polarity.apply(lambda x: _get_sentiment(x))
print("[Info] Get polarity", (time.time() - start_time))


# In[8]:



def format_word_split(txt):
    """Turns a text document to a list of formatted words.
    Get rid of possessives, special characters, multiple spaces, etc.
    """
    tt = re.sub(r"'s\b", '', txt).lower()  # possessives
    tt = re.sub(r'[\.\,\;\:\'\"\(\)\&\%\*\+\[\]\=\?\!/]', '', tt)  # weird stuff
    tt = re.sub(r'[\-\s]+', ' ', tt)  # hyphen -> space
    tt = re.sub(r' [a-z] ', ' ', tt)  # single letter -> space
    tt = re.sub(r' [0-9]* ', ' ', tt)  # numbers

    tt = re.sub('\W+', ' ', tt)
    tt = tt.split(" ")

    ret = []
    for elem in tt:
        if (elem not in stop_words) or (elem in allowed_words):
            ret.append(elem)

    tt = ' '.join(ret)
    return tt.strip()


# In[9]:

def token_ze(text):
    text = format_word_split(text)
    tokens = nltk.word_tokenize(text)
    return tokens


# In[10]:

review['tokens'] = review.text.apply(lambda x: token_ze(x))
print("[Info] grams ", (time.time() - start_time))
review.head()


# In[11]:

def get_only_selected_types(list_of_elem):
    dict_i = {}
    for item in list_of_elem:
        if (item[1] in tags) or (item[0] in allowed_words):
            dict_i[item[0]] = item[1]
    return dict_i


def get_selected_words(dict_i):
    lis = list(dict_i.keys())
    return lis


# In[12]:

review['pos_tagged'] = review.text.apply(lambda x: nltk.pos_tag(nltk.word_tokenize(x)))
review['selected'] = review.pos_tagged.apply(lambda x: get_only_selected_types(x))
review['selected_words'] = review.selected.apply(lambda x: get_selected_words(x))
print("[Info] Zero phase completed", (time.time() - start_time))


# In[13]:

def intersections(grams, allowed):
    new_grams = []
    for gram in grams:
        gram_i = gram.split(" ")
        ct = 0
        for elem in gram_i:
            if elem not in allowed:
                ct = 1
        if ct == 0:
            new_grams.append(gram)
    return new_grams


def get_tfidf(seq):
    return Counter(seq)


# In[14]:

review['new_tokens'] = review.apply(lambda x: intersections(x['tokens'], x['selected_words']), axis=1)
review['tf_idf'] = review.new_tokens.apply(lambda x: get_tfidf(x))
print("[Info] First phase completed", (time.time() - start_time))


# In[15]:

def get_ngrams(token, number=2):
    return [' '.join(x) for x in list(set(ngrams(token, number)))]


# In[16]:

review['bi_grams'] = review.new_tokens.apply(lambda x: get_ngrams(x, 2))
review['tri_grams'] = review.new_tokens.apply(lambda x: get_ngrams(x, 3))
print("[Info] Third phase completed", (time.time() - start_time))
review.head()


# In[17]:

def create_adv_noun_pairs(word_pair_lis, selected):
    big_lis = []

    for word_pair in word_pair_lis:
        lis = []
        word_pair_split = word_pair.split(" ")
        for elem in word_pair_split:
            lis.append((elem, selected[elem]))

        if len(lis) == 2:
            lis = sorted(lis, key=lambda x: x[1], reverse=False)

        lis = [x[0] for x in lis]
        ret = ' '.join(lis)
        big_lis.append(ret)

    return big_lis


def _get_adv_noun_pairs(words_list, selected, word_sets):
    ret_list = []

    for word in words_list:
        allowed_word_found = 1
        word_tmp = word.split(" ")
        lis = []
        for elem in word_tmp:
            if elem in allowed_words:
                allowed_word_found = 0
            lis.append(selected[elem])

        types = ','.join(lis)
        if types in word_sets:
            ret_list.append(word)

        elif allowed_word_found is 0:
            ret_list.append(word)

    return ret_list


# In[18]:

review['bi_grams'] = review.apply(lambda x: _get_adv_noun_pairs(x['bi_grams'], x['selected'], word_sets), axis=1)
review['bi_grams'] = review.apply(lambda x: create_adv_noun_pairs(x['bi_grams'], x['selected']), axis=1)
review['count'] = 1
print("[Info] Fourth phase completed", (time.time() - start_time))
review.head()


# In[19]:
def _get_sentiment_arr(x):
    lis = []
    for elem in x:
        lis.append((TextBlob(elem).sentiment.polarity, elem))
    return lis


review['bi_grams'] = review.bi_grams.apply(lambda x: _get_sentiment_arr(x))
review['tri_grams'] = review.tri_grams.apply(lambda x: _get_sentiment_arr(x))
review['filter'] = review.bi_grams.apply(lambda x: len(x))
print("[Info] Fifth phase completed", (time.time() - start_time))


def sum_of_list(list_of_lists):
    dict_x = {}
    for lis in sorted(list_of_lists):
        for elem in lis:
            try:
                dict_x[elem[1]] = float(elem[0]) + dict_x[elem[1]]
            except:
                try:
                    dict_x[elem[1]] = float(elem[0])
                except:
                    pass

    lis = [(k, v) for k, v in dict_x.items()]

    return dict_x


def sum_of_dict(list_of_dict):
    dict_lis = {}
    for dic in list_of_dict:
        for key in dic.keys():
            try:
                dict_lis[key] += dic[key]
            except:
                dict_lis[key] = dic[key]

    return dict_lis


def extend_list(list_):
    l = []
    for elem in list(list_):
        l.append(' '.join(elem))
    return '|'.join(l)


review['tokens'] = review['new_tokens']
reviews_df = review[
    ['review_id', 'business_id', 'stars', 'tri_grams', 'bi_grams', 'count', 'polarity', 'tf_idf', 'tokens']] \
    .groupby(['review_id', 'business_id']).agg({
    'tri_grams': sum_of_list,
    'bi_grams': sum_of_list,
    'count': sum,
    'polarity': np.mean,
    'tf_idf': sum_of_dict,
    'stars': np.mean,
    'tokens': extend_list
}).reset_index().sort_values('polarity')

print("[Info] Grouped together", (time.time() - start_time))

print(reviews_df.head())

to_mongo_db(reviews_df, 'yelp_reviews_analysis_adj_noun_restaurants_tokens')
print("[Info] Written", (time.time() - start_time))
