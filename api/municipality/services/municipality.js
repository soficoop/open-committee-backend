'use strict';
const parseTemplate = require('../../../config/functions/template');
const formatDate = require('../../../utils/helpers').formatDate;
const { sendMail } = require('../../../utils/helpers');


/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  
  async emailSubscribers(municipality) {
    for (const user of municipality.subscribedUsers) {
      const token =  strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id }, { expiresIn: '7d' });
      const subject = `תכניות חדשות ב${municipality.sid} | ${formatDate(new Date())}`;
      await sendMail(user.email, subject, await parseTemplate('NewPlansInMunicipality.html', { municipality, user, token }));
    }
  },

  async emailUpdatedMunicipalities(from = new Date()) {
    const municipalities = await strapi.services.municipality.find({ updatedAt_gt: from, isHidden: false });
    for (const municipality of municipalities) {
      const plans = await strapi.services.plans.find({ createdAt_gt: from, municipalities_contains: municipality.id });
      console.info(plans);
      await this.emailSubscribers(municipality, plans.filter(p => p.municipalities.some(m => m.id === municipality.id)));
    }
  }
};
