/* eslint-disable no-await-in-loop -- Upload each attachment before constructing the message payload. */
import { Bubble, BubbleContent, BubbleReactions } from '#/features/network/ui/bubble'
import { Button as ShadcnButton } from '#/features/network/ui/button'
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from '#/features/network/ui/message'
import { Popover, PopoverContent, PopoverTrigger } from '#/features/network/ui/popover'
import {
  Avatar,
  AvatarStatusDot,
  Button,
  ChatComposer,
  ChatLayout,
  ChatMessageList,
  EmptyState,
  HStack,
  Heading,
  Icon,
  IconButton,
  Layout,
  LayoutContent,
  LayoutPanel,
  List,
  ListItem,
  Text,
  TextInput,
  Token,
  Toolbar,
  VStack,
  useMediaQuery,
} from '#/features/network/ui/primitives'
import usePresence from '@convex-dev/presence/react'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  MessageSquareText,
  Search,
  SmilePlus,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

import { demoIdentityLabel } from './navigation'
import type {
  ConversationMessage,
  ConversationThread,
  DemoIdentity,
  MessageAttachment,
  ReactionEmoji,
} from './types'
export function formatMessageTime(timestamp: number) {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  if (isToday) {
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date)
  }
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
}

export const reactionOptions: ReactionEmoji[] = ['👍', '❤️', '🎉', '😂', '👀']
export const attachmentAccept = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  '.docx',
  '.xlsx',
].join(',')

export function attachmentContentType(file: File) {
  if (file.type) return file.type
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'docx')
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (extension === 'xlsx')
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  if (extension === 'csv') return 'text/csv'
  if (extension === 'txt') return 'text/plain'
  return 'application/octet-stream'
}

export function formatAttachmentSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function TypingHeartbeat({
  threadKey,
  identity,
}: {
  threadKey: string
  identity: DemoIdentity
}) {
  usePresence(api.presence, `typing:${threadKey}`, identity, 3_000)
  return null
}

export function MessageAttachmentCard({ attachment }: { attachment: MessageAttachment }) {
  if (attachment.contentType.startsWith('image/')) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded-lg border border-border/70 bg-background/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Open image attachment ${attachment.name}`}
      >
        <img src={attachment.url} alt={attachment.name} className="max-h-64 w-full object-cover" />
        <span className="flex items-center justify-between gap-3 px-2.5 py-2 text-xs">
          <span className="min-w-0 truncate font-medium">{attachment.name}</span>
          <span className="shrink-0 text-muted-foreground">
            {formatAttachmentSize(attachment.size)}
          </span>
        </span>
      </a>
    )
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      download={attachment.name}
      className="flex min-w-52 items-center gap-2.5 rounded-lg border border-border/70 bg-background/70 px-3 py-2.5 text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Download attachment ${attachment.name}`}
    >
      <FileText aria-hidden className="size-5 shrink-0 text-primary" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-xs font-semibold">{attachment.name}</span>
        <span className="text-[0.68rem] text-muted-foreground">
          {formatAttachmentSize(attachment.size)}
        </span>
      </span>
      <Download aria-hidden className="size-4 shrink-0 text-muted-foreground" />
    </a>
  )
}

