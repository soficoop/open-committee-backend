'use strict';
const Scraper = require('../../utils/scraper');

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 */

module.exports = () => {
  activateScraper();
};

async function activateScraper() {
  const parsers = await strapi.services.parser.find({ active: true, _sort: 'createdAt:asc' }, false);
  const scraper = new Scraper(parsers);
  await scraper.scrapeAllRepeatedly();
}
