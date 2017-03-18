# coding: utf-8

import gensim, logging
import pandas as pd
from __builtin__ import len

from __builtin__ import list
from __builtin__ import str
import json
import time

from pymongo import MongoClient

logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

start_time = time.time()

food = [u'all-day', u'all-you-can-eat', u'american-style', u'ancestry', u'appetiser', u'appetizer', u'appetizers',
        u'asian-fusion', u'asian-inspired', u'authentically', u'b-fast', u'bento', u'bfast', u'bistros', u'bland',
        u'breakfast', u'breakfast-', u'breakfast..', u'breakfast/', u'brunch', u'buffet', u'burrito', u'chewy',
        u'chimi', u'chimichanga', u'chimichangas', u'chimis', u'chirachi', u'chirashi', u'chunkier', u'confections',
        u'countries', u'courses', u'creamier', u'crispier', u'cuisine', u'curry', u'delectables', u'delicacies',
        u'delicacy', u'delights', u'desert', u'deserts', u'dessert', u'dessert-', u'dessert..', u'desserts', u'dinner',
        u'dinner/drinks', u'dinner/lunch', u'dinners', u'dinnertime', u'dish', u'donburi', u'double-date', u'dressing',
        u'eatery', u'enchiladas', u'enchilladas', u'flautas', u'flavor', u'food', u'foodstuffs', u'frittatas',
        u'fushion', u'fusion', u'futomaki', u'gastronomy', u'get-together', u'gingery', u'gobernador', u'goodies',
        u'gordita', u'gorditas', u'greasy', u'grocers', u'handrolls', u'healthiest', u'heat/spice', u'hoisiny',
        u'hot/spicy', u'hotness', u'hotter', u'huaraches', u'ikura', u'inari', u'indian', u'item', u'items', u'kbbq',
        u'lunch', u'lunch/brunch', u'lunch/dinner', u'lunch/early', u'luncheon', u'luncheons', u'lunches', u'lunchtime',
        u'lunchtimes', u'maguro', u'mains', u'maki', u'makis', u'meal', u'meal-', u'meal..', u'meals', u'medium-hot',
        u'meet-up', u'meetings', u'mexican', u'mid-afternoon', u'mid-day', u'mid-week', u'midday', u'mild', u'milder',
        u'mildest', u'nagiri', u'nationalities', u'negitoro', u'night', u'night-', u'night..', u'nightcap', u'nights',
        u'nigiri', u'nigiris', u'nigri', u'nite', u'non-ayce', u'non-spicy', u'noodle', u'noodles', u'noon',
        u'noontime', u'offerings', u'oily', u'omelets', u'omelettes', u'omletes', u'omlets', u'omlette', u'omlettes',
        u'organics', u'over-salted', u'over-seasoned', u'oversalted', u'overseasoned', u'oyako', u'pan-asian',
        u'panacotta', 'pasta', u'peppery', u'pescado', u'pizza', u'place', u'place..', u'plate', u'post-work',
        u'pre-pinkberry', u'profiteroles', u'quesadilla', u'quesadillas', u'quesedilla', u'quesedillas', u'quesidilla',
        u'quesidillas', u'quisine', u'revelation', u'run-of-the-mill', u'saltier', u'saltiness', u'salty', u'salty..',
        u'sashimi', u'sashmi', u'sauce', u'sauces', u'sause', u'scramblers', u'scrambles', u'seasoning', u'semifreddo',
        u'sourness', u'spice', u'spices', u'spiciness', u'spicy', u'spicy/hot', u'spicyness', u'suace', u'sushi',
        u'sushi/sashimi', u'sushimi', u'sweeter', u'sweetness', u'taco', u'tacos', u'taquito', u'taquitos', u'temaki',
        u'tinga', u'tiramasu', u'tiramisu', u'tomatoey', u'tortas', u'tostada', u'tostado', u'tripas', u'unagi',
        u'vampiros', u'westernized', u'yummies']
