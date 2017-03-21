# coding: utf-8

# In[285]:

from __future__ import division
from __builtin__ import len
from __builtin__ import list
from __builtin__ import str

words = ['is', 'be', 'are', 'was', 'were', 'been']
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

port_stemmmer = PorterStemmer()
word_net_lemmer = WordNetLemmatizer()

client = MongoClient()
db = client.yelp_comparative_analytics
allowed_words = ['not', 'no']
tags = set(['JJ', 'JJR', 'JJS', 'NN', 'NNS', 'NNP', 'NNPS'])

noun = ['NN', 'NNS', 'NNP', 'NNPS']
adj = ['JJ', 'JJR', 'JJS']
# stop_words = set(list(stopwords.words('english')) + ['id' , 'youll' ,'youd'  , 'mr' , 'youll' , 'thru' , 'tues' ]) - set(words)

stop_words = ['id', 'youll', 'youd', 'mr', 'youll', 'thru', 'tues']

# In[285]:


city = raw_input('Enter City ')
bus_type = 'restaurants'

# In[286]:

from nltk.tag.stanford import StanfordPOSTagger

path_to_model = "std/models/english-bidirectional-distsim.tagger"
path_to_jar = "std/stanford-postagger.jar"
tagger = StanfordPOSTagger(path_to_model, path_to_jar)
tagger.java_options = '-mx14096m'  ### Setting higher memory limit for long sentences
sentence = 'This is testing'

# In[287]:

word_dictionary_expand = {
    "woudn't": 'would not',
    "woudnt": 'would not',

    "shouldn't": "should not",
    "shouldnt": "should not",

    "can't": "cannot",
    "cant": "cannot",

    "$": "dollar",
    "%": 'percentage',

    "mustn't": "must not",
    "mustnt": "must not",

    "couldn't": "could not",
    "couldn't": "could not",

    "ain't": "are not",
    "aint": "are not",

    "aren't": "are not",
    "arent": "are not",

    "you'll": "you will",
    "youll": "you will",

}


# In[288]:

def to_mongo_db(df, collection_name):
    records = json.loads(df.T.to_json()).values()
    db[collection_name].insert_many(records)


def _get_sentiment(star_polarity):
    if star_polarity >= 2.5:
        return 'pos'
    return 'neg'


# In[289]:

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


# In[290]:

word_dictionary = {}
word_count = 0

# In[291]:

business = [x['business_id'] for x in
            list(db.yelp_business_information_processed.find({'type': bus_type, 'city': city}, {'business_id': 1}))]
print("[Info] Total business " + str(len(business)), 'time from start', (time.time() - start_time))

# business = ['4gXdyihRiytmXEAfqLNMBw']
query = {
    'business_id': {'$in': business}
}
raw = list(db.yelp_reviews.find(query, {'business_id': 1, 'text': 1, 'stars': 1, 'review_id': 1}))
print("[Info] Total elements " + str(len(raw)), 'time from start', (time.time() - start_time))

reviews_df = pd.DataFrame(raw)
reviews_df = reviews_df.drop('_id', axis=1)

# In[292]:

reviews_df['text'] = reviews_df.text.apply(lambda x: x.lower().strip())
reviews_df['sentances'] = reviews_df.text.apply(lambda x: nltk.sent_tokenize(x))


def fix_df(reviews_df):
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
    return review


review = fix_df(reviews_df)
print("[Info] Load and clean dataframe", (time.time() - start_time))


# In[293]:

def format_word_split(txt):
    """Turns a text document to a list of formatted words.
    Get rid of possessives, special characters, multiple spaces, etc.
    """
    tt = txt.lower().strip()

    for word in word_dictionary_expand.keys():
        tt = tt.replace(word, word_dictionary_expand[word])

    tt = re.sub('[^A-Za-z0-9]+', ' ', tt)

    return tt


# In[294]:

review['polarity'] = review.text.apply(lambda x: TextBlob(x).sentiment.polarity)
review['text'] = review.text.apply(lambda x: format_word_split(x))
print("[Info] Get polarity", (time.time() - start_time))
review.head()

# In[295]:

review['tokens'] = review.text.apply(lambda x: nltk.word_tokenize(x))
review['tf_idf'] = review.tokens.apply(lambda x: get_tfidf(x))
review['pos_tagged'] = review.tokens.apply(lambda x: nltk.pos_tag(x))
print ("[Info] -2 phase completed ", (time.time() - start_time))

# In[296]:

# review['pos_tagged_stan'] = review.tokens.apply(lambda x: tagger.tag(x))
print("[Info] -1 phase completed ", (time.time() - start_time))
review.head(n=2)


# In[297]:
# rule one only extract adj , noun pairs
def get_sets():
    lis = []
    for n in noun:
        for a in adj:
            lis.append(a + "," + n)
            # lis.append(n +","+ a)

    return set(lis)


