import qs       from 'qs';
import request  from 'request';
import rp       from 'request-promise';
import cheerio  from 'cheerio';
import iconv    from 'iconv-lite';
import fs       from 'fs';
import glob     from 'glob';

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

const removeReviews = () => {
  let promises = [];

  return new Promise((resolve_0, reject) => {
    glob('reviews/*.txt', (err, files) => {
      if (err) {
        console.log(err);

        return reject(err);
      }

      files.forEach((item, index, array) => {
        promises.push(
          new Promise((resolve_1, reject) => {
            fs.unlink(item, (err) => {
              if (err) {
                console.log(err);
                return reject(err);
              }
              console.log(item + ' deleted');
              resolve_1();
            })
          })
        );
      })

      return Promise.all(promises).then(() => {
        resolve_0();
      });
    });
  });
}

module.exports = {
  getBookIds,
  getReviewPages,
  getParagraph,
  removeReviews
}
