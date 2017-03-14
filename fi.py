from collections import Counter
from konlpy.tag import Twitter
 
f = open('1.txt')
data = f.read()

nlp = Twitter()
nouns = nlp.nouns(data)

count = Counter(nouns)
words = count.most_common(40)

keyword = words[0:3]

print (words)

f.close()