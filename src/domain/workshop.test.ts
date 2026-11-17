import { describe, expect, it } from 'vitest'
import { contributionCategories, contributionStatuses, workshopStages } from './workshop'

describe('stable workshop domain boundaries', () => {
  it('publishes persisted stages in workflow order', () => {
    expect(workshopStages).toEqual(['lobby', 'icebreaker', 'contributions', 'poll', 'story', 'complete'])
  })
  it('publishes moderated contribution boundaries', () => {
    expect(contributionCategories).toEqual(['word', 'phrase', 'idea'])
    expect(contributionStatuses).toEqual(['pending', 'approved', 'rejected'])
  })
})
