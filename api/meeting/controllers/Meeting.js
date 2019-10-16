'use strict';

module.exports = {
  /**
   * Emails meeting to its subscribers
   * @param {import("koa").Context} ctx Koa context
   * @param {any?} meeting Meeting to send email about (optional)
   */
  async emailSubscribers(ctx) {
    const meeting = await strapi.services.meeting.findOne({ id: ctx.params.id });
    if (!isUserMeetingAdmin(meeting, ctx.state.user)) {
      throw new Error('You\'re not allowed to perform this action!');
    }
    return await strapi.services.meeting.emailSubscribers(ctx.params.id, ctx.params.isNew);
  },

  async addEmailView(ctx) {
    const meetingService = strapi.services.meeting;
    const meeting = await meetingService.findOne({ id: ctx.params.id });
    meetingService.update({ id: meeting.id }, { emailViews: meeting.emailViews + 1 });
    ctx.send(200);
  },

  /**
   * Updates a meeting that the current user is an admin of
   * @param {import("koa").ParameterizedContext} ctx Koa context
   */
  async updateMyMeeting(ctx) {
    const meetingService = strapi.services.meeting;
    const meeting = await meetingService.findOne({ id: ctx.params.id });
    if (!isUserMeetingAdmin(meeting, ctx.state.user)) {
      throw new Error('You\'re not allowed to perform this action!');
    }
    return { meeting: await meetingService.update({ id: meeting.id }, ctx.request.body) };
  },
};

/**
 * Checks whether a user is an admin of a given meeting
 * @param {any} meeting Meeting object
 * @param {any} user User object
 * @returns {boolean}
 */
function isUserMeetingAdmin(meeting, user) {
  const userCommittees = !!user && user.committees;
  const resultCommiteeId = !!meeting.committee && meeting.committee.id;
  if (!userCommittees || !userCommittees.find(committee => committee.id == resultCommiteeId)) {
    return false;
  }
  return true;
}