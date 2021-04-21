const fs = require('fs').promises;
const handlebars = require('handlebars');
const { formatDate } = require('../../utils/helpers');

handlebars.registerHelper('formatDate', formatDate);

handlebars.registerHelper('shortenText', (text) => {
  let words = text.split(' ');
  if (words.length > 50) {
    return words.slice(0, 50).join(' ') + '...';
  }
  return text;
});
  
handlebars.registerHelper('appUrl', () => strapi.config.server.appUrl);
handlebars.registerHelper('strapiUrl', () => strapi.config.server.strapiUrl);

handlebars.registerHelper('formatMeetingTitle', meeting => meeting.title || `ישיבה מספר ${meeting.number}`);

/**
 * Parses an HTML email template from templates dir
 * @param {string} templateFile name of template file
 * @param {object} doc template variables
 * @returns the parsed template with a value for each variable
 */
module.exports = async (templateFile, doc) => {
  const data = await fs.readFile(strapi.config.server.templatesDir + templateFile, 'utf8');
  const template = handlebars.compile(data);
  return template(doc);
};