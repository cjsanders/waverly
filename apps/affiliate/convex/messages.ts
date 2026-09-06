/* eslint-disable no-await-in-loop -- Preserve ordered writes inside a single Convex transaction. */
import { requireDemoSession } from './demoAccess'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'

type IdentityKey = 'operator' | 'northstar' | 'everyday' | 'avery' | 'puroair'
type ReactionEmoji = '👍' | '❤️' | '🎉' | '😂' | '👀'

const identityKey = v.union(
  v.literal('operator'),
  v.literal('northstar'),
  v.literal('everyday'),
  v.literal('avery'),
  v.literal('puroair'),
)

const reactionEmoji = v.union(
  v.literal('👍'),
  v.literal('❤️'),
  v.literal('🎉'),
  v.literal('😂'),
  v.literal('👀'),
)

const reactionOptions: ReactionEmoji[] = ['👍', '❤️', '🎉', '😂', '👀']
const maxAttachments = 4
const maxAttachmentBytes = 10 * 1024 * 1024
const allowedContentTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

const attachmentInput = v.object({
  storageId: v.id('_storage'),
  name: v.string(),
  contentType: v.string(),
  size: v.number(),
})

const messageAttachment = v.object({
  id: v.id('messageAttachments'),
  name: v.string(),
  contentType: v.string(),
  size: v.number(),
  url: v.string(),
})

const messageReaction = v.object({
  emoji: reactionEmoji,
  count: v.number(),
  reactedByCurrentUser: v.boolean(),
})

const threadSummary = v.object({
  id: v.string(),
  title: v.string(),
  team: v.string(),
  counterpartIdentityKey: v.union(identityKey, v.null()),
  preview: v.string(),
  lastMessageAt: v.number(),
  unread: v.number(),
  status: v.union(v.literal('online'), v.literal('away')),
})

const message = v.object({
  id: v.id('messageEntries'),
  senderIdentityKey: v.string(),
  author: v.string(),
  text: v.string(),
  sentAt: v.number(),
  attachments: v.array(messageAttachment),
  reactions: v.array(messageReaction),
})

async function requireParticipantByThreadId(
  ctx: QueryCtx | MutationCtx,
  threadId: Id<'messageThreads'>,
  identity: IdentityKey,
) {
  const participant = await ctx.db
    .query('messageThreadParticipants')
    .withIndex('by_threadId_and_identityKey', (q) =>
      q.eq('threadId', threadId).eq('identityKey', identity),
    )
    .unique()
  if (!participant) throw new Error('This demo identity cannot access that conversation.')
  return participant
}

async function requireThreadParticipant(
  ctx: QueryCtx | MutationCtx,
  threadKey: string,
  identity: IdentityKey,
) {
  const thread = await ctx.db
    .query('messageThreads')
    .withIndex('by_key', (q) => q.eq('key', threadKey))
    .unique()
  if (!thread) throw new Error('Conversation not found.')
  await requireParticipantByThreadId(ctx, thread._id, identity)
  return thread
}

function senderLabel(identity: IdentityKey) {
  if (identity === 'operator') return 'Waverly Operator'
  if (identity === 'northstar') return 'Northstar Media'
  if (identity === 'everyday') return 'Everyday Finds'
  if (identity === 'puroair') return 'PuroAir'
  return 'Avery Lane'
}

export const listThreads = query({
  args: { identityKey },
  returns: v.array(threadSummary),
  handler: async (ctx, args) => {
    await requireDemoSession(ctx)
    const participantRows = await ctx.db
      .query('messageThreadParticipants')
      .withIndex('by_identityKey', (q) => q.eq('identityKey', args.identityKey))
      .take(50)

    const rows = await Promise.all(
      participantRows.map(async (participant) => {
        const thread = await ctx.db.get('messageThreads', participant.threadId)
        if (!thread) return null
        const threadParticipants = await ctx.db
          .query('messageThreadParticipants')
          .withIndex('by_threadId', (q) => q.eq('threadId', participant.threadId))
          .take(10)
        const counterpart = threadParticipants.find((row) => row.identityKey !== args.identityKey)
        return {
          id: thread.key,
          title: participant.title,
          team: participant.team,
          counterpartIdentityKey: counterpart?.identityKey ?? null,
          preview: thread.lastMessagePreview,
          lastMessageAt: thread.lastMessageAt,
          unread: participant.unreadCount,
          status: thread.status,
        }
      }),
    )

    return rows
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt)
  },
})

