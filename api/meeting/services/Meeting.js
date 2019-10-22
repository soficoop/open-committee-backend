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

  /**
   * Emails newly created meetings to their subscribers
   * @param {Date} from start date for meetings
   */
  async emailNewMeetings(from) {
    from = from || new Date();
    const meetings = await strapi.services.meeting.find({ createdAt_gt: from });
    for (const meeting of meetings) {
      this.emailSubscribers(meeting.id, true);
    }
  },

  /**
   * Emails meeting between given dates to their admins
   * @param {Date} from start date for meetings
   * @param {Date} to end date for meetings
   */
  async emailToAdmins(from, to) {
    const meetings = await strapi.services.meeting.find({ date_gte: from, date_lt: to }, [
      {
        path: 'committee',
        populate: {
          path: 'users'
        }
      },
      {
        path: 'plans',
        populate: {
          path: 'comments'
        }
      }
    ]);
    for (const meeting of meetings) {
      for (const user of meeting.committee.users) {
        try {
          strapi.plugins.email.services.email.send({
            to: user.email,
            subject: 'סיכום התייחסויות לישיבה במערכת ועדה פתוחה',
            html: await parseTemplate(templatesDir + 'MeetingSummary.html', { meeting, user })
          });
        } catch (e) {
          strapi.log.error(e.message);
          strapi.log.error(e.stack);
        }
      }
    }
  }
};
