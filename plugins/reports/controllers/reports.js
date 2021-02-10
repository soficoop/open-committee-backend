'use strict';

/**
 * reports.js controller
 *
 * @description: A set of functions called "actions" of the `reports` plugin.
 */

module.exports = {
  userSubscriptions: async (ctx) => {
    let result = 'שם, אימייל, התראות, הרשמה\n';
    const users = await strapi.plugins['users-permissions'].services.user.fetchAll({ _limit:-1 });
    for (const user of users) {
      const subscribedCommittees = user.subscribedCommittees.map(c => c.sid).join('\n');
      const createdAt = `${user.createdAt.getDate()}.${user.createdAt.getMonth()+1}.${user.createdAt.getFullYear()}`;
      result += `"${user.firstName} ${user.lastName}",${user.email}, "${subscribedCommittees}", "${createdAt}"\n`;
    }
    ctx.send({ data: result });
  },
  committeeSubscriptions: async (ctx) => {
    let result = 'ועדה, משתמשים\n';
    const committees = await strapi.services.committee.find({ _limit:-1 });
    for (const committee of committees) {
      const subscribedUsers = committee.subscribedUsers.map(u => u.email).join('\n');
      result += `"${committee.sid}","${subscribedUsers}"\n`;
    }
    ctx.send({ data: result });
  },
  commentsSummary: async (ctx) => {
    let result = 'שם, אימייל, כותרת, תוכן, לינק\n';
    const comments = await strapi.services.comment.find({ _limit:-1 });;
    for (const comment of comments) {
      const planUrl = comment.plan && `${strapi.config.server.appUrl}/plan/${comment.plan.id}`;
      result += `"${comment.name}",${comment.user && comment.user.email},"${comment.title}","${comment.content}",${planUrl}\n`;
    }
    ctx.send({ data: result });
  }
};
