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
  SELECTOR: 1,
  REGEX: 2
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
      const selectors = rawFields.selectors || [];
      for (const selector of selectors) {
        parser.fields.push({
          type: FieldTypes.SELECTOR,
          for: Object.keys(selector)[0],
          from: Object.values(selector)[0]
        });
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
      if (field.type == FieldTypes.SELECTOR) {
        value = item.querySelector(field.from).textContent;
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
    let value;
    if (modelAttribute.type == 'date') {
      value = moment(rawValue, 'DD/MM/YYYY').add(12, 'hours');
    } else if (modelAttribute.model != null) {
      const relevantRelationService = strapi.services[modelAttribute.model];
      let relationOtherEnd = await relevantRelationService.fetch({
        sid: rawValue
      });
      if (relationOtherEnd == null) {
        try {
          relationOtherEnd = await relevantRelationService.add({
            sid: rawValue
          });
        } catch (e) {
          console.warn(e);
        }
      }
      value = relationOtherEnd.id;
    }
    return value || rawValue;
  }
}
module.exports = Scraper;
