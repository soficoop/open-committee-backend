module.exports = {
  mutation: `
        updateMyComment(input: updateCommentInput): updateCommentPayload
    `,
  resolver: {
    Mutation: {
      updateMyComment: {
        description: 'Updates a comment that the current user is an owner of',
        resolverOf: 'Comment.updateMyComment',
        resolver: async (obj, options, { context }) => strapi.controllers.comment.updateMyComment(context)
      }
    }
  }
};