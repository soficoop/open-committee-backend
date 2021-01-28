'use strict';

/**
 * reports.js controller
 *
 * @description: A set of functions called "actions" of the `reports` plugin.
 */

module.exports = {
  usersWithoutSubscriptions: async (ctx) => {
    let result = 'שם, אימייל\n';
    const users = await strapi.plugins['users-permissions'].services.user.fetchAll({ _limit:-1 });
    for (const user of users.filter(u => u.subscribedCommittees.length === 0)) {
      result += `${user.firstName} ${user.lastName},${user.email}\n`;
    }
    ctx.send({ data: result });
  },
  committeeSubscriptions: async (ctx) => {
    let result = 'ועדה\n';
    const users = await strapi.plugins['users-permissions'].services.user.fetchAll();
    for (const user of users.filter(u => u.subscribedCommittees.length === 0)) {
      result += `${user.firstName},${user.lastName},${user.email}\n`;
    }
    ctx.send({ data: result });
  },
  commentsSummary: async (ctx) => {
    let result = 'שם, אימייל, כותרת, תוכן, לינק\n';
    const comments = await strapi.services.comment.find({ _limit:-1 });;
    for (const comment of comments) {
      const planUrl = comment.plan && `${strapi.config.server.appUrl}/plan/${comment.plan.id}`;
      result += `${comment.name},${comment.user && comment.user.email},"${comment.title}","${comment.content}",${planUrl}\n`;
    }
    ctx.send({ data: result });
  }
};