price = [u'*prices', u'-prices', u'.prices', u'50cents', u'adequate', u'afforable', u'affordable', u'average', u'bang-',
         u'best', u'better', u'buck', u'buck-', u'buck..', u'buck..and', u'buck..well', u'buckl', u'bucks', u'bucks-',
         u'bucks..', u'budget-friendly', u'cent', u'cents', u'cents-', u'cents..', u'charge', u'charged', u'cheap',
         u'cheap-', u'cheap..', u'cheaper', u'cheapest', u'cheep', u'cheeper', u'comparable', u'cost', u'costed',
         u'costing', u'costlier', u'costly', u'costs', u'decent', u'decent-', u'descent', u'dlls', u'dolla',
         u'dolla-dolla', u'dollah', u'dollar', u'dollars', u'dollars..', u'dollas', u'economical', u'euros',
         u'expensive', u'expensive..', u'fairest', u'fares', u'fees', u'high-priced', u'higher', u'inexpensive',
         u'low-priced', u'lowest', u'mark-up', u'markup', u'mediocre', u'mins..', u'one-dolla', u'over-hyped',
         u'over-priced', u'over-rated', u'overhyped', u'overprice', u'overpriced', u'overpriced-', u'overpriced..',
         u'percent', u'pounds', 'price', u'price-', u'price-point', u'price-tag', u'price-wise', u'price..', u'priced',
         u'priced-', u'priced-i', u'priced..', u'priced/high', u'pricepoint', u'pricer', u'prices', u'prices-',
         u'prices..', u'pricetag', u'pricey', u'pricey-', u'pricey..', u'pricier', u'priciest', u'pricing', u'pricy',
         u'pricy..', u'priices', u'quid', u'rate', u'rates', u'reasonable', u'reasonable-', u'reasonable..',
         u'reasonably-priced', u'rents', u'resonable', u'so-so', u'spendy', u'steep', u'steeper', u'tariff', u'tastier',
         u'tax/tip', u'unbeatable', u'underpriced', u'well-priced']
place = [u'-location', u'after-work', u'afterwork', u'ambiance', u'ambience', u'athmosphere', u'atmoshere',
         u'atmoshpere', u'atmospher', u'atmosphere', u'atmosphere-', u'atmosphere..', u'atmostphere', u'atomosphere',
         u'atomsphere', u'aura', u'bakeries', u'bar-ish', u'bar-type', u'bar/club', u'bar/grill', u'bar/lounge',
         u'bar/pub', u'bar/restaurant', u'bars/restaurants', u'baseline', u'blvd.', u'bofa', u'branch', u'branches',
         u'brewpubs', u'brews-chetta', u'buffets', u'chill', u'chillax', u'chipotles', u'churrascarias', u'coffeeshop',
         u'coffeeshops', u'commons', u'costcos', u'cusine', u'decatur', u'deco', u'decor', u'decor-', u'decor..',
         u'decorating', u'decoration', u'decorations', u'decore', u'decors', u'decour', u'delicatessen', u'delis',
         u'destinations', u'digs', u'dysart', u'eateries', u'eatery', u'echiza', u'enviorment', u'enviornment',
         u'enviroment', u'environment', u'environs', u'establishment', u'establishments', u'fancier', u'fanciest',
         u'flori', u'franchises', u'gastro-pub', u'gastropub', u'germann', u'go-tos', u'guadalupe', u'hang -outs',
         u'hangout', u'hangouts', u'haunt', u'haunts', u'higley', u'hitmaker', u'hot-spot', u'hotspot', u'hotspots',
         u'hualapai', u'i-215', u'interior', u'interiors', u'izakayas', u'joint', u'joint-', u'joint..', u'joint/bar',
         u'joints', u'kyrene', u'locale', u'locales', u'location', u'location-', u'location-wise', u'location..',
         u'locations', u'locations-', u'lounge/bar', u'meet-up', u'mid-century', u'minimalistic', u'mortons', u'motif',
         u'murals', u'natured', u'oakey', u'ornaments', u'outpost', u'parkway', u'paydirt', u'pecos', u'pizzaria',
         u'pizzerias', u'pkway', u'pkwy', u'place', u'places', u'promenade', u'pub/bar', u'pub/restaurant',
         u'restaraunt', u'restaraunts', u'restaruant', u'restaurant', u'restaurant-', u'restaurant..',
         u'restaurant/bar', u'restaurants', u'restaurants..', u'resteraunt', u'resteraunts', u'resto', u'restos',
         u'restraunt', u'restraunts', u'restuarant', u'restuarants', u'resturant', u'resturants', u'resturaunt',
         u'sportsbar', u'spot', u'spot-', u'spot..', u'spots', u'steakhouse', u'steakhouses', u'subways', u'taquerias',
         u'tra\xeen\xe9', u'unwind', u'urru', u'v ibe', u'vibe', u'vibe-', u'vibe..', u'vibes', u'walmarts',
         u'well-decorated', u'windmill']
