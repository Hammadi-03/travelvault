import '@testing-library/jest-dom'

// Silence React act() warnings in test output
const originalError = console.error
beforeEach(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('act(') || args[0].includes('not wrapped in act'))
    ) {
      return
    }
    originalError(...args)
  }
})

afterEach(() => {
  console.error = originalError
})
