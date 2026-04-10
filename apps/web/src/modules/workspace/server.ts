import { extractUserProfile } from '@/modules/auth/lib/extract-user-profile'
import { requireUser } from '@/modules/auth/server'

export interface WorkspaceUserContext {
  userId: string
  avatarUrl: string | null
  displayName: string
}

export async function getWorkspaceUserContext(): Promise<WorkspaceUserContext> {
  const user = await requireUser()
  const { avatarUrl, displayName } = extractUserProfile(user)

  return {
    userId: user.id,
    avatarUrl,
    displayName,
  }
}
