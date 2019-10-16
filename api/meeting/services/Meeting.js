'use strict';
const parseTemplate = require('../../../config/functions/template');
const templatesDir = 'public/templates/';

module.exports = {
  
  /**
   * Creates a meeting
   * @return {Promise}
   */
  async create(data) {
    const entry = await strapi.query('meeting').create(data);
    await this.emailSubscribers(entry.id, true);
    return entry;
  },

  /**
   * Emails meeting to its subscribers
   * @param {string} meetingId Meeting ID
   * @param {boolean} isNew Whether the meeting is new
   */
  async emailSubscribers(meetingId, isNew) {
    const meeting = await strapi.services.meeting.findOne({ id: meetingId });
    const { subscribedUsers } = await strapi.services.committee.findOne({ id: meeting.committee.id });
    const templateFile = isNew ? 'NewMeeting.html' : 'UpdatedMeeting.html';
    const subject = isNew ? 'ישיבה חדשה במערכת ועדה פתוחה' : 'עדכון ישיבה במערכת ועדה פתוחה';
    for (const user of subscribedUsers) {
      strapi.plugins.email.services.email.send({
        to: user.email,
        subject,
        html: await parseTemplate(templatesDir + templateFile, { meeting, user })
      });
    }
    return { meeting, recipients: subscribedUsers };
  },
};
