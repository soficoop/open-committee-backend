const fs = require('fs').promises;
const handlebars = require('handlebars');
const { formatDate, getPlansAroundLocation } = require('./helpers');

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
async function parseTemplate(templateFile, doc) {
  const data = await fs.readFile(strapi.config.server.templatesDir + templateFile, 'utf8');
  const template = handlebars.compile(data);
  return template(doc);
}
  
/**
   * Sends an email using email plugin
   * @param {string} to recipient
   * @param {string} subject email subject
   * @param {string} html content of the mail
   */
async function sendMail(to, subject, html) {
  try {
    await strapi.plugins.email.services.email.send({
      to,
      subject,
      html
    });
  } catch (e) {
    strapi.log.error(e.message);
    strapi.log.error(e.stack);
  }
}
  
/**
   * for every user, email every updated plan that is located in the user's location subscription radius
   * @param {Date} from minimum updatedAt value for plans
   */
async function sendLocationSubscriptionEmails(from = new Date()) {
  const users = await strapi.query('user', 'users-permissions').find({ subscribedLocations_null: false });
  const plans = await strapi.query('plan').find({ createdAt_gt: from, geometry_ne: '', geometry_null: false });
  for (const user of users) {
    const plansToEmail = [];
    for (const location of user.subscribedLocations) {
      plansToEmail.push(...await getPlansAroundLocation(location, plans));
    }
    const token =  strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id }, { expiresIn: '7d' });
    const subject = `תכניות חדשות במיקומים במעקב שלך | ${formatDate(new Date())}`;
    if (plansToEmail.length)
      await sendMail(user.email, subject, await parseTemplate('NewPlansInRadius.html', { user, token, plans }));
  }
}

module.exports = {
  parseTemplate,
  sendLocationSubscriptionEmails,
  sendMail,
};