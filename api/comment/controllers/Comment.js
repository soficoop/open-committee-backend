'use strict';
const parseTemplate = require('../../../config/functions/template');
const { sendMail } = require('../../../utils/helpers');

/**
 * Read the documentation () to implement custom controller functions
 */

module.exports = {
  async create(ctx) {
    const comment = await strapi.services.comment.create(ctx.request.body);
    if (comment.parent && comment.parent.user) {
      const parentCommentUser = await strapi.plugins['users-permissions'].services.user.fetch({ id: comment.parent.user });
      const childCommentUserId = comment.user && comment.user.id;
      if (childCommentUserId != parentCommentUser.id) {
        const token =  strapi.plugins['users-permissions'].services.jwt.issue({ id: parentCommentUser.id }, { expiresIn: '7d' });
        sendMail(
          parentCommentUser.email,
          `תגובה חדשה להתייחסותך לתכנית: ${comment.plan.name}`,
          await parseTemplate('NewComment.html', { parentComment: comment.parent, user: parentCommentUser, childComment: comment, plan: comment.plan, token })
        );
      }
    }
    return comment;
  },

  /**
   * Updates a comment that the current user is an owner of
   * @param {import("koa").ParameterizedContext} ctx Koa context
   */
  async updateMyComment(ctx) {
    const commentService = strapi.services.comment;
    const comment = await commentService.findOne({ id: ctx.params.id });
    if (!isUserCommentOwner(comment, ctx.state.user)) {
      throw new Error('You\'re not allowed to perform this action!');
    }
    return { comment: await commentService.update({ id: comment.id }, ctx.request.body) };
  }
};

function isUserCommentOwner(comment, user) {
  return user && comment.user && user.id == comment.user.id;
}
