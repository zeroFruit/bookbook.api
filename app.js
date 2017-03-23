import express  from 'express';
import path     from 'path';
import os       from 'os';
import cors     from 'cors';
import rp       from 'request-promise';
import cheerio  from 'cheerio';

import Code from './config/responseCode';
import { getBestSellers, getBookIds, getReviewPages, getParagraph, getBookDetail } from './helper/parser';
import { responseByCode, removeReviews, analysis, recommand } from './helper/utils';

/*
  OS에 따라서 python-shell 모듈의 pythonPath 파이썬 경로를 바꿔줘야한다.
*/
const OS = os.type();

if (OS === 'Linux') {
  process.env.PYTHONPATH = '/usr/bin/python3';
} else if (OS === 'Windows_NT') {
  process.env.PYTHONPATH = '/usr/bin/python3';
}

const app = express();
const port = process.env.PORT || 8080;

/*
  Cross-Origin Resource Sharing Problem
*/
app.use(cors());



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
      .then((fileNames) => analysis(fileNames))
      .then((results) => {
        console.log('GET /keywords 200');
        return responseByCode(res, 200, Code.GET_SUCCESS, results);
      })
      .catch((err) => {
        if (err === 'HREF_NOT_FOUND') {
          res.status(404).send('GET /keywords 404 HREF_NOT_FOUND');
        } else {
          res.status(404).send('GET /keywords 404');
        }
      })
  });
});

app.get('/books', (req, res) => {
  recommand(JSON.parse(req.query.words))
    .then((bid) => getBookDetail(bid))
    .then((results) => {
      console.log('GET /books 200');
      return responseByCode(res, 200, Code.GET_SUCCESS, results);
    })
    .catch((err) => {
      console.log(err);
      res.status(404).send('GET /books 404');
    });
})

app.listen(port, () => {
  console.log(`Connected to ${port}`);
});
