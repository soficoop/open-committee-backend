const fs = require('fs').promises;
const handlebars = require('handlebars');

handlebars.registerHelper('formatDate', (date) => {
  const dateList = date.toISOString().split('T')[0].split('-');
  return `${dateList[2]}.${dateList[1]}.${dateList[0]}`;
});

handlebars.registerHelper('appUrl', () => strapi.config.currentEnvironment.appUrl);

module.exports = async (templateFile, doc) => {
  const data = await fs.readFile(templateFile, 'utf8');
  const template = handlebars.compile(data);
  return template(doc);
};