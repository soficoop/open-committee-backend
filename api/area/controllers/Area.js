'use strict';

/**
 * Area.js controller
 *
 * @description: A set of functions called "actions" for managing `Area`.
 */

module.exports = {

  /**
   * Retrieve area records.
   *
   * @return {Object|Array}
   */

  find: async (ctx, next, { populate } = {}) => {
    if (ctx.query._q) {
      return strapi.services.area.search(ctx.query);
    } else {
      return strapi.services.area.fetchAll(ctx.query, populate);
    }
  },

  /**
   * Retrieve a area record.
   *
   * @return {Object}
   */

  findOne: async (ctx) => {
    if (!ctx.params._id.match(/^[0-9a-fA-F]{24}$/)) {
      return ctx.notFound();
    }

    return strapi.services.area.fetch(ctx.params);
  },

  /**
   * Count area records.
   *
   * @return {Number}
   */

  count: async (ctx) => {
    return strapi.services.area.count(ctx.query);
  },

  /**
   * Create a/an area record.
   *
   * @return {Object}
   */

  create: async (ctx) => {
    return strapi.services.area.add(ctx.request.body);
  },

  /**
   * Update a/an area record.
   *
   * @return {Object}
   */

  update: async (ctx, next) => {
    return strapi.services.area.edit(ctx.params, ctx.request.body) ;
  },

  /**
   * Destroy a/an area record.
   *
   * @return {Object}
   */

  destroy: async (ctx, next) => {
    return strapi.services.area.remove(ctx.params);
  }
};