word_sets = list(get_sets())
print(" Only find word_sets", word_sets)


def get_rule_one(text, tags):
    ret = []
    ct = 1
    while ct < len(tags):
        pair_tag = (tags[ct - 1][1] + "," + tags[ct][1])
        if pair_tag in word_sets:
            #             print pair_tag, tags[ct-1][0] +" "+ tags[ct][0],"||", text
            ret.append(tags[ct - 1][0] + " " + tags[ct][0])
        ct += 1
    return ret


# In[298]:

# review['rule_one_stan'] = review.apply(lambda x: get_rule_one(x['text'], x['pos_tagged_stan']), axis=1)
print("[Info] First phase completed", (time.time() - start_time))

# In[299]:

review['rule_one'] = review.apply(lambda x: get_rule_one(x['text'], x['pos_tagged']), axis=1)
print("[Info] First phase completed", (time.time() - start_time))
review.head()

# In[315]:

templates = [
    (adj, words, noun)
]


def find_rules_based_templates(tokens, text, rule_one):
    ret = []
    noun_index = None
    ct = 0
    while ct < len(tokens):
        #         print ct,(tokens),tokens[ct], len(tokens)
        if tokens[ct][1] in noun:
            noun_index = ct

        if tokens[ct][0] in words:
            tmp = ct
            adj_index = None
            while tmp < len(tokens) and noun_index is not None:
                if tokens[tmp][1] in adj:
                    adj_index = -1
                    break
                tmp += 1
            if adj_index == -1:
                adj_index = tmp
                ret.append(tokens[adj_index][0] + " " + tokens[noun_index][0])

        ct += 1

    return ret


text = 'staff was very outgoing and friendly'
t = nltk.pos_tag(nltk.word_tokenize(text))
r = find_rules_based_templates(t, text, [])
print("[Info] words", words, (time.time() - start_time))

# In[316]:

review['rule_two'] = review.apply(lambda x: find_rules_based_templates(x['pos_tagged'], x['text'], x['rule_one']),
                                  axis=1)
print("[Info] 1 phase completed", (time.time() - start_time))


def _join__(lis1, lis2):
    ret = []

    for elem in lis1:
        ret.append(elem)
    for elem in lis2:
        ret.append(elem)

    return ret


review['final'] = review.apply(lambda x: _join__(x['rule_one'], x['rule_two']), axis=1)

print("[Info] 2 phase completed", (time.time() - start_time))

review.head(n=1)

review_f = review.copy()

review_f['text'] = review_f.apply(lambda x: (x['text'], x['polarity']), axis=1)
review_f['tokens'] = review_f.apply(lambda x: (x['tokens'], x['polarity']), axis=1)
review_f['rule_one'] = review_f.apply(lambda x: (x['rule_one'], x['polarity']), axis=1)
review_f['rule_two'] = review_f.apply(lambda x: (x['rule_two'], x['polarity']), axis=1)
review_f['final'] = review_f.apply(lambda x: (x['final'], x['polarity']), axis=1)


def _join_list_text(text):
    ret_dict = {}
    for line in text:
        pol = line[1]
        line = line[0]

        if line in ret_dict.keys():
            ret_dict[''.join(line)] += pol
        else:
            ret_dict[''.join(line)] = pol

    return ret_dict


def _join_list_list(text):
    ret_dict = {}
    for line in text:
        pol = line[1]
        line = line[0]

        if len(line) > 0:
            if line in ret_dict.keys():
                ret_dict[' '.join(line)] += pol
            else:
                ret_dict[' '.join(line)] = pol

    return ret_dict


# In[320]:

def _sum_of_dict(list_of_dict):
    data_dict = {}
    for d in list_of_dict:
        for k, v in d.items():
            if d in data_dict.keys():
                data_dict[k] += v
            else:
                data_dict[k] = v

    return data_dict


review_df = review_f.groupby(['review_id', 'business_id']).agg({
    'text': _join_list_text,
    'tokens': _join_list_list,
    'stars': np.mean,
    'polarity': sum,
    'rule_one': _join_list_list,
    'rule_two': _join_list_list,
    'tf_idf': _sum_of_dict,
    'final': _join_list_list
}).reset_index()

# In[322]:

# review_df.head()


# In[323]:

print("[Info] Sixth phase completed, pair created ", (time.time() - start_time))

review_df.head(n=10)

print("[Info] Seventh  phase completed, written to DB ", (time.time() - start_time))

print(review_df.head(n=2))

to_mongo_db(review_df, 'yelp_reviews_terms_adj_noun_truncated')

print("[Info] Seventh  phase completed, written to DB ", (time.time() - start_time))


# In[264]:




# In[264]:




# In[264]:




# In[ ]:
