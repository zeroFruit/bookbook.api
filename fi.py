from collections import Counter
from konlpy.tag import Twitter

keywords = []

def keyword_extract(filename): 
   f = open(filename)
   data = f.read()

   nlp = Twitter()
   nouns = nlp.nouns(data)


   f.close()
   return nouns

print(keyword_extract('1.txt'))