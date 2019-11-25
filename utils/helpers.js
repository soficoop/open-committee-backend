module.exports = {
  /**
   * returns the IL format of a given date
   * @param {Date} date given date
   */
  formatDate(date) {
    const dateList = date.toISOString().split('T')[0].split('-');
    return `${dateList[2]}.${dateList[1]}.${dateList[0]}`;
  }
};