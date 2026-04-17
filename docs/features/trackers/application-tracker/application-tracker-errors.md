# Application Tracker Error Handling

## Error Types (Repository)
```typescript
export type ApplicationRepositoryError =
  | { type: 'not_found'; id: string }
  | { type: 'db_error'; message: string }
```

## Error Types (Use Case)
```typescript
export type UpdateApplicationStatusError =
  | { type: 'not_found'; id: string }
  | { type: 'db_error'; message: string }
  | { type: 'unsupported_outcome'; outcome: ApplicationOutcome }
```

## Guidelines
- Use `not_found` if an application id does not exist.
- Use `db_error` for insert/update/delete failures.
- Use `unsupported_outcome` when the outcome is not yet supported by the schema (e.g. `no_response`).
- Domain logic should not throw for expected runtime errors.

## Notes
- Validation errors (missing jobId/resumeId) should be handled at the API layer.
