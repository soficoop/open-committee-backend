'use strict';
const parseTemplate = require('../../../config/functions/template');

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async create(ctx) {
    const application = await strapi.services['contact-applications'].create(ctx.request.body);
    console.info(strapi.config.emailTemplatesDir);
    strapi.plugins.email.services.email.send({
      to: 'opencommittee@sviva.net',
      subject: 'פניה חדשה דרך טופס צור קשר',
      html: await parseTemplate('ContactApplication.html', { application })
    });
    return application;
  }
};