service = [u'*service', u'-customer', u'-price', u'-service', u'-staff', u'.service', u'.staff', u'adviser',
           u'advisers', u'advisor', u'advisors', u'assistants', u'associates', u'attentionn\xe9', u'attentiveness',
           u'barkeeps', u'bartenders', u'cashiers', u'clerks', u'clients', u'competence', u'competency', u'consultants',
           u'consumers', u'costomer', u'costumer', u'costumers', u'courtois', u'coustomer', u'cust', u'customer',
           u'customer-service', u'customer..', u'customers', u'customers-', u'customers..', u'custumer', u'cutomer',
           u'dance/twirk', u'employee', u'employees', u'employer', u'employes', u'expereince', u'experiance',
           u'experience-', u'experience..', u'experiences', u'experince', u'expertise', u'expierence',
           u'friendly/customer', u'guests', u'hairdresser', u'hairstylist', u'healthy-mind', u'helpfulness',
           u'hostesses', u'hygiene', u'hygienic', u'hygienists', u'impecable', u'manouver', u'minuses', u'm\xe9diocre',
           u'non-customer-service', u'nurses', u'owner/staff', u'owners/staff', u'patients', u'patrons', u'people',
           u'personel', u'personnel', u'promptness', u'providers', u'public-service', u'punctuality', u'rapide',
           u'receptionist', u'receptionists', u'representatives', u'reps', u'reps.', u'responsiveness', u'secretaries',
           u'sector-', u'serice', u'serivce', u'serive', u'server', u'servers', u'service', u'service-', u'service.',
           u'service..', u'service.i', u'service.the', u'service=', u'severs', u'sevice', u'sincerity', u'staf',
           u'staff', u'staff-', u'staff..', u'staff/owner', u'staff/owners', u'staff/service', u'staff=', u'staffers',
           u'staffs', u'stylist', u'thoroughness', u'wait-staff', u'waiter', u'waiters', u'waiters/waitresses',
           u'waitress', u'waitresses', u'waitstaff', u'worker', u'workers']

# In[37]:

client = MongoClient()
db = client.yelp_comparative_analytics
categories = {
    'food': food,
    'price': price,
    'place': place,
    'service': service
}


# In[38]:

def to_mongo_db(df, collection_name):
    records = json.loads(df.T.to_json()).values()
    db[collection_name].insert_many(records)


# In[6]:

print("Try loading model")
model  =  gensim.models.Word2Vec.load('deep/all-rest.word2vec.model')
word_vectors = model.wv
del model

print ("Loaded model")

# In[39]:

raw = list(db.yelp_reviews_terms_adj_noun.find().limit(10))
print("[Info] Total elements " + str(len(raw)), 'time from start', (time.time() - start_time))
review = pd.DataFrame(raw)

# In[46]:

ret_list = []
for _, row in review.iterrows():
    _scores_ = {}
    del row['_id']
    del row['rule_one']
    del row['rule_one_special']
    del row['rule_two']
    del row['rule_two_reduce']

    tags = row['final_pairs']
    if len(set(tags.keys())) > 0:
        for key in tags.keys():
            _scores_[key] = {}
            word = key.split(" ")
            for categor in categories.keys():
                score_cat = 0
                for elem in categories[categor]:
                    try:
                        score_cat = + word_vectors.similarity(word, elem)
                    except:
                        pass

                _scores_[key][categor] = score_cat
    row['score'] = _scores_
    ret_list.append(row)
    if len(ret_list) > 2000:
        df = pd.DataFrame(ret_list)
        to_mongo_db(df, 'yelp_review_scored_pairs')
        print ("Written to DB", len(ret_list), 'time from start', (time.time() - start_time))
        ret_list = []

df = pd.DataFrame(ret_list)
to_mongo_db(df, 'yelp_review_scored_pairs')
print ("Written to DB", len(ret_list), 'time from start', (time.time() - start_time))