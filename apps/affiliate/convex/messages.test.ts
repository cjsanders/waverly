/* eslint-disable no-await-in-loop -- Preserve ordered writes inside a single Convex transaction. */
/// <reference types="vite/client" />

import { convexTest } from 'convex-test'
import { register as registerPresence } from '@convex-dev/presence/test'
import { describe, expect, test } from 'vitest'
import { api } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

async function seedConversation(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    const threadId = await ctx.db.insert('messageThreads', {
      key: 'test-thread',
      subject: 'Test conversation',
      team: 'Partner operations',
      status: 'online',
      lastMessageAt: 1,
      lastMessagePreview: 'Initial message',
      createdAt: 1,
    })
    for (const participant of ['operator', 'northstar'] as const) {
      await ctx.db.insert('messageThreadParticipants', {
        threadId,
        identityKey: participant,
        title: 'Test conversation',
        team: participant === 'operator' ? 'Partner operations' : 'Northstar Media',
        unreadCount: 0,
        joinedAt: 1,
      })
    }
    const messageId = await ctx.db.insert('messageEntries', {
      threadId,
      senderIdentityKey: 'operator',
      senderLabel: 'Waverly Operator',
      body: 'Ready for review.',
      sentAt: 1,
      clientNonce: 'seed-message',
    })
    return { threadId, messageId }
  })
}

