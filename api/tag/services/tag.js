'use strict';

const { parseTemplate, sendMail } = require('../../../utils/email');
const { formatDate } = require('../../../utils/helpers');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async getOrCreateMany(tags) {
    let result = [];
    for (const tag of tags) {
      let existingTag = await strapi.services.tag.findOne({ name: tag });
      if (!existingTag) {
        existingTag = await strapi.services.tag.create({ name: tag });
      } 
      result.push(existingTag);
    }
    return result;
  },
  async getKeywordsMap() {
    const tags = await strapi.services.tag.find();
    const result = new Map();
    for (const tag of tags) {
      if (!tag.keywords) {
        continue;
      }
      const name = tag.name;
      for (const keyword of tag.keywords.split('\n')) {
        result.set(keyword, name);
      }
    }
    return result;
  },
  async emailSubscribers(tag, plans) {
    if (!plans.length) {
      return;
    }
    for (const user of tag.subscribedUsers) {
      const token =  strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id }, { expiresIn: '7d' });
      const subject = `תכניות חדשות בנושא ${tag.name} | ${formatDate(new Date())}`;
      await sendMail(user.email, subject, await parseTemplate('NewPlansForTag.html', { tag, user, token, plans }));
    }
  },

  /**
   * Emails newly updated tags
   * @param {Date} from minimal tag.updatedAt value
   */
  async emailUpdatedTags(from = new Date()) {
    const tags = await strapi.services.tag.find({ updatedAt_gt: from });
    for (const tag of tags) {
      const plans = tag.plans.filter(p => p.createdAt.getTime() >= from.getTime());
      await this.emailSubscribers(tag, plans);
    }
  }
};
