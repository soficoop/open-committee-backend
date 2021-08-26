'use strict';
const { sendMail, parseTemplate } = require('../../../utils/email');

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
    const plan =  await strapi.services.plan.tagPlan(params.planId, params.tags);
    const tags = await strapi.services.tag.find({ name_in: params.tags });
    for (const tag of tags) {
      for (const user of tag.subscribedUsers) {
        const token =  strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id }, { expiresIn: '7d' });
        await sendMail(
          user.email,
          `תכנית חדשה בועדה פתוחה - ${plan.name}`,
          await parseTemplate('NewTaggedPlan.html',{ tag: tag.name, user, plan, token })
        );
      }
    }
    return { plan };
  }
};
