'use strict';

/**
 * Read the documentation () to implement custom controller functions
 */

module.exports = {
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
