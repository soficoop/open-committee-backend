'use strict';

/**
 * Plan.js controller
 *
 * @description: A set of functions called "actions" for managing `Plan`.
 */

module.exports = {

  /**
   * Retrieve plan records.
   *
   * @return {Object|Array}
   */

  find: async (ctx, next, { populate } = {}) => {
    if (ctx.query._q) {
      return strapi.services.plan.search(ctx.query);
    } else {
      return strapi.services.plan.fetchAll(ctx.query, populate);
    }
  },

  /**
   * Retrieve a plan record.
   *
   * @return {Object}
   */

  findOne: async (ctx) => {
    if (!ctx.params._id.match(/^[0-9a-fA-F]{24}$/)) {
      return ctx.notFound();
    }

    return strapi.services.plan.fetch(ctx.params);
  },

  /**
   * Count plan records.
   *
   * @return {Number}
   */

  count: async (ctx) => {
    return strapi.services.plan.count(ctx.query);
  },

  /**
   * Create a/an plan record.
   *
   * @return {Object}
   */

  create: async (ctx) => {
    return strapi.services.plan.add(ctx.request.body);
  },

  /**
   * Update a/an plan record.
   *
   * @return {Object}
   */

  update: async (ctx, next) => {
    return strapi.services.plan.edit(ctx.params, ctx.request.body) ;
  },

  /**
   * Destroy a/an plan record.
   *
   * @return {Object}
   */

  destroy: async (ctx, next) => {
    return strapi.services.plan.remove(ctx.params);
  }
};
