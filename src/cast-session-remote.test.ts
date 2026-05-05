import { describe, expect, it, vi } from 'vitest'
import { sendCastSessionPlay, type CastSessionLike } from './cast-session-remote'

describe('Cast session remote adapter', () => {
  it('plays only an active Cast media session', async () => {
    const play = vi.fn((_request: unknown, onSuccess: () => void) => onSuccess())
    const session: CastSessionLike = { getMediaSession: () => ({ play }) }

    await sendCastSessionPlay(session, () => ({ type: 'PlayRequest' }))

    expect(play).toHaveBeenCalledWith({ type: 'PlayRequest' }, expect.any(Function), expect.any(Function))
  })

  it('fails safely when Watch Sync has no Cast session', async () => {
    await expect(sendCastSessionPlay(null)).rejects.toThrow(/No active Cast media session/)
  })
})
