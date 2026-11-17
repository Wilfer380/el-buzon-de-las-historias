export const workshopStages = [
  'lobby', 'icebreaker', 'contributions', 'poll', 'story', 'complete',
] as const
export type WorkshopStage = typeof workshopStages[number]

export const contributionCategories = ['experience', 'difficulty', 'hope', 'idea'] as const
export type ContributionCategory = typeof contributionCategories[number]

export const contributionStatuses = ['pending', 'approved', 'rejected'] as const
export type ContributionStatus = typeof contributionStatuses[number]
