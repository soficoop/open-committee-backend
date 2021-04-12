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
    let tag = await strapi.services.tag.findOne({ name: params.tag });
    if (!tag) {
      tag = await strapi.services.tag.create({ name: params.tag });
    }
    return {
      plan: await planService.update(
        { id: params.planId },
        {
          tags: [...plan.tags, tag]
        }
      )
    };
  }
};
