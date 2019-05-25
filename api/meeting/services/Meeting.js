'use strict';

/* global Meeting */

/**
 * Meeting.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

// Public dependencies.
const _ = require('lodash');
const { convertRestQueryParams, buildQuery } = require('strapi-utils');

module.exports = {

  /**
   * Promise to fetch all meetings.
   *
   * @return {Promise}
   */

  fetchAll: (params, populate) => {
    const filters = convertRestQueryParams(params);
    const populateOpt = populate || Meeting.associations
      .filter(ast => ast.autoPopulate !== false)
      .map(ast => ast.alias)

    return buildQuery({
      model: Meeting,
      filters,
      populate: populateOpt,
    });
  },

  /**
   * Promise to fetch a/an meeting.
   *
   * @return {Promise}
   */

  fetch: (params) => {
    // Select field to populate.
    const populate = Meeting.associations
      .filter(ast => ast.autoPopulate !== false)
      .map(ast => ast.alias)
      .join(' ');

    return Meeting
      .findOne(_.pick(params, _.keys(Meeting.schema.paths)))
      .populate(populate);
  },

  /**
   * Promise to count meetings.
   *
   * @return {Promise}
   */

  count: (params) => {
    const filters = convertRestQueryParams(params);

    return buildQuery({
      model: Meeting,
      filters: { where: filters.where },
    })
      .count()
  },

  /**
   * Promise to add a/an meeting.
   *
   * @return {Promise}
   */

  add: async (values) => {
    // Extract values related to relational data.
    const relations = _.pick(values, Meeting.associations.map(ast => ast.alias));
    const data = _.omit(values, Meeting.associations.map(ast => ast.alias));

    // Create entry with no-relational data.
    const entry = await Meeting.create(data);

    // Create relational data and return the entry.
    return Meeting.updateRelations({ _id: entry.id, values: relations });
  },

  /**
   * Promise to edit a/an meeting.
   *
   * @return {Promise}
   */

  edit: async (params, values) => {
    // Extract values related to relational data.
    const relations = _.pick(values, Meeting.associations.map(a => a.alias));
    const data = _.omit(values, Meeting.associations.map(a => a.alias));

    // Update entry with no-relational data.
    const entry = await Meeting.updateOne(params, data, { multi: true });

    // Update relational data and return the entry.
    return Meeting.updateRelations(Object.assign(params, { values: relations }));
  },

  /**
   * Promise to remove a/an meeting.
   *
   * @return {Promise}
   */

  remove: async params => {
    // Select field to populate.
    const populate = Meeting.associations
      .filter(ast => ast.autoPopulate !== false)
      .map(ast => ast.alias)
      .join(' ');

    // Note: To get the full response of Mongo, use the `remove()` method
    // or add spent the parameter `{ passRawResult: true }` as second argument.
    const data = await Meeting
      .findOneAndRemove(params, {})
      .populate(populate);

    if (!data) {
      return data;
    }

    await Promise.all(
      Meeting.associations.map(async association => {
        if (!association.via || !data._id || association.dominant) {
          return true;
        }

        const search = _.endsWith(association.nature, 'One') || association.nature === 'oneToMany' ? { [association.via]: data._id } : { [association.via]: { $in: [data._id] } };
        const update = _.endsWith(association.nature, 'One') || association.nature === 'oneToMany' ? { [association.via]: null } : { $pull: { [association.via]: data._id } };

        // Retrieve model.
        const model = association.plugin ?
          strapi.plugins[association.plugin].models[association.model || association.collection] :
          strapi.models[association.model || association.collection];

        return model.update(search, update, { multi: true });
      })
    );

    return data;
  },

  /**
   * Promise to search a/an meeting.
   *
   * @return {Promise}
   */

  search: async (params) => {
    // Convert `params` object to filters compatible with Mongo.
    const filters = strapi.utils.models.convertParams('meeting', params);
    // Select field to populate.
    const populate = Meeting.associations
      .filter(ast => ast.autoPopulate !== false)
      .map(ast => ast.alias)
      .join(' ');

    const $or = Object.keys(Meeting.attributes).reduce((acc, curr) => {
      switch (Meeting.attributes[curr].type) {
        case 'integer':
        case 'float':
        case 'decimal':
          if (!_.isNaN(_.toNumber(params._q))) {
            return acc.concat({ [curr]: params._q });
          }

          return acc;
        case 'string':
        case 'text':
        case 'password':
          return acc.concat({ [curr]: { $regex: params._q, $options: 'i' } });
        case 'boolean':
          if (params._q === 'true' || params._q === 'false') {
            return acc.concat({ [curr]: params._q === 'true' });
          }

          return acc;
        default:
          return acc;
      }
    }, []);

    return Meeting
      .find({ $or })
      .sort(filters.sort)
      .skip(filters.start)
      .limit(filters.limit)
      .populate(populate);
  }
};
