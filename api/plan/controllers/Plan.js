'use strict';

module.exports = {
  /**
   * Updates a plan that the current user is an admin of
   * @param {import("koa").ParameterizedContext} ctx Koa context
   */
  async updateMyPlan(ctx) {
    const planService = strapi.services.plan;
    const plan = await planService.findOne({ id: ctx.params.id });
    const userCommittees = !!ctx.state && !!ctx.state.user && ctx.state.user.committees;
    const planCommittees = plan.meetings.length && plan.meetings.map(meeting => meeting.committee.toString());
    if (!userCommittees || !userCommittees.some(userCommittee => planCommittees.some(planCommittee => planCommittee == userCommittee))) {
      throw new Error('You\'re not allowed to perform this action!');
    }
    return { plan: await planService.update({ id: plan.id }, ctx.request.body) };
  },
  /**
   * Tags a plan
   * @param {import("koa").ParameterizedContext} ctx Koa context
   */
  async tagPlan(ctx) {
    const params = ctx.request.body;
    const planService = strapi.services.plan;
    const plan = await planService.findOne({ id: params.planId });
    let tagsToAdd = [];
    for (const tag of params.tags) {
      let existingTag = await strapi.services.tag.findOne({ name: tag });
      if (!existingTag) {
        existingTag = await strapi.services.tag.create({ name: tag });
      } else {
        console.info(existingTag);
      }
      tagsToAdd.push(existingTag);
    }
    return {
      plan: await planService.update(
        { id: params.planId },
        {
          tags: [...plan.tags, ...tagsToAdd]
        }
      )
    };
  }
};
