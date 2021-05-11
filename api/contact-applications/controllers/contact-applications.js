'use strict';
const { parseTemplate, sendMail } = require('../../../utils/email');

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async create(ctx) {
    const application = await strapi.services['contact-applications'].create(ctx.request.body);
    sendMail(
      'opencommittee@sviva.net',
      `פניה חדשה מאת ${application.name}`,
      await parseTemplate('ContactApplication.html', { application })
    );
    return application;
  }
};
