'use strict';

/**
 * User.js controller
 *
 * @description: A set of functions called "actions" for managing `User`.
 */

const _ = require('lodash');

const adminError = error => [
  { messages: [{ id: error.message, field: error.field }] },
];

module.exports = {
  /**
   * Update a/an user record.
   * @return {Object}
   */
  async updateMe(ctx) {
    const advancedConfigs = await strapi
      .store({
        environment: '',
        type: 'plugin',
        name: 'users-permissions',
        key: 'advanced',
      })
      .get();

    const { email, username, password, id } = ctx.request.body;
    if (!ctx.state.user || ctx.state.user.id != id) {
      return await ctx.unauthorized('Forbidden');
    }

    if (_.has(ctx.request.body, 'email') && !email) {
      return ctx.badRequest('email.notNull');
    }

    if (_.has(ctx.request.body, 'username') && !username) {
      return ctx.badRequest('username.notNull');
    }

    if (_.has(ctx.request.body, 'password') && !password) {
      return ctx.badRequest('password.notNull');
    }

    if (_.has(ctx.request.body, 'username')) {
      const userWithSameUsername = await strapi
        .query('user', 'users-permissions')
        .findOne({ username });

      if (userWithSameUsername && userWithSameUsername.id != id) {
        return ctx.badRequest(
          null,
          ctx.request.admin
            ? adminError({
              message: 'Auth.form.error.username.taken',
              field: ['username'],
            })
            : 'username.alreadyTaken.'
        );
      }
    }

    if (_.has(ctx.request.body, 'email') && advancedConfigs.unique_email) {
      const userWithSameEmail = await strapi
        .query('user', 'users-permissions')
        .findOne({ email });

      if (userWithSameEmail && userWithSameEmail.id != id) {
        return ctx.badRequest(
          null,
          ctx.request.admin
            ? adminError({
              message: 'Auth.form.error.email.taken',
              field: ['email'],
            })
            : 'email.alreadyTaken'
        );
      }
    }

    const user = await strapi.plugins['users-permissions'].services.user.fetch({
      id,
    });

    let updateData = {
      ...ctx.request.body,
    };

    if (_.has(ctx.request.body, 'password') && password === user.password) {
      delete updateData.password;
    }

    const data = await strapi.plugins['users-permissions'].services.user.edit(
      { id },
      updateData
    );

    ctx.send(data);
  },
};
