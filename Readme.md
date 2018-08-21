### Connection to remote server
Connect to the remote mongoDB server: `ssh -L 27017:localhost:27017 my_dummy_username@143.89.191.15`
      
### Steps to run 
1. Clone the repository 

2. Intall the dependencies : ` pip2 install flask flask_cache flask_pymongo pandas sklearn nltk pymongo textblob gensim`

3. Run `python run.py`

Paper: https://onlinelibrary.wiley.com/doi/abs/10.1111/cgf.13401

### Towards Easy Comparison of Local Businesses Using Online Reviews

With the rapid development of e‐commerce, there is an increasing number of online review websites, such as Yelp, to help customers make better purchase decisions. Viewing online reviews, including the rating score and text comments by other customers, and conducting a comparison between different businesses are the key to making an optimal decision. However, due to the massive amount of online reviews, the potential difference of user rating standards, and the significant variance of review time, length, details and quality, it is difficult for customers to achieve a quick and comprehensive comparison. In this paper, we present E‐Comp, a carefully‐designed visual analytics system based on online reviews, to help customers compare local businesses at different levels of details. More specifically, intuitive glyphs overlaid on maps are designed for quick candidate selection. Grouped Sankey diagram visualizing the rating difference by common customers is chosen for more reliable comparison of two businesses. Augmented word cloud showing adjective‐noun word pairs, combined with a temporal view, is proposed to facilitate in‐depth comparison of businesses in terms of different time periods, rating scores and features. The effectiveness and usability of E‐Comp are demonstrated through a case study and in‐depth user interviews.
