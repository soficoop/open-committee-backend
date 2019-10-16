'use strict';
const parseTemplate = require('../../../config/functions/template');
const templatesDir = 'public/templates/';

module.exports = {
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

  async emailNewMeetings(from) {
    from = from || new Date();
    const meetings = await strapi.services.meeting.find({createdAt_gt: from});
    for (const meeting of meetings) {
      this.emailSubscribers(meeting.id, true);
    }
  }
};