export function ReactionPicker({ onReact }: { onReact: (emoji: ReactionEmoji) => void }) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <ShadcnButton
            variant="ghost"
            size="icon-xs"
            aria-label="Add a reaction"
            title="Add a reaction"
          />
        }
      >
        <SmilePlus />
      </PopoverTrigger>
      <PopoverContent side="top" align="center" className="w-auto p-1.5">
        <div className="flex items-center gap-0.5" aria-label="Choose a reaction">
          {reactionOptions.map((emoji) => (
            <ShadcnButton
              key={emoji}
              variant="ghost"
              size="icon-sm"
              aria-label={`React with ${emoji}`}
              onClick={() => onReact(emoji)}
              className="text-base"
            >
              {emoji}
            </ShadcnButton>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function TypingIndicator({ labels }: { labels: string[] }) {
  const phrase =
    labels.length === 1
      ? `${labels[0]} is typing`
      : `${labels.slice(0, 2).join(' and ')} are typing`
  return (
    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- Announce the entire rich typing indicator as one status.
    <Message role="status" aria-live="polite" aria-label={`${phrase}…`}>
      <MessageAvatar>
        <Avatar name={labels[0] ?? 'Participant'} size="md" />
      </MessageAvatar>
      <MessageContent>
        <Bubble variant="muted">
          <BubbleContent className="flex items-center gap-2 text-muted-foreground">
            <span>{phrase}</span>
            <span className="waverly-typing-dots" aria-hidden>
              <span />
              <span />
              <span />
            </span>
          </BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  )
}

export function MessagesSurface({
  identity,
  initialThreadId,
}: {
  identity: DemoIdentity
  initialThreadId?: string | null
}) {
  const isNarrow = useMediaQuery('(max-width: 900px)')
  const { isAuthenticated } = useConvexAuth()
  const persistedThreads = useQuery(
    api.messages.listThreads,
    isAuthenticated ? { identityKey: identity } : 'skip',
  )
  const sendPersistedMessage = useMutation(api.messages.send)
  const generateAttachmentUploadUrl = useMutation(api.messages.generateAttachmentUploadUrl)
  const togglePersistedReaction = useMutation(api.messages.toggleReaction)
  const markThreadRead = useMutation(api.messages.markRead)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>(initialThreadId ? 'chat' : 'list')
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(initialThreadId ?? null)
  const [search, setSearch] = useState('')
  const [draftsByThread, setDraftsByThread] = useState<Record<string, string>>({})
  const [attachmentsByThread, setAttachmentsByThread] = useState<Record<string, File[]>>({})
  const [isComposerFocused, setIsComposerFocused] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const hasPersistedThreads = (persistedThreads?.length ?? 0) > 0
  const threads: ConversationThread[] = (persistedThreads ?? []).map((thread) => ({
    ...thread,
    time: formatMessageTime(thread.lastMessageAt),
    messages: [],
  }))
  const selectedThread = threads.find((thread) => thread.id === selectedThreadId) ??
    threads[0] ?? {
      id: '',
      title: 'Conversation',
      team: 'Waverly operations',
      counterpartIdentityKey: null,
      preview: '',
      time: '',
      unread: 0,
      status: 'away' as const,
      messages: [],
    }
  const composerKey = selectedThread.id ? `${identity}:${selectedThread.id}` : ''
  const draft = composerKey ? (draftsByThread[composerKey] ?? '') : ''
  const pendingAttachments = composerKey ? (attachmentsByThread[composerKey] ?? []) : []
  const setDraft = (value: string) => {
    if (!composerKey) return
    setDraftsByThread((current) => ({ ...current, [composerKey]: value }))
  }
  const setPendingAttachments = (files: File[]) => {
    if (!composerKey) return
    setAttachmentsByThread((current) => ({ ...current, [composerKey]: files }))
  }
  const persistedMessages = useQuery(
    api.messages.listMessages,
    hasPersistedThreads && selectedThread
      ? { threadKey: selectedThread.id, identityKey: identity }
      : 'skip',
  )
  const typingUsers = useQuery(
    api.presence.listTyping,
    hasPersistedThreads && selectedThread
      ? { threadKey: selectedThread.id, identityKey: identity }
      : 'skip',
  )
  const messages: ConversationMessage[] = persistedMessages
    ? persistedMessages.map((message) => ({
        id: message.id,
        backendId: message.id,
        sender: message.senderIdentityKey === identity ? 'user' : 'assistant',
        author: message.author,
        text: message.text,
        time: formatMessageTime(message.sentAt),
        attachments: message.attachments,
        reactions: message.reactions,
      }))
    : []
  const normalizedSearch = search.trim().toLowerCase()
  const visibleThreads = threads.filter(
    (thread) =>
      !normalizedSearch ||
      [thread.title, thread.team, thread.preview].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      ),
  )

  useEffect(() => {
    if (hasPersistedThreads && selectedThread.unread) {
      void markThreadRead({ threadKey: selectedThread.id, identityKey: identity })
    }
  }, [hasPersistedThreads, identity, markThreadRead, selectedThread.id, selectedThread.unread])

  const selectThread = (threadId: string) => {
    setIsComposerFocused(false)
    setSendError(null)
    setSelectedThreadId(threadId)
    setMobileView('chat')
    if (hasPersistedThreads) void markThreadRead({ threadKey: threadId, identityKey: identity })
  }

  const sendMessage = async (value: string) => {
    const text = value.trim()
    if ((!text && pendingAttachments.length === 0) || !selectedThread.id || isSending) return
    setIsSending(true)
    setSendError(null)
    try {
      const attachments: Array<{
        storageId: Id<'_storage'>
        name: string
        contentType: string
        size: number
      }> = []
      for (const file of pendingAttachments) {
        const contentType = attachmentContentType(file)
        const uploadUrl = await generateAttachmentUploadUrl({
          threadKey: selectedThread.id,
          identityKey: identity,
        })
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': contentType },
          body: file,
        })
        if (!uploadResponse.ok) throw new Error(`${file.name} could not be uploaded.`)
        const uploadResult = (await uploadResponse.json()) as { storageId?: string }
        if (!uploadResult.storageId)
          throw new Error(`${file.name} did not return a storage reference.`)
        attachments.push({
          storageId: uploadResult.storageId as Id<'_storage'>,
          name: file.name,
          contentType,
          size: file.size,
        })
      }
      await sendPersistedMessage({
        threadKey: selectedThread.id,
        identityKey: identity,
        body: text,
        clientNonce: crypto.randomUUID(),
        attachments,
      })
      setDraft('')
      setPendingAttachments([])
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Message could not be sent.')
    } finally {
      setIsSending(false)
    }
  }

  const toggleReaction = async (message: ConversationMessage, emoji: ReactionEmoji) => {
    if (!message.backendId) return
    setSendError(null)
    try {
      await togglePersistedReaction({
        messageId: message.backendId,
        identityKey: identity,
        emoji,
      })
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Reaction could not be updated.')
    }
  }

  const openAsCounterpart = () => {
    if (!selectedThread.counterpartIdentityKey) return
    const url = new URL(window.location.href)
    url.searchParams.set('demoIdentity', selectedThread.counterpartIdentityKey)
    url.searchParams.set('demoThread', selectedThread.id)
    window.open(url.toString(), '_blank', 'noopener,noreferrer')
  }

  const threadList = (
    <VStack gap={4} padding={3}>
      <VStack gap={0.5}>
        <HStack justify="between" align="center">
          <Heading level={2}>Conversations</Heading>
          <Token
            label={`${threads.reduce((sum, thread) => sum + thread.unread, 0)} unread`}
            size="sm"
            color="blue"
          />
        </HStack>
        <Text color="secondary">Partner, finance, and data operations in one place.</Text>
      </VStack>
      <TextInput
        label="Search conversations"
        isLabelHidden
        startIcon={Search}
        placeholder="Search conversations…"
        value={search}
        onChange={setSearch}
        hasClear
        width="100%"
      />
      {visibleThreads.length > 0 ? (
        <List density="compact" hasDividers>
          {visibleThreads.map((thread) => (
            <ListItem
              key={thread.id}
              label={thread.title}
              description={
                <Text
                  type="supporting"
                  color={!isNarrow && selectedThread?.id === thread.id ? 'primary' : 'secondary'}
                  maxLines={1}
                >
                  {thread.preview}
                </Text>
              }
              isSelected={!isNarrow && selectedThread?.id === thread.id}
              onClick={() => selectThread(thread.id)}
              startContent={
                <Avatar
                  name={thread.team}
                  size="md"
                  status={
                    <AvatarStatusDot
                      variant={thread.status === 'online' ? 'success' : 'neutral'}
                      label={thread.status === 'online' ? 'Online' : 'Away'}
                    />
                  }
                />
              }
              endContent={
                <VStack gap={1} align="end">
                  <Text
                    type="supporting"
                    color={!isNarrow && selectedThread?.id === thread.id ? 'primary' : 'secondary'}
                  >
                    {thread.time}
                  </Text>
                  {thread.unread > 0 ? (
                    <Token label={String(thread.unread)} size="sm" color="blue" />
                  ) : null}
                </VStack>
              }
            />
          ))}
        </List>
      ) : (
        <EmptyState
          title={
            persistedThreads === undefined ? 'Loading conversations…' : 'No conversations found'
          }
          description={
            persistedThreads === undefined
              ? 'Connecting to the shared Waverly inbox.'
              : 'Try a different publisher, team, or keyword.'
          }
          icon={<Icon icon={persistedThreads === undefined ? MessageSquareText : Search} />}
          isCompact
        />
      )}
    </VStack>
  )

  const chat = (
    <VStack height="100%" gap={0}>
      {isComposerFocused && draft.trim() && selectedThread.id ? (
        <TypingHeartbeat threadKey={selectedThread.id} identity={identity} />
      ) : null}
      <Toolbar
        label={`Conversation with ${selectedThread.team}`}
        size="sm"
        variant="muted"
        dividers={['bottom']}
        startContent={
          <HStack gap={2} align="center">
            {isNarrow ? (
              <Button
                label="Back"
                icon={<Icon icon={ArrowLeft} />}
                variant="ghost"
                size="sm"
                onClick={() => setMobileView('list')}
              />
            ) : null}
            {!isNarrow ? (
              <Avatar
                name={selectedThread.team}
                size="md"
                status={
                  <AvatarStatusDot
                    variant={selectedThread.status === 'online' ? 'success' : 'neutral'}
                    label={selectedThread.status === 'online' ? 'Online' : 'Away'}
                  />
                }
              />
            ) : null}
            <VStack gap={0.5}>
              <Text weight="semibold">{selectedThread.title}</Text>
              {!isNarrow ? (
                <Text type="supporting" color="secondary">
                  {selectedThread.team}
                </Text>
              ) : null}
            </VStack>
          </HStack>
        }
        endContent={
          <HStack gap={2} align="center">
            {selectedThread.counterpartIdentityKey ? (
              isNarrow ? (
                <IconButton
                  label={`Open as ${demoIdentityLabel(selectedThread.counterpartIdentityKey)}`}
                  icon={<Icon icon={ExternalLink} />}
                  variant="ghost"
                  onClick={openAsCounterpart}
                />
              ) : (
                <Button
                  label={`Open as ${demoIdentityLabel(selectedThread.counterpartIdentityKey)}`}
                  icon={<Icon icon={ExternalLink} />}
                  variant="ghost"
                  size="sm"
                  onClick={openAsCounterpart}
                />
              )
            ) : null}
            {!isNarrow ? (
              <Token
                label={selectedThread.status === 'online' ? 'Available' : 'Replies within a day'}
                size="sm"
                color={selectedThread.status === 'online' ? 'green' : 'gray'}
              />
            ) : null}
          </HStack>
        }
      />
      <ChatLayout
        composer={
          <ChatComposer
            placeholder={`Reply to ${selectedThread.team}…`}
            value={draft}
            onChange={setDraft}
            onSubmit={(value) => void sendMessage(value)}
            isDisabled={isSending || !hasPersistedThreads}
            isSubmitting={isSending}
            attachments={pendingAttachments}
            onAttachmentsChange={setPendingAttachments}
            onFocusChange={setIsComposerFocused}
            accept={attachmentAccept}
            status={sendError ? { type: 'error', message: sendError } : undefined}
            elevation="none"
          />
        }
        emptyState={
          <EmptyState
            title={persistedMessages === undefined ? 'Loading conversation…' : 'No messages yet'}
            description={
              persistedMessages === undefined
                ? 'Connecting to the shared Waverly inbox.'
                : 'Send the first message to start this conversation.'
            }
            icon={<Icon icon={MessageSquareText} />}
            isCompact
          />
        }
      >
        {messages.length > 0 || (typingUsers?.length ?? 0) > 0 ? (
          <ChatMessageList density="balanced" align="top">
            {messages.map((message) => {
              const align = message.sender === 'user' ? 'end' : 'start'

              return (
                <Message
                  key={message.id}
                  align={align}
                  aria-label={`Message from ${message.author} at ${message.time}`}
                >
                  <MessageAvatar>
                    <Avatar name={message.author} size="md" />
                  </MessageAvatar>
                  <MessageContent>
                    <MessageHeader className="font-semibold text-primary">
                      {message.author}
                    </MessageHeader>
                    <Bubble
                      align={align}
                      variant={message.sender === 'user' ? 'tinted' : 'outline'}
                    >
                      <BubbleContent>
                        <div className="space-y-2.5">
                          {message.text ? <div>{message.text}</div> : null}
                          {message.attachments?.length ? (
                            <div className="grid gap-2">
                              {message.attachments.map((attachment) => (
                                <MessageAttachmentCard
                                  key={attachment.id}
                                  attachment={attachment}
                                />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </BubbleContent>
                      {message.reactions?.length ? (
                        <BubbleReactions align={align}>
                          {message.reactions.map((reaction) => (
                            <button
                              key={reaction.emoji}
                              type="button"
                              aria-label={`${reaction.reactedByCurrentUser ? 'Remove' : 'Add'} ${reaction.emoji} reaction`}
                              aria-pressed={reaction.reactedByCurrentUser}
                              className="inline-flex h-6 items-center gap-1 rounded-full px-1.5 text-xs transition-colors hover:bg-background aria-pressed:bg-primary/10 aria-pressed:text-primary"
                              onClick={() => void toggleReaction(message, reaction.emoji)}
                            >
                              <span>{reaction.emoji}</span>
                              <span>{reaction.count}</span>
                            </button>
                          ))}
                        </BubbleReactions>
                      ) : null}
                    </Bubble>
                    <MessageFooter className="gap-1 tabular-nums">
                      <span>{message.time}</span>
                      <ReactionPicker onReact={(emoji) => void toggleReaction(message, emoji)} />
                    </MessageFooter>
                  </MessageContent>
                </Message>
              )
            })}
            {typingUsers?.length ? (
              <TypingIndicator labels={typingUsers.map((user) => user.label)} />
            ) : null}
          </ChatMessageList>
        ) : null}
      </ChatLayout>
    </VStack>
  )

  if (isNarrow) {
    return mobileView === 'list' ? threadList : chat
  }

  return (
    <Layout
      height="fill"
      start={
        <LayoutPanel width={340} padding={0} hasDivider label="Conversations">
          {threadList}
        </LayoutPanel>
      }
      content={<LayoutContent padding={0}>{chat}</LayoutContent>}
    />
  )
}
