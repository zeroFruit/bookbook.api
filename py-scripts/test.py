import sys

fileNames =  sys.argv

from collections import Counter
from konlpy.tag import Twitter
 
def keyword_extract(filename): 
   f = open(filename)
   data = f.read()

   nlp = Twitter()
   nouns = nlp.nouns(data)

   count = Counter(nouns)
   words = count.most_common(40)

   keyword = words[0:3]
   f.close()
   return keyword

print(keyword_extract(fileNames[1]))