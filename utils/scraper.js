'use strict';
const _ = require('lodash');
const Axios = require('axios').default;
const JSDOM = require('jsdom').JSDOM;
const yaml = require('js-yaml');
const moment = require('moment');
const querystring = require('querystring');
const mime = require('mime-types');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const pluralize = require('pluralize');


/**
 * @enum FieldType
 */
const FieldType = Object.freeze({
  SELECTOR: 'selectors',
  REGEX: 'matches',
  URL_PARAM: 'urlParams'
});

/**
 * @typedef Parser
 * @property {'meeting' | 'plan' | 'committee' | 'area' | 'municipality'} for
 * @property {string} url
 * @property {string} objectSelector
 * @property {'get' | 'post'} method
 * @property {string} requestParams
 * @property {string} sidMatch
 * @property {boolean} active
 * @property {Field[]} fields
 * @property {FileField[]} fileFields
 * @property {boolean} isJson
 * @property {'none' | 'meeting' | 'plan' | 'committee' | 'area'} urlByExistingItem
 *
 * @typedef Field
 * @property {FieldType} type
 * @property {string} for
 * @property {string} from
 * 
 * @typedef FileField
 * @property {string} field The field name
 * @property {string} selector The CSS selector for the element which holds information about the file
 * @property {string} url URL of the file
 * @property {string} method HTTP method in order to download the file
 * @property {FileRequestParam[]} requestParams
 * 
 * @typedef FileRequestParam
 * @property {string} key
 * @property {string} valueMatcher REGEX to match the value of the param
 */

class Scraper {
  /**
   * @param {Parser[]} parsers Array of parsing rules to scrape by
   */
  constructor(parsers) {
    /**@type {Parser[]} */
    this.parsers = JSON.parse(JSON.stringify(parsers));
    this.generateParserFields();
  }

  generateParserFields() {
    for (const parser of this.parsers) {
      const rawFields = yaml.safeLoad(parser.fields);
      parser.fields = [];
      for (const key in rawFields) {
        if (!Object.values(FieldType).includes(key)) {
          continue;
        }
        const fields = rawFields[key];
        for (const field of fields) {
          parser.fields.push({
            type: key,
            for: Object.keys(field)[0],
            from: Object.values(field)[0]
          });
        }
      }
      parser.fileFields = parser.fileFields && yaml.safeLoad(parser.fileFields);
    }
  }

  async scrapeAll() {
    this.scrapingStart = new Date();
    for (const parser of this.parsers) {
      await this.scrapeByParser(parser);
    }
    strapi.log.info('🏷️ Tagging new plans...');
    await strapi.services.plan.tagNewPlans(this.scrapingStart);
    strapi.log.info('🏷️ Tagging plans ended.');
  }

  /**
   * Scrapes a page by a given parser definition
   * @param {Parser} parser The parser settings to scrape by
   */
  async scrapeByParser(parser) {
    strapi.log.info(`🧐  Scraping ${pluralize.plural(parser.for)}...`);
    if (parser.urlByExistingItem == 'none') {
      await this.scrapeStaticUrl(parser.url, parser, parser.requestParams);
    } else {
      await this.scrapeDynamicUrl(parser);
    }
    strapi.log.info(`🧐  Scraping ${pluralize.plural(parser.for)} ended.`);
  }

