# Direct Outreach Tracking

## Purpose
Outreach activity should appear in the application tracker so users can follow up and see which roles had direct contact.

## Suggested Table (Conceptual)
```text
outreach_logs
- id
- application_id
- contact_name
- contact_email
- status (drafted | sent | follow_up_due)
- drafted_at
- sent_at
- notes
```

## Integration
- Link by `application_id`.
- Show outreach status next to application status.
- Allow multiple outreach attempts per application.
