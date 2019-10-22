module.exports = {
  definition: `
        type emailMeetingPayload {
            meeting: Meeting
            recipients: [UsersPermissionsUser]
        }

        input EmailMeetingInput {
          where: InputID!
        }
    `,
  mutation: `
        emailMeeting(input: EmailMeetingInput!): emailMeetingPayload
        updateMyMeeting(input: updateMeetingInput): updateMeetingPayload
    `,
  resolver: {
    Mutation: {
      emailMeeting: {
        description: 'Email meeting to its subscribers',
        resolverOf: 'Meeting.emailSubscribers',
        resolver: async (obj, options, { context }) => strapi.controllers.meeting.emailSubscribers(context)
      },
      updateMyMeeting: {
        description: 'Updates a meeting that the current user is an admin of',
        resolverOf: 'Meeting.updateMyMeeting',
        resolver: async (obj, options, { context }) => strapi.controllers.meeting.updateMyMeeting(context)
      }
    }
  }
};