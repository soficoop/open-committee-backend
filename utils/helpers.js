const { default: booleanIntersects } = require('@turf/boolean-intersects');
const { default: circle } = require('@turf/circle');
const { polygon } = require('@turf/helpers');

module.exports = {
  /**
   * returns the IL format of a given date
   * @param {Date} date given date
   */
  formatDate(date) {
    const dateList = date.toISOString().split('T')[0].split('-');
    return `${dateList[2]}.${dateList[1]}.${dateList[0]}`;
  },
  
  async getPlansAroundLocation(location, plans) {
    const subscriptionCircle = circle([location.lng, location.lat], location.radius, { units: 'kilometers' });
    const result = [];
    for (const plan of plans) {
      const geometry = JSON.parse(plan.geometry);
      let planPolygon;
      try {
        planPolygon = polygon(geometry);
      } catch (e) {
        console.error(e);
        continue;
      }
      if (booleanIntersects(subscriptionCircle, planPolygon)) {
        result.push(plan);
      }
    }
    return result;
  }
};