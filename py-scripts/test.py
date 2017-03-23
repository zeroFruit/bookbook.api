import sys, codecs

fileNames =  sys.argv

from collections import Counter
from konlpy.tag import Twitter

keywords = []

def keywords_extract(filename):
   f = codecs.open('./reviews/'+ filename,"r", "utf-8")
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

for n in range(1, 6):
	keywords_extract(fileNames[int(n)])

print(keywords) 
