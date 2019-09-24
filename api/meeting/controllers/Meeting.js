'use strict';
const parseTemplate = require('../../../config/functions/template');

module.exports = {
  /**
   * Emails meeting to its subscribers
   * @param {import("koa").Context} ctx Koa context
   * @param {any?} meeting Meeting to send email about (optional)
   */
  async emailSubscribers(ctx) {
    const meeting = await strapi.services.meeting.findOne({ id: ctx.params.id });
    const { subscribedUsers } = await strapi.services.committee.findOne({ id: meeting.committee.id });
    for (const user of subscribedUsers) {
      await strapi.plugins.email.services.email.send({
        to: user.email,
        subject: 'ישיבה חדשה במערכת ועדה פתוחה',
        html: await parseTemplate('public/templates/NewMeeting.html', { meeting, user })
      });
    }
    ctx.res.statusCode = 200;
    return { meeting, recipients: subscribedUsers };
  },

  /**
   * Creates a meeting
   * @param {import("koa").ParameterizedContext} ctx Koa context
   */
  async create(ctx) {
    const meeting = await strapi.services.meeting.create(ctx.request.body);
    ctx.params.id = meeting.id;
    await strapi.controllers.meeting.emailSubscribers(ctx);
    return meeting;
  }
};