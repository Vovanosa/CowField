import { ActorType, type PrismaClient } from '@prisma/client'

type ActorReference = {
  actorType: ActorType
  userId: string | null
  guestProfileId: string | null
}

type ResolveActorOptions = {
  createGuestProfile?: boolean
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
  prisma: PrismaClient,
  actorKey: string,
  options?: ResolveActorOptions,
): Promise<ActorReference> {
  const userId = getUserIdFromActorKey(actorKey)

  if (userId) {
    return {
      actorType: ActorType.user,
      userId,
      guestProfileId: null,
    }
  }

  if (!isGuestActorKey(actorKey)) {
    throw new Error(`Unsupported actor key format: ${actorKey}`)
  }

  if (options?.createGuestProfile) {
    const guestProfile = await prisma.guestProfile.upsert({
      where: {
        actorKey,
      },
      update: {},
      create: {
        actorKey,
      },
    })

    return {
      actorType: ActorType.guest,
      userId: null,
      guestProfileId: guestProfile.id,
    }
  }

  const guestProfile = await prisma.guestProfile.findUnique({
    where: {
      actorKey,
    },
  })

  return {
    actorType: ActorType.guest,
    userId: null,
    guestProfileId: guestProfile?.id ?? null,
  }
}
