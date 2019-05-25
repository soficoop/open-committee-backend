'use strict';

/**
 * Meeting.js controller
 *
 * @description: A set of functions called "actions" for managing `Meeting`.
 */

module.exports = {

  /**
   * Retrieve meeting records.
   *
   * @return {Object|Array}
   */

  find: async (ctx, next, { populate } = {}) => {
    if (ctx.query._q) {
      return strapi.services.meeting.search(ctx.query);
    } else {
      return strapi.services.meeting.fetchAll(ctx.query, populate);
    }
  },

  /**
   * Retrieve a meeting record.
   *
   * @return {Object}
   */

  findOne: async (ctx) => {
    if (!ctx.params._id.match(/^[0-9a-fA-F]{24}$/)) {
      return ctx.notFound();
    }

    return strapi.services.meeting.fetch(ctx.params);
  },

  /**
   * Count meeting records.
   *
   * @return {Number}
   */

  count: async (ctx) => {
    return strapi.services.meeting.count(ctx.query);
  },

  /**
   * Create a/an meeting record.
   *
   * @return {Object}
   */

  create: async (ctx) => {
    return strapi.services.meeting.add(ctx.request.body);
  },

  /**
   * Update a/an meeting record.
   *
   * @return {Object}
   */

  update: async (ctx, next) => {
    return strapi.services.meeting.edit(ctx.params, ctx.request.body) ;
  },

  /**
   * Destroy a/an meeting record.
   *
   * @return {Object}
   */

  destroy: async (ctx, next) => {
    return strapi.services.meeting.remove(ctx.params);
  }
};
