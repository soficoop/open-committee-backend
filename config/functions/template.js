const fs = require('fs').promises;
const handlebars = require('handlebars');
const formatDate = require('../../utils/helpers').formatDate;

handlebars.registerHelper('formatDate', formatDate);

handlebars.registerHelper('shortenText', (text) => {
  let words = text.split(' ');
  if (words.length > 50) {
    return words.slice(0, 50).join(' ') + '...';
  }
  return text;
});
  
handlebars.registerHelper('appUrl', () => strapi.config.currentEnvironment.appUrl);
handlebars.registerHelper('strapiUrl', () => strapi.config.currentEnvironment.strapiUrl);

handlebars.registerHelper('formatMeetingTitle', meeting => meeting.title || `ישיבה מספר ${meeting.number}`);

module.exports = async (templateFile, doc) => {
  const data = await fs.readFile(strapi.config.templatesDir + templateFile, 'utf8');
  const template = handlebars.compile(data);
  return template(doc);
};