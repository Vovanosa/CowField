import { ActorType, type PrismaClient } from '@prisma/client'

type ActorReference = {
  actorType: ActorType
  userId: string | null
}

function getUserIdFromActorKey(actorKey: string) {
  if (!actorKey.startsWith('user:')) {
    return null
  }

  return actorKey.slice('user:'.length) || null
}

function isGuestActorKey(actorKey: string) {
  return actorKey.startsWith('guest:')
}

export async function resolveActorReference(
  _prisma: PrismaClient,
  actorKey: string,
): Promise<ActorReference> {
  const userId = getUserIdFromActorKey(actorKey)

  if (userId) {
    return {
      actorType: ActorType.user,
      userId,
    }
  }

  if (!isGuestActorKey(actorKey)) {
    throw new Error(`Unsupported actor key format: ${actorKey}`)
  }

  return {
    actorType: ActorType.guest,
    userId: null,
  }
}
