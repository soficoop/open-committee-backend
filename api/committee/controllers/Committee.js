'use strict';

/**
 * Committee.js controller
 *
 * @description: A set of functions called "actions" for managing `Committee`.
 */

module.exports = {

  /**
   * Retrieve committee records.
   *
   * @return {Object|Array}
   */

  find: async (ctx, next, { populate } = {}) => {
    if (ctx.query._q) {
      return strapi.services.committee.search(ctx.query);
    } else {
      return strapi.services.committee.fetchAll(ctx.query, populate);
    }
  },

  /**
   * Retrieve a committee record.
   *
   * @return {Object}
   */

  findOne: async (ctx) => {
    if (!ctx.params._id.match(/^[0-9a-fA-F]{24}$/)) {
      return ctx.notFound();
    }

    return strapi.services.committee.fetch(ctx.params);
  },

  /**
   * Count committee records.
   *
   * @return {Number}
   */

  count: async (ctx) => {
    return strapi.services.committee.count(ctx.query);
  },

  /**
   * Create a/an committee record.
   *
   * @return {Object}
   */

  create: async (ctx) => {
    return strapi.services.committee.add(ctx.request.body);
  },

  /**
   * Update a/an committee record.
   *
   * @return {Object}
   */

  update: async (ctx, next) => {
    return strapi.services.committee.edit(ctx.params, ctx.request.body) ;
  },

  /**
   * Destroy a/an committee record.
   *
   * @return {Object}
   */

  destroy: async (ctx, next) => {
    return strapi.services.committee.remove(ctx.params);
  }
};