describe('message collaboration', () => {
  test('both seeded participants resolve the same thread and can reply to each other', async () => {
    const t = convexTest(schema, modules)
    await seedConversation(t)
    const operator = t.withIdentity({ subject: 'operator', tokenIdentifier: 'demo|operator' })
    const northstar = t.withIdentity({ subject: 'northstar', tokenIdentifier: 'demo|northstar' })

    const operatorThreads = await operator.query(api.messages.listThreads, {
      identityKey: 'operator',
    })
    const northstarThreads = await northstar.query(api.messages.listThreads, {
      identityKey: 'northstar',
    })
    expect(operatorThreads[0]).toMatchObject({
      id: 'test-thread',
      counterpartIdentityKey: 'northstar',
    })
    expect(northstarThreads[0]).toMatchObject({
      id: 'test-thread',
      counterpartIdentityKey: 'operator',
    })

    await operator.mutation(api.messages.send, {
      threadKey: 'test-thread',
      identityKey: 'operator',
      body: 'Hello from Waverly.',
      clientNonce: 'operator-reply',
      attachments: [],
    })
    await northstar.mutation(api.messages.send, {
      threadKey: 'test-thread',
      identityKey: 'northstar',
      body: 'Hello back from Northstar.',
      clientNonce: 'northstar-reply',
      attachments: [],
    })

    const operatorView = await operator.query(api.messages.listMessages, {
      threadKey: 'test-thread',
      identityKey: 'operator',
    })
    const northstarView = await northstar.query(api.messages.listMessages, {
      threadKey: 'test-thread',
      identityKey: 'northstar',
    })
    expect(operatorView.map((message) => message.text)).toEqual([
      'Ready for review.',
      'Hello from Waverly.',
      'Hello back from Northstar.',
    ])
    expect(northstarView).toEqual(operatorView)
  })

  test('participants can toggle shared reactions and non-participants are refused', async () => {
    const t = convexTest(schema, modules)
    const { messageId } = await seedConversation(t)
    const operator = t.withIdentity({ subject: 'operator', tokenIdentifier: 'demo|operator' })
    const northstar = t.withIdentity({ subject: 'northstar', tokenIdentifier: 'demo|northstar' })
    const outsider = t.withIdentity({ subject: 'avery', tokenIdentifier: 'demo|avery' })

    await operator.mutation(api.messages.toggleReaction, {
      messageId,
      identityKey: 'operator',
      emoji: '👍',
    })
    await northstar.mutation(api.messages.toggleReaction, {
      messageId,
      identityKey: 'northstar',
      emoji: '👍',
    })

    const visible = await northstar.query(api.messages.listMessages, {
      threadKey: 'test-thread',
      identityKey: 'northstar',
    })
    expect(visible[0].reactions).toEqual([{ emoji: '👍', count: 2, reactedByCurrentUser: true }])

    await operator.mutation(api.messages.toggleReaction, {
      messageId,
      identityKey: 'operator',
      emoji: '👍',
    })
    const afterToggle = await operator.query(api.messages.listMessages, {
      threadKey: 'test-thread',
      identityKey: 'operator',
    })
    expect(afterToggle[0].reactions).toEqual([
      { emoji: '👍', count: 1, reactedByCurrentUser: false },
    ])

    await expect(
      outsider.mutation(api.messages.toggleReaction, {
        messageId,
        identityKey: 'avery',
        emoji: '❤️',
      }),
    ).rejects.toThrow(/cannot access/i)
  })

  test('attachment-only messages are accepted and empty messages are refused', async () => {
    const t = convexTest(schema, modules)
    await seedConversation(t)
    const operator = t.withIdentity({ subject: 'operator', tokenIdentifier: 'demo|operator' })
    const stored = await t.run(
      async (ctx) =>
        await ctx.storage.store(new Blob(['quarterly summary'], { type: 'text/plain' })),
    )

    const messageId = await operator.mutation(api.messages.send, {
      threadKey: 'test-thread',
      identityKey: 'operator',
      body: '',
      clientNonce: 'attachment-only',
      attachments: [
        {
          storageId: stored,
          name: 'summary.txt',
          contentType: 'text/plain',
          size: 17,
        },
      ],
    })
    const attachmentRows = await t.run(
      async (ctx) =>
        await ctx.db
          .query('messageAttachments')
          .withIndex('by_messageId', (q) => q.eq('messageId', messageId))
          .take(4),
    )
    expect(attachmentRows).toHaveLength(1)
    expect(attachmentRows[0]).toMatchObject({
      fileName: 'summary.txt',
      contentType: 'text/plain',
      size: 17,
    })

    await expect(
      operator.mutation(api.messages.send, {
        threadKey: 'test-thread',
        identityKey: 'operator',
        body: '   ',
        clientNonce: 'empty-message',
        attachments: [],
      }),
    ).rejects.toThrow(/write a message or add an attachment/i)

    await expect(
      operator.mutation(api.messages.generateAttachmentUploadUrl, {
        threadKey: 'test-thread',
        identityKey: 'avery',
      }),
    ).rejects.toThrow(/cannot access/i)
  })

  test('typing presence is visible to participants and denied to outsiders', async () => {
    const t = convexTest(schema, modules)
    registerPresence(t)
    await seedConversation(t)
    const operator = t.withIdentity({ subject: 'operator', tokenIdentifier: 'demo|operator' })
    const northstar = t.withIdentity({ subject: 'northstar', tokenIdentifier: 'demo|northstar' })
    const outsider = t.withIdentity({ subject: 'avery', tokenIdentifier: 'demo|avery' })

    const session = await operator.mutation(api.presence.heartbeat, {
      roomId: 'typing:test-thread',
      userId: 'operator',
      sessionId: 'operator-tab-1',
      interval: 3_000,
    })
    const visible = await northstar.query(api.presence.listTyping, {
      threadKey: 'test-thread',
      identityKey: 'northstar',
    })
    expect(visible).toEqual([{ identityKey: 'operator', label: 'Waverly Operator' }])

    await expect(
      outsider.mutation(api.presence.heartbeat, {
        roomId: 'typing:test-thread',
        userId: 'avery',
        sessionId: 'outsider-tab-1',
        interval: 3_000,
      }),
    ).rejects.toThrow(/cannot access/i)

    await operator.mutation(api.presence.disconnect, { sessionToken: session.sessionToken })
    const afterDisconnect = await northstar.query(api.presence.listTyping, {
      threadKey: 'test-thread',
      identityKey: 'northstar',
    })
    expect(afterDisconnect).toEqual([])
  })
})
