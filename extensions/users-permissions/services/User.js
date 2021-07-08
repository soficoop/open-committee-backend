const { sendMail, parseTemplate } = require('../../../utils/email');
const { formatDate } = require('../../../utils/helpers');
const moment = require('moment');

module.exports = {
  /**
   * Emails comments that were created after @see {from} to relevant admins
   * @param {Date} from start date for comments
   */
  async emailNewCommentsToAdmins(from) {
    const users = await strapi.plugins['users-permissions'].services.user.fetchAll({ 
      'role.name': 'Administrator'
    },
    []);
    for (const user of users) {
      const upcomingMeetings = await strapi.services.meeting.find(
        { 
          committee_in: user.committees, 
          date_gte: moment().startOf('day').toDate() 
        }, 
        ['plans']
      );
      const plans = upcomingMeetings.map(m => m.plans).flat();
      const newComments = await strapi.services.comment.find(
        {
          createdAt_gte: from, 
          plan_in: plans
        }
      );
      if (!newComments.length) {
        continue;
      }
      const plansByComments = new Map();
      for (const comment of newComments) {
        const comments = plansByComments.has(comment.plan.id) ? 
          [...plansByComments.get(comment.plan.id).comments, comment]
          : [comment];
        plansByComments.set(comment.plan.id, {
          id: comment.plan.id,
          name: comment.plan.name,
          number: comment.plan.number,
          comments
        });
      }
      const token =  strapi.plugins['users-permissions'].services.jwt.issue(
        { 
          id: user.id
        }, 
        { 
          expiresIn: '7d'
        }
      );
      sendMail(
        user.email, 
        'התייחסויות חדשות - לאחר ' + formatDate(from),
        await parseTemplate(
          'NewCommentsSummary.html',
          { plans: plansByComments.values(), user, token }
        )
      );
    }
  }
};