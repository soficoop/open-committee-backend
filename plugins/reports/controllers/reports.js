'use strict';

/**
 * reports.js controller
 *
 * @description: A set of functions called "actions" of the `reports` plugin.
 */

module.exports = {
  users: async (ctx) => {
    const result = [];
    const users = await strapi.plugins['users-permissions'].services.user.fetchAll();
    for (const user of users) {
      result.push({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        subscribedCommittees: user.subscribedCommittees.map(committee => committee.sid),
        comments: user.comments.map(comment => ({ ...comment, plan: `${strapi.config.server.appUrl}/plan/${comment.plan}` }))
      });
    }
    ctx.send(result);
  },
  committees: async (ctx) => {
    ctx.send({ message: 'ok' });
  }
};
