'use strict';
const Axios = require('axios').default;
const JSDOM = require('jsdom').JSDOM;
const yaml = require('js-yaml');
const moment = require('moment');
const querystring = require('querystring');

/**
 * @enum FieldType
 */
const FieldTypes = Object.freeze({
  SELECTOR: 'selectors',
  REGEX: 'matches',
  URL_PARAM: 'urlParams'
});

/**
 * @typedef Parser
 * @property {string} for
 * @property {string} url
 * @property {string} objectSelector
 * @property {'get' | 'post'} method
 * @property {string} requestParams
 * @property {string} sidMatch
 * @property {boolean} active
 * @property {Field[]} fields
 * @property {'none'|'meeting'|'plan'|'committee'|'area'} urlByExistingItem
 *
 * @typedef Field
 * @property {FieldType} type
 * @property {string} for
 * @property {string} from
 */

class Scraper {
  /**
   * @param {Parser[]} parsers Array of parsing rules to scrape by
   */
  constructor(parsers) {
    this.parsers = JSON.parse(JSON.stringify(parsers));
    this.generateParserFields();
  }

  generateParserFields() {
    for (const parser of this.parsers) {
      const rawFields = yaml.safeLoad(parser.fields);
      parser.fields = [];
      for (const key in rawFields) {
        if (!Object.values(FieldTypes).includes(key)) {
          continue;
        }
        const selectors = rawFields[key];
        for (const selector of selectors) {
          parser.fields.push({
            type: key,
            for: Object.keys(selector)[0],
            from: Object.values(selector)[0]
          });
        }
      }
    }
  }

  async scrapeAll() {
    strapi.log.info('🖹 Scraping started...');
    for (const parser of this.parsers) {
      await this.scrapeByParser(parser);
    }
    strapi.log.info('🖹 scraping ended.');
  }

  /**
   * Scrapes a page by a given parser definition
   * @param {Parser} parser The parser settings to scrape by
   */
  async scrapeByParser(parser) {
    if (parser.urlByExistingItem == 'none') {
      await this.scrapeStaticUrl(parser.url, parser, parser.requestParams);
    } else {
      await this.scrapeDynamicUrl(parser);
    }
  }

  /**
   * Scrapes a dynamic url (i.e. with a parameter)
   * @param {Parser} parser The parser settings to scrape by
   */
  async scrapeDynamicUrl(parser) {
    const relevantService = strapi.services[parser.urlByExistingItem];
    const existingItems = await relevantService.find();
    for (const existingItem of existingItems) {
      const staticUrl = parser.url.replace(':item', existingItem.sid);
      const requestParams = yaml.safeLoad(
        (parser.requestParams || '').replace(':item', existingItem.sid)
      );
      await this.scrapeStaticUrl(
        staticUrl,
        parser,
        requestParams,
        parser.for == parser.urlByExistingItem ? existingItem : null
      );
    }
  }

