'use strict';
const moment = require('moment');
const { sendLocationSubscriptionEmails } = require('../../utils/email');
const Scraper = require('../../utils/scraper');

/**
 * Cron config that gives you an opportunity
 * to run scheduled jobs.
 *
 * The cron format consists of:
 * [MINUTE] [HOUR] [DAY OF MONTH] [MONTH OF YEAR] [DAY OF WEEK] [YEAR (optional)]
 */

module.exports = {
  // every day at 4:30AM
  '0 30 4 * * *': () => {
    if (process.env.SKIP_ADMIN_EMAILS == 'true') {
      return;
    }
    strapi.plugins['users-permissions'].services.user.emailNewCommentsToAdmins(moment().subtract(1, 'day').toDate());
  },
  // every day at 8AM
  '0 0 8 * * *': async () => {
    const scrapingStart = new Date();
    const parsers = await strapi.services.parser.find({ active: true, _sort: 'createdAt:asc' }, false);
    const scraper = new Scraper(parsers);
    await scraper.scrapeAll();
    strapi.services.meeting.emailNewMeetings(scrapingStart);
    strapi.services.municipality.emailUpdatedMunicipalities(scrapingStart);
    strapi.services.tag.emailUpdatedTags(scrapingStart);
    sendLocationSubscriptionEmails(scrapingStart);
  }
};
