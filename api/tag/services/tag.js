'use strict';

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
  }
};