  /**
   * Scrapes a dynamic url (i.e. with a parameter)
   * @param {Parser} parser The parser settings to scrape by
   */
  async scrapeDynamicUrl(parser) {
    const relevantService = strapi.services[parser.urlByExistingItem];
    let existingItems = await relevantService.find({
      updatedAt_gt: this.scrapingStart,
      _limit: -1
    });
    strapi.log.info(`About to update/create ${pluralize.plural(parser.for)} by ${existingItems.length} ${parser.urlByExistingItem}s`);
    for (const existingItem of existingItems) {
      const staticUrl = parser.url.replace(/{{([a-z0-9]+)}}/g, (matches, group1) => existingItem[group1]);
      const requestParams = yaml.safeLoad(
        (parser.requestParams || '').replace(/{{([a-z0-9]+)}}/g, (matches, group1) => existingItem[group1])
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
    let response;
    try {
      response = await Axios.request({
        url: url,
        method: parser.method,
        data: querystring.stringify(params),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    } catch (e) {
      strapi.log.error(e.message);
      return;
    }
    let document, items;
    if (parser.isJson) {
      document = response.data;
      items = _.get(document, parser.objectSelector);
    } else {
      document = new JSDOM(response.data).window.document;
      items = document.querySelectorAll(parser.objectSelector);
    }
    for (const item of items) {
      const parsedItem = await this.parseSingleItem(
        item,
        parser,
        url,
        existingItem
      );
      const relevantService = strapi.services[parser.for];
      await this.addOrEditItem(relevantService, parsedItem, existingItem);
    }
  }

  /**
   * Checks if an item exists by its sid. If so, updates the item. Otherwise creates the item.
   * @param {any} service the relevant service for the item type
   * @param {any} newItem the item itself
   * @param {any} itemInDb the existing item
   */
  async addOrEditItem(service, newItem, itemInDb) {
    if (itemInDb) {
      await this.editItem(service, newItem, itemInDb);
      return;
    }
    const foundItems = await service.find({
      sid: newItem.sid
    });
    if (foundItems.length == 1) {
      await this.editItem(service, newItem, foundItems[0]);
    } else if (!foundItems.length) {
      await this.addItem(service, newItem);
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
   * checks weather an update for an existing item is necessary
   * @param {any} fieldsToUpdate 
   * @param {any} itemInDb 
   */
  isUpdateNecessary(fieldsToUpdate, itemInDb) {
    for (const key in fieldsToUpdate) {
      const rawDbValue = itemInDb[key];
      let comparableValue = rawDbValue;
      let newValue = fieldsToUpdate[key];
      if (rawDbValue && rawDbValue.toDateString) {
        newValue = fieldsToUpdate[key].valueOf();
        comparableValue = new Date(rawDbValue).getTime();
      } else if (rawDbValue && rawDbValue.id) {
        comparableValue = rawDbValue.id;
      }
      if (newValue != comparableValue) {
        strapi.log.debug(`update for item ${itemInDb.id} is necessary`);
        return true;
      }
    }
    return false;
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
    const parsedFields = await this.parseItemFields(element, parser, url);
    const parsedFileFileds = await this.parseItemFileFields(element, parser);
    const result = { ...parsedFields, ...parsedFileFileds, sid: sid };
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
      case FieldType.SELECTOR:
        value = parser.isJson 
          ? _.get(item, field.from) 
          : [...item.querySelectorAll(field.from)].map(
            i => i.innerHTML
          );
        break;
      case FieldType.REGEX:
        value = [...item.innerHTML.matchAll(field.from)].map(i => i[1]);
        break;
      case FieldType.URL_PARAM:
        value = new URL(url).searchParams.get(field.from);
        break;
      }
      if (value) {
        result[key] = await this.convertField(value, modelAttributes[key]);
      }
    }
    return result;
  }

  /**
   * 
   * @param {Element} item The item element
   * @param {Parser} parser The relevant parser
   */
  async parseItemFileFields(item, parser) {
    if (!parser.fileFields) {
      return null;
    }
    let files = {};
    for (const fileField of parser.fileFields) {
      const fileId = await this.parseSingleFileField(item, fileField);
      if (fileId) {
        files[fileField.field] = fileId;
      }
    }
    return files;
  }

  /**
   * 
   * @param {Element} item The item element
   * @param {FileField} fileField The specific field which is parsed
   */
  async parseSingleFileField(item, fileField) {
    const fileSelectedElement = item.querySelector(fileField.selector);
    let params = {};
    for (const param of fileField.requestParams) {
      let matches = fileSelectedElement.innerHTML.match(param.valueMatcher);
      if (matches && matches.length > 1) {
        params[param.key] = matches[1];
      }
    }
    const file = await this.requestFile(fileField.method, fileField.url, params);
    if (file) {
      return await this.uploadFileOrFetchId(file);
    }
    return null;
  }

  /**
   * Makes an HTTP request for a file and returns the file object
   * @param {"get" | "post"} method 
   * @param {string} url 
   * @param {any} params 
   */
  async requestFile(method, url, params) {
    let response;
    try {
      response = await Axios.request({
        method,
        url,
        params,
        responseType: 'arraybuffer'
      });
    } catch (e) {
      strapi.log.error(e.message);
      return null;
    }
    const buffer = response.data;
    if (buffer.byteLength == 0) {
      return null;
    }
    const disposition = response.headers['content-disposition'];
    const name = disposition.split('filename=')[1];
    const ext = '.' + name.split('.')[1];
    const hash = crypto.createHash('md5').update(buffer).digest('hex');
    const filePath = path.join(os.tmpdir(), name);
    fs.writeFileSync(filePath, buffer);
    return {
      buffer,
      size: buffer.byteLength,
      hash,
      ext,
      name,
      path: filePath,
      type: mime.lookup(ext),
    };
  }

  /**
   * Upload a file to strapi
   * @param {any} file
   * @returns {string} ID of uploaded file
   */
  async uploadFileOrFetchId(file) {
    const uploadService = strapi.plugins.upload.services.upload;
    const existingFile = (await uploadService.fetchAll({ hash: file.hash }))[0];
    if (existingFile) {
      return existingFile.id;
    }
    const result = await uploadService.upload({
      data: {},
      files: file
    });
    return result && result[0] && result[0].id;
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
      value = rawValue.map(i => typeof i === 'string' ? i.trim() : i);
    }
    const relationTargetModel =
      modelAttribute.collection || modelAttribute.model;
    if (modelAttribute.type == 'integer') {
      value = parseInt(value) || 0;
    } else if (modelAttribute.type == 'string' && typeof value == 'string') {
      value = value.trim();
    } else if (modelAttribute.type == 'datetime') {
      value = moment(value || '01/01/1970', 'DD/MM/YYYY').add(12, 'hours');
    } else if (modelAttribute.type == 'json') {
      value = JSON.stringify(rawValue);
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
