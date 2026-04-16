type UserIdentity = {
  identity_data?: Record<string, unknown> | null
}

type UserProfileSource = {
  email?: string | null
  id: string
  user_metadata?: Record<string, unknown>
  identities?: UserIdentity[] | null
}

function pickString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

export function extractUserProfile(user: UserProfileSource) {
  const primaryIdentity =
    Array.isArray(user.identities) && user.identities.length > 0
      ? user.identities[0]?.identity_data
      : null

  const avatarUrl =
    pickString(user.user_metadata?.avatar_url) ??
    pickString(user.user_metadata?.picture) ??
    pickString(primaryIdentity?.avatar_url) ??
    pickString(primaryIdentity?.picture)

  const displayName =
    pickString(user.user_metadata?.full_name) ??
    pickString(user.user_metadata?.name) ??
    pickString(primaryIdentity?.full_name) ??
    pickString(primaryIdentity?.name) ??
    user.email ??
    user.id

  return { avatarUrl, displayName }
}
