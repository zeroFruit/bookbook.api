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

const getReviews = () => {

}

module.exports = {
  getBestSellers,
  getReviews
}