  /**
   * Scrapes a static url
   * @param {string} url The url to scrape
   * @param {Parser} parser Parsing configuration
   * @param {any} params Request parameters
   * @param {any} existingItem Existing item, for parsers which only aquire more information about a content type (and not creating new items)
   */
  async scrapeStaticUrl(url, parser, params, existingItem = null) {
    const html = await Axios.request({
      url: url,
      method: parser.method,
      data: querystring.stringify(params),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    const document = new JSDOM(html.data).window.document;
    for (const item of document.querySelectorAll(parser.objectSelector)) {
      try {
        const parsedItem = await this.parseSingleItem(
          item,
          parser,
          url,
          existingItem
        );
        const relevantService = strapi.services[parser.for];
        await this.addOrEditItem(relevantService, parsedItem);
      } catch (e) {
        strapi.log.error(e);
      }
    }
  }

  /**
   * Checks if an item exists by its sid. If so, updates the item. Otherwise creates the item.
   * @param {any} service the relevant service for the item type
   * @param {any} item the item itself
   */
  async addOrEditItem(service, item) {
    let foundItems, itemInDb;
    try {
      foundItems = await service.find({
        sid: item.sid
      });
    } catch (e) {
      strapi.log.warn(e);
    }
    itemInDb = foundItems.length == 1 ? foundItems[0] : null;
    if (itemInDb == null) {
      await this.addItem(service, item);
    } else {
      await this.editItem(service, item, itemInDb);
    }
  }

  /**
   * Creates an item in the DB.
   * @param {any} service the relevant service for the item type
   * @param {any} item the item itself
   */
  async addItem(service, item) {
    try {
      await service.create(item);
    } catch (e) {
      strapi.log.warn(e);
    }
  }

  /**
   * Updates an existing item in the DB
   * @param {any} service the relevant service for the item type
   * @param {any} item the item itself
   * @param {any} itemInDb the ID of the existing item
   */
  async editItem(service, item, itemInDb) {
    try {
      await service.update({ _id: itemInDb.id }, item);
    } catch (e) {
      strapi.log.warn(e);
    }
  }

  /**
   * Parse a single Element by its relevant parser configuration
   * @param {Element} element The element which is parsed
   * @param {Parser} parser Parsing configuration
   * @param {string} url the URL from which the element was taken
   * @param {any} existingItem Existing item, for parsers which only aquire more information about a content type (and not creating new items)
   */
  async parseSingleItem(element, parser, url, existingItem) {
    const sid = this.getItemSid(element, parser, existingItem);
    const parsedItem = await this.parseItemFields(element, parser, url);
    const result = { ...parsedItem, sid: sid };
    return result;
  }

  /**
   * Gets the SID for an item
   * @param {Element} element HTML element which contains the SID
   * @param {Parser} parser The relevant parser
   * @param {any} existingItem An existing item that contains the SID
   */
  getItemSid(element, parser, existingItem) {
    if (existingItem) {
      return existingItem.sid;
    }
    const sidMatches = element.innerHTML.match(parser.sidMatch);
    if (sidMatches == null) {
      throw 'No SID found for item';
    }
    return sidMatches[1];
  }

  /**
   * Parses fields of a single item which already has an SID
   * @param {Element} item The element
   * @param {Parser} parser Parsing configuration
   * @param {string} url the URL from which the element was taken
   */
  async parseItemFields(item, parser, url) {
    let result = {};
    const modelAttributes = strapi.models[parser.for].attributes;
    for (const field of parser.fields) {
      const key = field.for;
      let value;
      switch (field.type) {
        case FieldTypes.SELECTOR:
          value = [...item.querySelectorAll(field.from)].map(
            i => i.textContent
          );
          break;
        case FieldTypes.REGEX:
          value = [...item.innerHTML.matchAll(field.from)].map(i => i[1]);
          break;
        case FieldTypes.URL_PARAM:
          value = new URL(url).searchParams.get(field.from);
          break;
      }
      result[key] = await this.convertField(value, modelAttributes[key]);
    }
    return result;
  }

  /**
   *  Converts a raw value of a field to its proper value by the model's configuration
   * @param {any} rawValue the raw field value
   * @param {any} modelAttribute the model configuration
   */
  async convertField(rawValue, modelAttribute) {
    const isCollection = modelAttribute.collection != null;
    let value;
    if (!isCollection && Array.isArray(rawValue)) {
      value = rawValue[0];
    } else {
      value = rawValue;
    }
    const relationTargetModel =
      modelAttribute.collection || modelAttribute.model;
    if (modelAttribute.type == 'date') {
      value = moment(value || '01/01/1970', 'DD/MM/YYYY').add(12, 'hours');
    } else if (relationTargetModel) {
      value = await this.convertRelationshipField(
        isCollection,
        value,
        relationTargetModel
      );
    }
    return value;
  }

  async convertRelationshipField(isCollection, rawValue, relationTargetModel) {
    if (isCollection) {
      let ids = [];
      for (const sid of rawValue) {
        const id = await this.getRelationshipTargetId(relationTargetModel, sid);
        if (id != null) {
          ids.push(id);
        }
      }
      return ids;
    } else {
      return await this.getRelationshipTargetId(relationTargetModel, rawValue);
    }
  }

  async getRelationshipTargetId(targetModel, sid) {
    const relevantRelationService = strapi.services[targetModel];
    const relationOtherEnd = await relevantRelationService.find({
      sid: sid
    });
    if (relationOtherEnd.length == 1) {
      return relationOtherEnd[0].id;
    } else {
      return null;
    }
  }
}
module.exports = Scraper;
