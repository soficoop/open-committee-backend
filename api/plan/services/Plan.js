'use strict';

module.exports = {
  /**
   * gets plans with updatedAt value greated than a given time
   * @param {Date} time minimum updatedAt value
   */
  async getPlansUpdatedAfter(time) {
    return strapi.services.plan.find({ updatedAt_gt: time });
  }
};
