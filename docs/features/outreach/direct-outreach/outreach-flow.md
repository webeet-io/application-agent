# Direct Outreach Flow

## High-Level Flow
1. Input: company name + optional domain + job context.
2. Discover 2-3 relevant contacts (port-based provider).
3. Validate each email and keep only high-confidence results.
4. Generate a personalized draft email.
5. User reviews and sends manually.
6. Log outreach in the application tracker.

## Inputs Used for Drafting
- Job title + description
- Resume highlights
- Company context (career page or description)
- Contact name + title

## Tracking
- Store `draftedAt` and optional `sentAt` timestamps.
- Status is tracked alongside application status.