export const listMessages = query({
  args: { threadKey: v.string(), identityKey },
  returns: v.array(message),
  handler: async (ctx, args) => {
    await requireDemoSession(ctx)
    const thread = await requireThreadParticipant(ctx, args.threadKey, args.identityKey)
    const rows = await ctx.db
      .query('messageEntries')
      .withIndex('by_threadId_and_sentAt', (q) => q.eq('threadId', thread._id))
      .order('desc')
      .take(100)

    const attachmentRows = await ctx.db
      .query('messageAttachments')
      .withIndex('by_threadId', (q) => q.eq('threadId', thread._id))
      .take(400)
    const hydratedAttachments = (
      await Promise.all(
        attachmentRows.map(async (row) => {
          const url = await ctx.storage.getUrl(row.storageId)
          if (!url) return null
          return {
            messageId: row.messageId,
            id: row._id,
            name: row.fileName,
            contentType: row.contentType,
            size: row.size,
            url,
          }
        }),
      )
    ).filter((row): row is NonNullable<typeof row> => row !== null)
    const attachmentsByMessage = new Map<string, typeof hydratedAttachments>()
    for (const attachment of hydratedAttachments) {
      const grouped = attachmentsByMessage.get(attachment.messageId) ?? []
      grouped.push(attachment)
      attachmentsByMessage.set(attachment.messageId, grouped)
    }

    const reactionRows = await ctx.db
      .query('messageReactions')
      .withIndex('by_threadId', (q) => q.eq('threadId', thread._id))
      .take(500)
    const reactionsByMessage = new Map<string, Map<ReactionEmoji, Set<IdentityKey>>>()
    for (const reaction of reactionRows) {
      const grouped = reactionsByMessage.get(reaction.messageId) ?? new Map()
      const identities = grouped.get(reaction.emoji) ?? new Set<IdentityKey>()
      identities.add(reaction.identityKey)
      grouped.set(reaction.emoji, identities)
      reactionsByMessage.set(reaction.messageId, grouped)
    }

    return rows.toReversed().map((row) => {
      const reactions = reactionsByMessage.get(row._id)
      return {
        id: row._id,
        senderIdentityKey: row.senderIdentityKey,
        author: row.senderLabel,
        text: row.body,
        sentAt: row.sentAt,
        attachments: (attachmentsByMessage.get(row._id) ?? []).map(
          ({ messageId: _messageId, ...attachment }) => attachment,
        ),
        reactions: reactionOptions.flatMap((emoji) => {
          const identities = reactions?.get(emoji)
          return identities
            ? [
                {
                  emoji,
                  count: identities.size,
                  reactedByCurrentUser: identities.has(args.identityKey),
                },
              ]
            : []
        }),
      }
    })
  },
})

export const generateAttachmentUploadUrl = mutation({
  args: { threadKey: v.string(), identityKey },
  returns: v.string(),
  handler: async (ctx, args) => {
    await requireDemoSession(ctx)
    await requireThreadParticipant(ctx, args.threadKey, args.identityKey)
    return await ctx.storage.generateUploadUrl()
  },
})

