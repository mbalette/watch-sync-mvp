export interface CastMediaSessionLike {
  play(request: unknown, onSuccess: () => void, onError: (error: unknown) => void): void
  pause?(request: unknown, onSuccess: () => void, onError: (error: unknown) => void): void
}

export interface CastSessionLike {
  getMediaSession(): CastMediaSessionLike | null
}

export async function sendCastSessionPlay(session: CastSessionLike | null, makePlayRequest: () => unknown = () => ({})): Promise<void> {
  const media = session?.getMediaSession()
  if (!media) throw new Error('No active Cast media session. Cast Mode only controls sessions Watch Sync starts or joins.')
  await new Promise<void>((resolve, reject) => {
    media.play(makePlayRequest(), resolve, reject)
  })
}
