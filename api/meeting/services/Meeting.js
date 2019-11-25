'use strict';
const parseTemplate = require('../../../config/functions/template');
const formatDate = require('../../../utils/helpers').formatDate;
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
    const subject = isNew ? `סדר יום עבור ${meeting.committee.sid} | ${formatDate(meeting.date)}` : `עדכון עבור עבור ${meeting.committee.sid} | ${meeting.date}`;
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
    const meetings = await strapi.services.meeting.find({ updatedAt_gt: from, date_gt: from });
    for (const meeting of meetings) {
      if (meeting.plans.length) {
        this.emailSubscribers(meeting.id, true);
      } else {
        strapi.log.debug(`Skipping email for empty meeting: ${meeting.id}`);
      }
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
      if (!hasVisibleComments(meeting)) {
        continue;
      }
      const subject = meeting.number ? `סיכום התייחסויות לישיבה מספר ${meeting.number}` : 'סיכום התייחסויות ל' + meeting.title;
      for (const user of meeting.committee.users) {
        try {
          strapi.plugins.email.services.email.send({
            to: user.email,
            subject,
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

/**
 * Checks whether a meeting has at least one visible comment on one of its plans
 */
function hasVisibleComments(meeting) {
  for (const plan of meeting.plans) {
    if (plan.comments.some(comment => !comment.isHidden)) {
      return true;
    }
  }
  return false;
}
