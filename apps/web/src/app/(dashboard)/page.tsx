import { redirect } from 'next/navigation'
import { resolveUserOnboardingStateUseCase } from '@/infrastructure/container'
import { ChatInterface } from '@/modules/chat/components/chat-interface'
import { getWorkspaceUserContext } from '@/modules/workspace/server'

export default async function DashboardHome() {
  const userContext = await getWorkspaceUserContext()
  const onboardingStateResult = await resolveUserOnboardingStateUseCase.execute({
    userId: userContext.userId,
  })

  if (!onboardingStateResult.success) {
    throw new Error(onboardingStateResult.error.message)
  }

  if (onboardingStateResult.value.status !== 'profile_ready') {
    redirect('/onboarding')
  }

  return <ChatInterface />
}
