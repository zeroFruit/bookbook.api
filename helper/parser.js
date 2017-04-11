import qs       from 'qs';
import request  from 'request';
import rp       from 'request-promise';
import cheerio  from 'cheerio';
import iconv    from 'iconv-lite';
import fs       from 'fs';
import glob     from 'glob';

const NUMBER_OF_BOOKS = 5;

const getBestSellers = ($) => {
  let index = 0;
  let hrefs = [];

  return new Promise((resolve, reject) => {
    while (index < NUMBER_OF_BOOKS) {
      let href = $(`#book_title_${index}`).children('a').attr('href');

      if (!href) {
        return reject(new Error('HREF_NOT_FOUND'));
      }

      hrefs.push(href);
      index++;
    }

    return resolve(hrefs);
  });
}

const getBookIds = (hrefs) => {

  return new Promise((resolve, reject) => {
    let bids = hrefs.map((href) => {
      let queryString = href.split('?')[1];
      return qs.parse(queryString).bid;
    });

    return resolve(bids);
  });
};

const getReviewPages = (bids) => {
  let promises = [];

  for (var i = 0; i < bids.length; i++) {
    let url = `http://book.naver.com/bookdb/review.nhn?bid=${bids[i]}`;

    promises.push(
      rp(url)
        .then((htmlString) => {
          const $ = cheerio.load(htmlString);

          return new Promise((resolve, reject) => {
            let index = 1;
            let reviewHrefList = [];
            let reviewLength = $('#reviewList').children('li').length;

            while (index <= reviewLength) {
              let href = $(`#review_author_${index}`)
                .children('a')
                .first()
                .attr('href');

              reviewHrefList.push(href);

              index++;
            }

            resolve(reviewHrefList);
          });
        })
    );
  }
  return Promise.all(promises).then((lists) => {
    let index = -1;

    return lists.map((hrefs) => {
      index++;
      return { bid: bids[index], hrefs };
    });
  });
}

const getParagraph = (lists) => {
  let promises = [], resolvedPromises = [];
  let hrefs, paragraphPromises;
  let fileNames = lists.map((list) => {
    return `${list.bid}.txt`;
  });

  return new Promise((resolve_1, reject) => {
    lists = lists.map((list) => {

      if (list.hrefs.length === 0) {
        /*
          링크가 하나도 없는 경우 파일만 생성한다.
        */
        return new Promise((resolve_0, reject) => {
          fs.writeFile(`./reviews/${list.bid}.txt`, ' ', { flag: 'a' }, (err) => {
            if (err) {
              console.log(err);

              return reject(err);
            }

            resolve_0();
          })
        })
      }

      return new Promise((resolve_2, reject) => {

        list.hrefs = list.hrefs.map((href) => {
          let options = {
            method: 'GET',
            uri: href,
            qs: { bid: list.bid }
          };

          return new Promise((resolve_3, reject) => {
            request(options, (err, response, body) => {
              if (err) {
                if (err.code === 'ENOTFOUND') {
                  return resolve_3();
                }
                console.log(err);

                return reject(err);
              }

              const $ = cheerio.load(body);
              const frameSrc = $('frame').attr('src');

              const frameRequestOptions = {
                method: 'GET',
                uri: `http://blog.naver.com${frameSrc}`,
                encoding: null,
                qs: { bid: options.qs.bid }
              };

              request(frameRequestOptions, (err, response, body) => {
                if (err) {
                  console.log(err);

                  return reject(err);
                }

                let postViewText;
                let encodedBody = iconv.decode(body, 'KS_C_5601-1987');
                const queryString = response.socket._httpMessage.path.split('?')[1];
                const logNo = qs.parse(queryString).logNo;
                const postViewId = `#post-view${logNo}`;

                const $ = cheerio.load(encodedBody);

                postViewText = $(postViewId).text();

                fs.writeFile(`./reviews/${frameRequestOptions.qs.bid}.txt`, postViewText, {flag: 'a'}, (err) => {
                  if (err) {
                    console.log(err);

                    return reject(err);
                  }
                  resolve_3();
                })
              })
            })
          })
        });

        Promise.all(list.hrefs).then(() => {
          resolve_2();
        })
      })
    });

    return Promise.all(lists).then(() => {
      resolve_1(fileNames);
    });
  });
};

const getBookDetail = (bid) => {
  return new Promise((resolve, reject) => {
    let url = `http://book.naver.com/bookdb/book_detail.nhn?bid=${bid}`;
    request(url, (err, response, body) => {
      if (err) {
        console.log(err);

        return reject(err);
      }

      const $ = cheerio.load(body);

      let title = $('.book_info').first()
        .find('h2')
        .find('a')
        .text();

      let imgSrc = $('.book_info').first()
        .find('.thumb').first()
        .find('.thumb_type').first()
        .find('img')
        .attr('src');

      let introContent = $('#bookIntroContent').html();

      resolve({title, imgSrc, introContent});
    })
  });
}

module.exports = {
  getBestSellers,
  getBookIds,
  getReviewPages,
  getParagraph,
  getBookDetail
}
