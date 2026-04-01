# Application Tracker Error Handling

## Error Types (Repository)
```typescript
export type ApplicationRepositoryError =
  | { type: 'not_found'; id: string }
  | { type: 'db_error'; message: string }
```

## Guidelines
- Use `not_found` if an application id does not exist.
- Use `db_error` for insert/update/delete failures.
- Domain logic should not throw for expected runtime errors.

## Notes
- Validation errors (missing jobId/resumeId) should be handled at the API layer.
