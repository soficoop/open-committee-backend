module.exports = {
  /**
   * returns the IL format of a given date
   * @param {Date} date given date
   */
  formatDate(date) {
    const dateList = date.toISOString().split('T')[0].split('-');
    return `${dateList[2]}.${dateList[1]}.${dateList[0]}`;
  },

  /**
   * Sends an email using email plugin
   * @param {string} to recipient
   * @param {string} subject email subject
   * @param {string} html content of the mail
   */
  async sendMail(to, subject, html) {
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
};