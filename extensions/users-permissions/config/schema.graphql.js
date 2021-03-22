const _ = require('lodash');
const { sanitizeEntity } = require('strapi-utils/lib');

module.exports = {
  mutation: `
    updateMe(input: updateUserInput): updateUserPayload
    tokenSignIn(token: String!): UsersPermissionsLoginPayload!
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
      tokenSignIn: {
        description: 'Sign in using a one-time token',
        plugin: 'users-permissions',
        resolverOf: 'plugins::users-permissions.user.tokenSignIn',
        resolver: async (obj, options, { context }) => {
          const payload = await strapi.plugins['users-permissions'].services.jwt.verify(options.token);
          const user = await strapi.query('user', 'users-permissions').findOne({ id: payload.id });
          return {
            user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
              model: strapi.query('user', 'users-permissions').model,
            }),
            jwt: options.token
          };
        },
      }
    },
  },
};
