import Index from '@/pages/Index'
import { render } from '@/test/test-utils'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the EnformionService
vi.mock('@/services/enformionService', () => ({
  EnformionService: vi.fn().mockImplementation(() => ({
    searchContact: vi.fn()
  }))
}))

// Mock Papa Parse
vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn(),
    unparse: vi.fn((data) => 'mocked,csv,data\n' + data.map(row => Object.values(row).join(',')).join('\n'))
  }
}))

describe('Simple E2E Workflow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should upload CSV file and display data', async () => {
    const user = userEvent.setup()

    // Mock Papa Parse
    const { default: PapaParse } = await import('papaparse')
    vi.mocked(PapaParse.parse).mockImplementation((file, options) => {
      setTimeout(() => {
        options.complete({
          data: [
            { 'first name': 'John', 'last name': 'Doe', 'city': 'New York', 'state': 'NY', 'middle name': '', 'trade': '', 'license #': '', 'status': '' }
          ],
          errors: [],
          meta: { fields: ['first name', 'last name', 'city', 'state'] }
        })
      }, 0)
    })

    render(<Index />)

    // Step 1: Upload CSV file
    const fileInput = document.getElementById('csv-upload') as HTMLInputElement
    const file = new File(['firstName,lastName,city,state\nJohn,Doe,New York,NY'], 'test.csv', { type: 'text/csv' })

    await user.upload(fileInput, file)

    // Wait for data to be parsed and displayed
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument()
    })

    // Verify the data is displayed in the original data table
    expect(screen.getByText('Doe')).toBeInTheDocument()
    expect(screen.getByText('New York')).toBeInTheDocument()
    expect(screen.getByText('NY')).toBeInTheDocument()
  })

  it('should show enrichment controls when data is loaded', async () => {
    const user = userEvent.setup()

    // Mock Papa Parse
    const { default: PapaParse } = await import('papaparse')
    vi.mocked(PapaParse.parse).mockImplementation((file, options) => {
      setTimeout(() => {
        options.complete({
          data: [
            { 'first name': 'Jane', 'last name': 'Smith', 'city': 'Chicago', 'state': 'IL', 'middle name': '', 'trade': '', 'license #': '', 'status': '' }
          ],
          errors: [],
          meta: { fields: ['first name', 'last name', 'city', 'state'] }
        })
      }, 0)
    })

    render(<Index />)

    // Step 1: Upload CSV file
    const fileInput = document.getElementById('csv-upload') as HTMLInputElement
    const file = new File(['firstName,lastName,city,state\nJane,Smith,Chicago,IL'], 'test.csv', { type: 'text/csv' })

    await user.upload(fileInput, file)

    // Wait for data to be parsed
    await waitFor(() => {
      expect(screen.getByText('Jane')).toBeInTheDocument()
    })

    // Verify enrichment controls are visible
    expect(screen.getByText(/enrichment controls/i)).toBeInTheDocument()
    expect(screen.getByText(/api key/i)).toBeInTheDocument()
    expect(screen.getByText(/start enrichment/i)).toBeInTheDocument()
  })

  it('should handle API key input', async () => {
    const user = userEvent.setup()

    // Mock Papa Parse
    const { default: PapaParse } = await import('papaparse')
    vi.mocked(PapaParse.parse).mockImplementation((file, options) => {
      setTimeout(() => {
        options.complete({
          data: [
            { 'first name': 'Test', 'last name': 'User', 'city': 'Test City', 'state': 'TC', 'middle name': '', 'trade': '', 'license #': '', 'status': '' }
          ],
          errors: [],
          meta: { fields: ['first name', 'last name', 'city', 'state'] }
        })
      }, 0)
    })

    render(<Index />)

    // Step 1: Upload CSV file
    const fileInput = document.getElementById('csv-upload') as HTMLInputElement
    const file = new File(['firstName,lastName,city,state\nTest,User,Test City,TC'], 'test.csv', { type: 'text/csv' })

    await user.upload(fileInput, file)

    // Wait for data to be parsed
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument()
    })

    // Step 2: Enter API key
    const apiKeyInput = screen.getByLabelText(/api key/i)
    await user.type(apiKeyInput, 'testProfile:testPassword')

    // Verify API key was entered
    expect(apiKeyInput).toHaveValue('testProfile:testPassword')
  })

  it('should show search type options', async () => {
    const user = userEvent.setup()

    // Mock Papa Parse
    const { default: PapaParse } = await import('papaparse')
    vi.mocked(PapaParse.parse).mockImplementation((file, options) => {
      setTimeout(() => {
        options.complete({
          data: [
            { 'first name': 'Search', 'last name': 'Test', 'city': 'Search City', 'state': 'SC', 'middle name': '', 'trade': '', 'license #': '', 'status': '' }
          ],
          errors: [],
          meta: { fields: ['first name', 'last name', 'city', 'state'] }
        })
      }, 0)
    })

    render(<Index />)

    // Step 1: Upload CSV file
    const fileInput = document.getElementById('csv-upload') as HTMLInputElement
    const file = new File(['firstName,lastName,city,state\nSearch,Test,Search City,SC'], 'test.csv', { type: 'text/csv' })

    await user.upload(fileInput, file)

    // Wait for data to be parsed
    await waitFor(() => {
      expect(screen.getByText('Search')).toBeInTheDocument()
    })

    // Verify search type options are visible
    expect(screen.getAllByText(/contact enrichment/i)).toHaveLength(4)
    expect(screen.getAllByText(/person search/i)).toHaveLength(4)
    expect(screen.getByText(/smart combination/i)).toBeInTheDocument()
  })
})
