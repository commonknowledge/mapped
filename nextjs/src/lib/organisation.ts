import { atomWithStorage } from 'jotai/utils'
import Cookies from 'js-cookie'

export const currentOrganisationIdAtom = atomWithStorage<string>(
  'mappedOrganisationId',
  '',
  {
    getItem: () => (Cookies.get('mappedOrganisationId') as string) || '',
    setItem: (ctx, value) => Cookies.set(ctx, value || ''),
    removeItem: (ctx) => Cookies.remove(ctx),
    subscribe:
      typeof window !== 'undefined' && 'cookieStore' in window
        ? (key, callback, initialValue) => {
            const storageEventCallback = (e: any) => {
              const { changed, deleted, type } = e

              if (type === 'change') {
                const { value: newTokenCookieValue } =
                  changed.find((i: any) => i.name === key) ?? {}

                if (newTokenCookieValue) {
                  //@ts-ignore
                  callback(Cookies.converter.read(newTokenCookieValue))
                }
              }

              if (type === 'delete') {
                const isTokenCookieDeleted = deleted.find(
                  (i: any) => i.name === key
                )
                if (isTokenCookieDeleted) callback(initialValue)
              }
            }

            //@ts-ignore
            window.cookieStore.addEventListener('change', storageEventCallback)
            return () => {
              //@ts-ignore
              window.cookieStore.removeEventListener(
                'change',
                storageEventCallback
              )
            }
          }
        : undefined,
  }
)
