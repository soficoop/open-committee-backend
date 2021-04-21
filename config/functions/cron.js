'use strict';
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
    let from = new Date();
    from.setDate(from.getDate() + 1);
    from.setHours(0, 0, 0, 0);
    let to = new Date();
    to.setDate(to.getDate() + 1);
    to.setHours(23, 59, 59, 999);
    strapi.services.meeting.emailToAdmins(from, to);
  },
  // every day at 8AM
  '0 0 8 * * *': async () => {
    const parsers = await strapi.services.parser.find({ active: true, _sort: 'createdAt:asc' }, false);
    const scraper = new Scraper(parsers);
    await scraper.scrapeAll();
  }
};
