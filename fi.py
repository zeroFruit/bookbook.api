from collections import Counter
from konlpy.tag import Twitter

keywords = []

def keyword_extract(filename): 
   f = open(filename)
   data = f.read()

   nlp = Twitter()
   nouns = nlp.nouns(data)

   count = Counter(nouns)
   words = count.most_common(40)

   keyword = words[0:3]

   for i in keyword:
   	word_freq_bid = [i[0],i[1],filename[:-4]]
   	keywords.append(word_freq_bid)

   f.close()
   return keywords

print(keyword_extract('1.txt'))