export const send = mutation({
  args: {
    threadKey: v.string(),
    identityKey,
    body: v.string(),
    clientNonce: v.string(),
    attachments: v.optional(v.array(attachmentInput)),
  },
  returns: v.id('messageEntries'),
  handler: async (ctx, args) => {
    await requireDemoSession(ctx)
    const body = args.body.trim()
    const attachments = args.attachments ?? []
    if (body.length === 0 && attachments.length === 0) {
      throw new Error('Write a message or add an attachment before sending.')
    }
    if (body.length > 2_000)
      throw new Error('Messages are limited to 2,000 characters in this POC.')
    if (attachments.length > maxAttachments)
      throw new Error(`Add up to ${maxAttachments} attachments per message.`)

    const thread = await requireThreadParticipant(ctx, args.threadKey, args.identityKey)
    const duplicate = await ctx.db
      .query('messageEntries')
      .withIndex('by_clientNonce', (q) => q.eq('clientNonce', args.clientNonce))
      .unique()
    if (duplicate) {
      if (duplicate.threadId !== thread._id || duplicate.senderIdentityKey !== args.identityKey) {
        throw new Error('This message key belongs to another conversation or sender.')
      }
      return duplicate._id
    }
    const seenStorageIds = new Set<string>()
    const normalizedAttachments = []
    for (const attachment of attachments) {
      const name = attachment.name.trim()
      // eslint-disable-next-line no-control-regex -- Reject control characters in attachment names.
      if (!name || name.length > 160 || /[\u0000-\u001f]/.test(name))
        throw new Error('Attachment names must be 1–160 visible characters.')
      if (!allowedContentTypes.has(attachment.contentType))
        throw new Error(`${name} is not a supported file type.`)
      if (attachment.size <= 0 || attachment.size > maxAttachmentBytes)
        throw new Error(`${name} must be 10 MB or smaller.`)
      if (seenStorageIds.has(attachment.storageId))
        throw new Error(`${name} was attached more than once.`)
      seenStorageIds.add(attachment.storageId)

      const used = await ctx.db
        .query('messageAttachments')
        .withIndex('by_storageId', (q) => q.eq('storageId', attachment.storageId))
        .unique()
      if (used) throw new Error(`${name} is already attached to a message.`)

      const metadata = await ctx.db.system.get('_storage', attachment.storageId)
      if (
        !metadata ||
        metadata.size !== attachment.size ||
        (metadata.contentType !== undefined && metadata.contentType !== attachment.contentType)
      ) {
        throw new Error(`${name} could not be verified after upload.`)
      }
      normalizedAttachments.push({ ...attachment, name })
    }

    const sentAt = Date.now()
    const messageId = await ctx.db.insert('messageEntries', {
      threadId: thread._id,
      senderIdentityKey: args.identityKey,
      senderLabel: senderLabel(args.identityKey),
      body,
      sentAt,
      clientNonce: args.clientNonce,
    })

    for (const attachment of normalizedAttachments) {
      await ctx.db.insert('messageAttachments', {
        threadId: thread._id,
        messageId,
        storageId: attachment.storageId,
        fileName: attachment.name,
        contentType: attachment.contentType,
        size: attachment.size,
        createdAt: sentAt,
      })
    }

    const attachmentPreview =
      normalizedAttachments.length === 1
        ? `Attached ${normalizedAttachments[0].name}`
        : `Attached ${normalizedAttachments.length} files`
    await ctx.db.patch('messageThreads', thread._id, {
      lastMessageAt: sentAt,
      lastMessagePreview: body || attachmentPreview,
    })

    const participants = await ctx.db
      .query('messageThreadParticipants')
      .withIndex('by_threadId', (q) => q.eq('threadId', thread._id))
      .take(10)
    for (const row of participants) {
      await ctx.db.patch('messageThreadParticipants', row._id, {
        unreadCount: row.identityKey === args.identityKey ? 0 : row.unreadCount + 1,
      })
    }

    return messageId
  },
})

export const toggleReaction = mutation({
  args: { messageId: v.id('messageEntries'), identityKey, emoji: reactionEmoji },
  returns: v.object({ active: v.boolean() }),
  handler: async (ctx, args) => {
    await requireDemoSession(ctx)
    const targetMessage = await ctx.db.get('messageEntries', args.messageId)
    if (!targetMessage) throw new Error('Message not found.')
    await requireParticipantByThreadId(ctx, targetMessage.threadId, args.identityKey)

    const existing = await ctx.db
      .query('messageReactions')
      .withIndex('by_messageId_and_identityKey_and_emoji', (q) =>
        q
          .eq('messageId', args.messageId)
          .eq('identityKey', args.identityKey)
          .eq('emoji', args.emoji),
      )
      .unique()
    if (existing) {
      await ctx.db.delete(existing._id)
      return { active: false }
    }

    await ctx.db.insert('messageReactions', {
      threadId: targetMessage.threadId,
      messageId: args.messageId,
      identityKey: args.identityKey,
      emoji: args.emoji,
      createdAt: Date.now(),
    })
    return { active: true }
  },
})

export const markRead = mutation({
  args: { threadKey: v.string(), identityKey },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDemoSession(ctx)
    const thread = await ctx.db
      .query('messageThreads')
      .withIndex('by_key', (q) => q.eq('key', args.threadKey))
      .unique()
    if (!thread) return null

    const participant = await requireParticipantByThreadId(ctx, thread._id, args.identityKey)
    if (participant.unreadCount > 0) {
      await ctx.db.patch('messageThreadParticipants', participant._id, { unreadCount: 0 })
    }
    return null
  },
})
