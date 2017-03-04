# coding: utf-8
from __future__ import division

import json
import pandas as pd
import re
from __builtin__ import len
from __builtin__ import list
from __builtin__ import open
from __builtin__ import str
from collections import Counter
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer, WordNetLemmatizer
from pymining import assocrules
from pymining import itemmining
from pymining import seqmining
from pymongo import MongoClient

port_stemmmer = PorterStemmer()
word_net_lemmer = WordNetLemmatizer()

client = MongoClient()
db = client.yelp_comparative_analytics

raw = list(db.yelp_reviews.find({}))
print("[Info] Total elements " + str(len(raw)))

reviews_df = pd.DataFrame(raw)
word_dictionary = {}
word_count = 0
stop_words = set(stopwords.words('english'))


def combine_text(rows):
    lis = []
    for row in set(rows):
        lis.append(row)
    return lis


def remove_stop_words(sentence):
    global word_count
    global word_dictionary
    _data = []
    _encoded = []

    for elem in sentence.lower().split():
        if elem not in stop_words:
            elem = word_net_lemmer.lemmatize(elem)
            if elem in word_dictionary.keys():
                _encoded.append(str(word_dictionary[elem]))
                _data.append(elem)
            else:
                word_dictionary[elem] = str(word_count)
                _encoded.append(word_dictionary[elem])
                _data.append(elem)
                word_count += 1

    return _encoded


def format_word_split(txt):
    """Turns a text document to a list of formatted words.
    Get rid of possessives, special characters, multiple spaces, etc.
    """
    tt = re.sub(r"'s\b", '', txt).lower()  # possessives
    tt = re.sub(r'[\.\,\;\:\'\"\(\)\&\%\*\+\[\]\=\?\!/]', '', tt)  # weird stuff
    tt = re.sub(r'[\-\s]+', ' ', tt)  # hyphen -> space
    tt = re.sub(r' [a-z] ', ' ', tt)  # single letter -> space

    return remove_stop_words(tt.strip())


def for_each_elem(lis):
    row = []
    for elem in lis:
        row.append(format_word_split(elem))
    return row


def get_sequences(seqs, size):
    freq_seqs = seqmining.freq_seq_enum(seqs, size)
    return freq_seqs


def get_association_rules(seqs):
    transactions = list(seqs)
    relim_input = itemmining.get_relim_input(transactions)
    item_sets = itemmining.relim(relim_input, min_support=2)
    rules = assocrules.mine_assoc_rules(item_sets, min_support=2, min_confidence=0.5)
    return rules


def frequent_itemset(transactions, support=2):
    relim_input = itemmining.get_relim_input(transactions)
    report = itemmining.relim(relim_input, min_support=2)
    return report


def get_tfidf(seq):
    l = []
    for elem in seq:
        l.extend(elem)

    count = Counter(l)
    return count


def to_mongo_db(df, collection_name):
    records = json.loads(df.T.to_json()).values()
    db[collection_name].insert_many(records)


count = 0
tmp = 500
total = len(reviews_df)

business = sorted(list(reviews_df.business_id.unique()))

print("[Info] Started")

while count <= total:
    mask = reviews_df['business_id'].isin(business[count: count + tmp])

    grouped_review = pd.DataFrame(reviews_df[mask].groupby('business_id').apply(lambda x: combine_text(x.text))).copy()
    grouped_review.columns = ['text']
    grouped_reviews = grouped_review.reset_index()

    grouped_reviews['split_text'] = grouped_reviews.text.apply(lambda x: for_each_elem(x))
    grouped_reviews['count'] = grouped_reviews.split_text.apply(lambda x: len(x))

    open("data/word_dict.json", "w+").write(json.dumps(word_dictionary))

    gp_cy = grouped_reviews.copy()
    print("[Info] Processing " + str(len(grouped_reviews)) + " businesses")

    gp_cy['tfidf'] = gp_cy.split_text.apply(lambda x: get_tfidf(x))
    print("[Info] count = {count} stage = {stage}".format(count=count, stage='tfidf'))

    gp_cy['sequence_2'] = gp_cy.split_text.apply(lambda x: get_sequences(x, 2))
    print("[Info] count = {count} stage = {stage}".format(count=count, stage='sequence_2'))

    # gp_cy['sequence_3'] = gp_cy.split_text.apply(lambda x: get_sequences(x, 3))

    gp_cy['frequent_item_2'] = gp_cy.split_text.apply(lambda x: frequent_itemset(x, 2))
    print("[Info] count = {count} stage = {stage}".format(count=count, stage='frequent_item_2'))

    # gp_cy['frequent_item_3'] = gp_cy.split_text.apply(lambda x: frequent_itemset(x, 3))

    gp_cy['association_rules'] = gp_cy.frequent_item_2.apply(lambda x: get_association_rules(x))
    print("[Info] count = {count} stage = {stage}".format(count=count, stage='association_rules'))

    gp_cy.to_csv('data/final_df_' + str(count) + '.csv')

    # to_mongo_db(gp_cy, 'yelp_reviews_associations')

    count += tmp

    print('[Info] Total ' + str(total - count) + " done " + str(count))
