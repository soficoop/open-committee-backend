const _ = require('lodash');

module.exports = {
  mutation: `
    updateMe(input: updateUserInput): updateUserPayload
  `,
  resolver: {
    Mutation: {
      updateMe: {
        description: 'Update my user',
        plugin: 'users-permissions',
        resolverOf: 'plugins::users-permissions.user.updateMe',
        resolver: async (obj, options, { context }) => {
          context.params = _.toPlainObject(options.input.where);
          if (!context.state.user || context.state.user.id != context.params.id) {
            return await context.unauthorized('Forbidden');
          }
          context.request.body = _.toPlainObject(options.input.data);
          await strapi.plugins['users-permissions'].controllers.user.update(
            context
          );

          return {
            user: context.body.toJSON ? context.body.toJSON() : context.body,
          };
        },
      },
    },
  },
};
