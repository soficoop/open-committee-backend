'use strict';

module.exports = {
  /**
   * gets plans with updatedAt value greated than a given time
   * @param {Date} from minimum updatedAt value
   */
  async getNewPlans(from) {
    return strapi.services.plan.find({ createdAt_gt: from });
  },
  /**
   * Tags all plans that were updated after a specific time using configured keywords
   * @param {Date} from minimum updatedAt value
   */
  async tagNewPlans(from) {
    const plans = await this.getNewPlans(from);
    /** @type {Map<string, string>} */
    const keywordsMap = await strapi.services.tag.getKeywordsMap();
    for (const plan of plans) {
      const planText = plan.name + plan.targets + plan.sections;
      const regex = new RegExp([...keywordsMap.keys()].join('|'), 'g');
      const matches = [...new Set(planText.match(regex))];
      await this.tagPlan(plan.id, matches.map(match => keywordsMap.get(match)));
    }
  },
  /**
   * Applys tags to a given plan
   * @param {string} planId ID of plan to tag
   * @param {string[]} tagNames Array of tags to be added to plan
   */
  async tagPlan(planId, tagNames) {
    const planService = strapi.services.plan;
    const plan = await planService.findOne({ id: planId });
    const relvantTags = tagNames.filter(tagName => plan.tags.every(planTag => planTag.name !== tagName));
    let tagsToAdd = await strapi.services.tag.getOrCreateMany(relvantTags);
    const updatedPlan = await planService.update(
      { id: planId },
      { tags: [...plan.tags, ...tagsToAdd] }
    );
    return updatedPlan;
  }
};
