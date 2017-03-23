import fs       from 'fs';
import pyShell  from 'python-shell';
import glob     from 'glob';

const responseByCode = (res, status, code, data = null) => {
  return res.status(status).json({code, data});
}

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
              resolve_1();
            })
          })
        );
      });

      console.log('Old files deleted');

      return Promise.all(promises).then(() => {
        resolve_0();
      });
    });
  });
}

const scriptPath = './py-scripts/';

const analysis = (fileNames) => {
  return new Promise((resolve, reject) => {
    const options = {
      scriptPath,
      mode: 'text',
      pythonPath: process.env.PYTHONPATH, /* Ubuntu */
      args: fileNames
    };

    pyShell.run('test.py', options, (err, results) => {
      if (err) {
        console.log(err);
        return reject(err);
      }

      return resolve(JSONParseHelper(results.toString()));
    });
  })
}

/*
  단어 카운트를 토대로(알고리즘 미정) bid를 뽑는다.

  @params
    * words[i][0] - 단어
    * words[i][1] - 카운트
    * words[i][2] - bid
*/
const recommand = (words) => {
  /*
    @params
      * table[i][0] - bid
      * table[i][1] - 카운트 합
      * table[i][2] - 중복 카운트
  */
  let table = [];

  for (var i = 0; i < words.length; i++) {
    let isExist = false;

    for (var j = 0; j < table.length; j++) {
      if (words[i][2] === table[j][0]) {
        table[j][2]++; /* 중복 카운트 증가 */
        table[j][1] += words[i][1]; /* 단어 카운트 합 */
        isExist = true;
        break;
      }
    }

    if (!isExist) {
      table.push([words[i][2], words[i][1], 1]);
    }
  }

  return new Promise((resolve, reject) => {
    let bid, temp = 0;
    for (var i = 0; i < table.length; i++) {
      if (temp < table[i][1]) {
        temp = table[i][1];
        bid = table[i][0];
      }
    }
    resolve(bid);
  })
}

const JSONParseHelper = (str) => {
  return JSON.parse(`[${str.substring(1, str.length-1).replace(/'/g, '"')}]`);
}


module.exports = {
  responseByCode,
  removeReviews,
  analysis,
  recommand
}
