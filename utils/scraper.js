'use strict';
const Axios = require('axios').default;
const JSDOM = require('jsdom').JSDOM;
const yaml = require('js-yaml');
const moment = require('moment');

/**
 * @typedef {number} FieldType
 * @enum FieldType
 */
const FieldTypes = Object.freeze({
  SELECTOR: 'selectors',
  REGEX: 'matches'
});

/**
 * @typedef Parser
 * @property {string} for
 * @property {string} url
 * @property {string} objectSelector
 * @property {string} sidMatch
 * @property {boolean} active
 * @property {Field[]} fields
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

  scrapeAll() {
    for (const parser of this.parsers) {
      this.scrapeByParser(parser);
    }
  }

  /**
   * Scrapes a page by a given parser definition
   * @param {Parser} parser The parser settings to scrape by
   */
  async scrapeByParser(parser) {
    const html = await Axios.get(parser.url);
    const document = new JSDOM(html.data).window.document;
    document.querySelectorAll(parser.objectSelector).forEach(async item => {
      const parsedItem = await this.parseSingleItem(item, parser);
      const relevantService = strapi.services[parser.for];
      await this.addOrEditItem(relevantService, parsedItem);
    });
  }

  /**
   * Checks if an item exists by its sid. If so, updates the item. Otherwise creates the item.
   * @param {any} service the relevant service for the item type
   * @param {any} item the item itself
   */
  async addOrEditItem(service, item) {
    try {
      const itemInDb = await service.fetch({
        sid: item.sid
      });
      if (itemInDb == null) {
        try {
          await service.add(item);
        } catch (e) {
          console.warn(e);
        }
      } else {
        await service.edit({ id: itemInDb.id }, item);
      }
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Parse a single Element by its relevant parser configuration
   * @param {Element} item The element
   * @param {Parser} parser Parsing configuration
   */
  async parseSingleItem(item, parser) {
    let result = {};
    const sidMatches = item.innerHTML.match(parser.sidMatch);
    if (sidMatches == null) {
      return null;
    }
    result.sid = sidMatches[1];
    const modelAttributes = strapi.models[parser.for].attributes;
    for (const field of parser.fields) {
      const key = field.for;
      let value;
      switch (field.type) {
        case FieldTypes.SELECTOR:
          value = item.querySelector(field.from).textContent;
          break;
        case FieldTypes.REGEX:
          value = item.innerHTML.match(field.from)[1];
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
    let value = rawValue;
    if (modelAttribute.type == 'date') {
      value = moment(rawValue, 'DD/MM/YYYY').add(12, 'hours');
    } else if (modelAttribute.model != null) {
      const relevantRelationService = strapi.services[modelAttribute.model];
      let relationOtherEnd = await relevantRelationService.fetch({
        sid: rawValue
      });
      value = relationOtherEnd != null ? relationOtherEnd.id : null;
    }
    return value;
  }
}
module.exports = Scraper;
