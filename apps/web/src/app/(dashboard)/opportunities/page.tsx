import { OpportunityFeed } from '@/modules/opportunities/components/opportunity-feed'
import { mockedOpportunities } from '@/modules/opportunities/mock-opportunities'

export default function OpportunitiesPage() {
  return <OpportunityFeed opportunities={mockedOpportunities} resultSetId="mock-opportunities-preview" />
}
