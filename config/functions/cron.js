'use strict';
const moment  = require('moment');
const Scraper = require('../../utils/scraper');

/**
 * Cron config that gives you an opportunity
 * to run scheduled jobs.
 *
 * The cron format consists of:
 * [MINUTE] [HOUR] [DAY OF MONTH] [MONTH OF YEAR] [DAY OF WEEK] [YEAR (optional)]
 */

module.exports = {
  // every day at 10AM
  '0 0 10 * * *': () => {
    if (process.env.SKIP_ADMIN_EMAILS == 'true') {
      return;
    }
    strapi.plugins['users-permissions'].services.user.emailNewCommentsToAdmins(moment().subtract(1, 'day').toDate());
  },
  // every day at 8AM
  '0 0 8 * * *': async () => {
    const parsers = await strapi.services.parser.find({ active: true, _sort: 'createdAt:asc' }, false);
    const scraper = new Scraper(parsers);
    await scraper.scrapeAll();
  }
};
