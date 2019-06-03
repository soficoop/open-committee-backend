'use strict';
const Scraper = require('../../utils/scraper');

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 */

module.exports = async cb => {
  const parsers = await strapi.services.parser.fetchAll({active: true}, false);
  const scraper = new Scraper(parsers);
  scraper.scrapeAll();
  cb();
};
