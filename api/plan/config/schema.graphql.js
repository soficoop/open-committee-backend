module.exports = {
  mutation: `
        updateMyPlan(input: updatePlanInput): updatePlanPayload
        tagPlan(tags: [String!]! planId: ID!): updatePlanPayload
    `,
  resolver: {
    Mutation: {
      updateMyPlan: {
        description: 'Updates a plan that the current user is an admin of',
        resolverOf: 'Plan.updateMyPlan',
        resolver: async (obj, options, { context }) => strapi.controllers.plan.updateMyPlan(context)
      },
      tagPlan: {
        description: 'Tag a plan',
        resolverOf: 'Plan.tagPlan',
        resolver: async (obj, options, { context }) => strapi.controllers.plan.tagPlan(context)
      }
    }
  }
};