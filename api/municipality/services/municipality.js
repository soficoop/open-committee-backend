'use strict';
const { parseTemplate, sendMail } = require('../../../utils/email');
const { formatDate } = require('../../../utils/helpers');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  
  async emailSubscribers(municipality, plans) {
    if (!plans.length) {
      return;
    }
    for (const user of municipality.subscribedUsers) {
      const token =  strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id }, { expiresIn: '7d' });
      const subject = `תכניות חדשות ב${municipality.sid} | ${formatDate(new Date())}`;
      await sendMail(user.email, subject, await parseTemplate('NewPlansInMunicipality.html', { municipality, user, token, plans }));
    }
  },

  async emailUpdatedMunicipalities(from = new Date()) {
    const municipalities = await strapi.services.municipality.find({ updatedAt_gt: from, isHidden_ne: true });
    for (const municipality of municipalities) {
      const plans = municipality.plans.filter(p => p.createdAt.getTime() >= from.getTime());
      await this.emailSubscribers(municipality, plans);
    }
  }
};
