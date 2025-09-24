import { Toaster } from '@/components/ui/toaster'
import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <>
        {children}
        <Toaster />
      </>
    ),
    ...options,
  })
}

export * from '@testing-library/react'
export { customRender as render }

