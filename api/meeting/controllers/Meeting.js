'use strict';
const parseTemplate = require('../../../config/functions/template');
const templatesDir = 'public/templates/';

module.exports = {
  /**
   * Emails meeting to its subscribers
   * @param {import("koa").Context} ctx Koa context
   * @param {any?} meeting Meeting to send email about (optional)
   */
  async emailSubscribers(ctx) {
    const meeting = await strapi.services.meeting.findOne({ id: ctx.params.id });
    const { subscribedUsers } = await strapi.services.committee.findOne({ id: meeting.committee.id });
    const templateFile = ctx.params.isNew ? 'NewMeeting.html' : 'UpdatedMeeting.html';
    const subject = ctx.params.isNew ? 'ישיבה חדשה במערכת ועדה פתוחה' : 'עדכון ישיבה במערכת ועדה פתוחה';
    for (const user of subscribedUsers) {
      strapi.plugins.email.services.email.send({
        to: user.email,
        subject,
        html: await parseTemplate(templatesDir + templateFile, { meeting, user })
      });
    }
    return { meeting, recipients: subscribedUsers };
  },

  /**
   * Creates a meeting
   * @param {import("koa").ParameterizedContext} ctx Koa context
   */
  async create(ctx) {
    const meeting = await strapi.services.meeting.create(ctx.request.body);
    ctx.params.id = meeting.id;
    ctx.params.isNew = true;
    await strapi.controllers.meeting.emailSubscribers(ctx);
    return meeting;
  }
};