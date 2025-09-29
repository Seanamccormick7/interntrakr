import type { PropsWithChildren } from 'react'

export function Container({ children }: PropsWithChildren) {
  return (
    <main
      style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '2rem 1rem',
      }}
    >
      {children}
    </main>
  )
}
