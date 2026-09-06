import { requireDemoSession } from './demoAccess'
import { Presence } from '@convex-dev/presence'
import { v } from 'convex/values'
import { components } from './_generated/api'
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'

const presence = new Presence(components.presence)

type IdentityKey = 'operator' | 'northstar' | 'everyday' | 'avery' | 'puroair'

const presenceState = v.object({
  userId: v.string(),
  online: v.boolean(),
  lastDisconnected: v.number(),
  data: v.optional(v.any()),
})

const typingUser = v.object({
  identityKey: v.string(),
  label: v.string(),
})

function typingRoomId(threadKey: string) {
  return `typing:${threadKey}`
}

function isIdentityKey(value: string): value is IdentityKey {
  return ['operator', 'northstar', 'everyday', 'avery', 'puroair'].includes(value)
}

function identityLabel(identityKey: string) {
  if (identityKey === 'operator') return 'Waverly Operator'
  if (identityKey === 'northstar') return 'Northstar Media'
  if (identityKey === 'everyday') return 'Everyday Finds'
  if (identityKey === 'puroair') return 'PuroAir'
  if (identityKey === 'avery') return 'Avery Lane'
  return 'Participant'
}

async function requireParticipant(
  ctx: QueryCtx | MutationCtx,
  threadKey: string,
  identityKey: IdentityKey,
) {
  const thread = await ctx.db
    .query('messageThreads')
    .withIndex('by_key', (q) => q.eq('key', threadKey))
    .unique()
  if (!thread) throw new Error('Conversation not found.')

  const participant = await ctx.db
    .query('messageThreadParticipants')
    .withIndex('by_threadId_and_identityKey', (q) =>
      q.eq('threadId', thread._id).eq('identityKey', identityKey),
    )
    .unique()
  if (!participant) throw new Error('This demo identity cannot access that conversation.')
  return thread
}

export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
  },
  returns: v.object({ roomToken: v.string(), sessionToken: v.string() }),
  handler: async (ctx, args) => {
    await requireDemoSession(ctx)
    if (!args.roomId.startsWith('typing:')) throw new Error('Unsupported presence room.')
    if (!isIdentityKey(args.userId)) throw new Error('Unknown demo identity.')
    const threadKey = args.roomId.slice('typing:'.length)
    await requireParticipant(ctx, threadKey, args.userId)
    return await presence.heartbeat(ctx, args.roomId, args.userId, args.sessionId, args.interval)
  },
})

export const list = query({
  args: { roomToken: v.string() },
  returns: v.array(presenceState),
  handler: async (ctx, args) => {
    await requireDemoSession(ctx)
    return await presence.list(ctx, args.roomToken)
  },
})

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDemoSession(ctx)
    return await presence.disconnect(ctx, args.sessionToken)
  },
})

export const listTyping = query({
  args: { threadKey: v.string(), identityKey: v.string() },
  returns: v.array(typingUser),
  handler: async (ctx, args) => {
    await requireDemoSession(ctx)
    if (!isIdentityKey(args.identityKey)) throw new Error('Unknown demo identity.')
    await requireParticipant(ctx, args.threadKey, args.identityKey)
    const users = await presence.listRoom(ctx, typingRoomId(args.threadKey), true, 10)
    return users
      .filter((user) => user.online && user.userId !== args.identityKey)
      .map((user) => ({
        identityKey: user.userId,
        label: identityLabel(user.userId),
      }))
  },
})
