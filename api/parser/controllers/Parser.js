'use strict';

/**
 * Parser.js controller
 *
 * @description: A set of functions called "actions" for managing `Parser`.
 */

module.exports = {

  /**
   * Retrieve parser records.
   *
   * @return {Object|Array}
   */

  find: async (ctx, next, { populate } = {}) => {
    if (ctx.query._q) {
      return strapi.services.parser.search(ctx.query);
    } else {
      return strapi.services.parser.fetchAll(ctx.query, populate);
    }
  },

  /**
   * Retrieve a parser record.
   *
   * @return {Object}
   */

  findOne: async (ctx) => {
    if (!ctx.params._id.match(/^[0-9a-fA-F]{24}$/)) {
      return ctx.notFound();
    }

    return strapi.services.parser.fetch(ctx.params);
  },

  /**
   * Count parser records.
   *
   * @return {Number}
   */

  count: async (ctx) => {
    return strapi.services.parser.count(ctx.query);
  },

  /**
   * Create a/an parser record.
   *
   * @return {Object}
   */

  create: async (ctx) => {
    return strapi.services.parser.add(ctx.request.body);
  },

  /**
   * Update a/an parser record.
   *
   * @return {Object}
   */

  update: async (ctx, next) => {
    return strapi.services.parser.edit(ctx.params, ctx.request.body) ;
  },

  /**
   * Destroy a/an parser record.
   *
   * @return {Object}
   */

  destroy: async (ctx, next) => {
    return strapi.services.parser.remove(ctx.params);
  }
};
