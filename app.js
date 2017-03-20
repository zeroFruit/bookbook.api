import express from 'express';
import path from 'path';

const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


import rp from 'request-promise';
import cheerio from 'cheerio';
import pyShell from 'python-shell';

import {getBestSellers} from './helper/parser';
import {getBookIds, getReviewPages, getParagraph, removeReviews} from './helper/utils';

const BESTSELLER_LIST_URL = 'http://book.naver.com/bestsell/bestseller_list.nhn?cp=kyobo';

const options = {
  uri: BESTSELLER_LIST_URL,
  transform: (body) => {
    return cheerio.load(body);
  }
};

app.get('/keywords', (req, res) => {
  removeReviews().then(() => {
    rp(options)
      .then(($) => getBestSellers($))
      .then((hrefs) => getBookIds(hrefs))
      .then((bids) => getReviewPages(bids))
      .then((list) => getParagraph(list))
      .then((fileNames) => {
        const options = {
          mode: 'text',
          scriptPath: 'py-scripts/',
          args: fileNames
        };

        pyShell.run('test.py', options, (err, results) => {
          if (err) {
            console.log('error:', err);
          } else {
            console.log('result:', results);
          }
          res.send(results);
        });
      })
      .catch((err) => {
        console.log(err);

        if (err === 'HREF_NOT_FOUND') {
          res.status(404).send(err);
        } else {
          res.status(404).send('fail');
        }
      })
  });
});

app.listen(port, () => {
  console.log(`Connected to ${port}`);
});
