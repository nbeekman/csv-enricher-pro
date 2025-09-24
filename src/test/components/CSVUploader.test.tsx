import { CSVUploader } from '@/components/CSVUploader'
import { render } from '@/test/test-utils'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock Papa Parse
vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn()
  }
}))

describe('CSVUploader', () => {
  const mockOnDataParsed = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render upload area', () => {
    render(<CSVUploader onDataParsed={mockOnDataParsed} />)

    expect(screen.getByText(/upload csv file/i)).toBeInTheDocument()
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument()
  })

  it('should handle file selection', async () => {
    const user = userEvent.setup()
    render(<CSVUploader onDataParsed={mockOnDataParsed} />)

    const fileInput = document.getElementById('csv-upload') as HTMLInputElement
    const file = new File(['firstName,lastName\nJohn,Doe'], 'test.csv', { type: 'text/csv' })

    await user.upload(fileInput, file)

    expect(fileInput.files).toHaveLength(1)
    expect(fileInput.files[0]).toBe(file)
  })

  it('should handle drag and drop', async () => {
    // Mock Papa Parse to return valid data
    const { default: Papa } = await import('papaparse')
    vi.mocked(Papa.parse).mockImplementation((file, options) => {
      setTimeout(() => {
        options.complete({
          data: [
            { firstName: 'John', lastName: 'Doe', city: '', state: '', middleName: '', trade: '', licenseNumber: '', status: '' }
          ],
          errors: [],
          meta: { fields: ['firstName', 'lastName'] }
        })
      }, 0)
    })

    render(<CSVUploader onDataParsed={mockOnDataParsed} />)

    const dropZone = screen.getByText(/drag and drop/i).closest('div')
    const file = new File(['firstName,lastName\nJohn,Doe'], 'test.csv', { type: 'text/csv' })

    fireEvent.dragOver(dropZone!)
    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [file]
      }
    })

    // Should trigger file processing
    await waitFor(() => {
      expect(mockOnDataParsed).toHaveBeenCalled()
    })
  })

  it('should show loading state during file processing', async () => {
    const user = userEvent.setup()

    // Mock Papa Parse to delay completion
    const { default: Papa } = await import('papaparse')
    vi.mocked(Papa.parse).mockImplementation((file, options) => {
      // Simulate a delay
      setTimeout(() => {
        options.complete({
          data: [
            { firstName: 'John', lastName: 'Doe', city: 'New York', state: 'NY', middleName: '', trade: '', licenseNumber: '', status: '' }
          ],
          errors: [],
          meta: { fields: ['firstName', 'lastName', 'city', 'state'] }
        })
      }, 500) // 500ms delay
    })

    render(<CSVUploader onDataParsed={mockOnDataParsed} />)

    const fileInput = document.getElementById('csv-upload') as HTMLInputElement
    const file = new File(['firstName,lastName\nJohn,Doe'], 'test.csv', { type: 'text/csv' })

    await user.upload(fileInput, file)

    // Check that the button shows "Processing..." text
    expect(screen.getByText('Processing...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument()
      expect(mockOnDataParsed).toHaveBeenCalled()
    }, { timeout: 1000 })
  })

  it('should handle invalid file types via drag and drop', async () => {
    const user = userEvent.setup()
    render(<CSVUploader onDataParsed={mockOnDataParsed} />)

    const dropZone = screen.getByText(/drag and drop/i).closest('div')
    const file = new File(['not csv content'], 'test.txt', { type: 'text/plain' })

    if (dropZone) {
      fireEvent.dragEnter(dropZone)
      fireEvent.drop(dropZone, { dataTransfer: { files: [file] } })
    }

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/invalid file type/i)).toBeInTheDocument()
    })
  })

  it('should handle empty files', async () => {
    const user = userEvent.setup()

    // Mock Papa Parse to return empty data
    const { default: Papa } = await import('papaparse')
    vi.mocked(Papa.parse).mockImplementation((file, options) => {
      setTimeout(() => {
        options.complete({
          data: [],
          errors: [],
          meta: { fields: [] }
        })
      }, 0)
    })

    render(<CSVUploader onDataParsed={mockOnDataParsed} />)

    const fileInput = document.getElementById('csv-upload') as HTMLInputElement
    const file = new File([''], 'empty.csv', { type: 'text/csv' })

    await user.upload(fileInput, file)

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/no valid data found/i)).toBeInTheDocument()
    })
  })

  it('should handle malformed CSV', async () => {
    const user = userEvent.setup()

    // Mock Papa Parse to trigger error
    const { default: Papa } = await import('papaparse')
    vi.mocked(Papa.parse).mockImplementation((file, options) => {
      setTimeout(() => {
        options.error(new Error('Error parsing CSV'))
      }, 0)
    })

    render(<CSVUploader onDataParsed={mockOnDataParsed} />)

    const fileInput = document.getElementById('csv-upload') as HTMLInputElement
    const file = new File(['malformed,csv,data\nincomplete,row'], 'malformed.csv', { type: 'text/csv' })

    await user.upload(fileInput, file)

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/error reading file/i)).toBeInTheDocument()
    })
  })

  it('should validate required columns', async () => {
    const user = userEvent.setup()

    // Mock Papa Parse to return data without required columns
    const { default: Papa } = await import('papaparse')
    vi.mocked(Papa.parse).mockImplementation((file, options) => {
      setTimeout(() => {
        options.complete({
          data: [
            { name: 'John', age: '30' }
          ],
          errors: [],
          meta: { fields: ['name', 'age'] }
        })
      }, 0)
    })

    render(<CSVUploader onDataParsed={mockOnDataParsed} />)

    const fileInput = document.getElementById('csv-upload') as HTMLInputElement
    const file = new File(['name,age\nJohn,30'], 'missing-columns.csv', { type: 'text/csv' })

    await user.upload(fileInput, file)

    // Should show error message about missing required columns
    await waitFor(() => {
      expect(screen.getByText(/no valid data found/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should successfully parse valid CSV', async () => {
    const user = userEvent.setup()

    // Mock Papa Parse to return valid data
    const { default: Papa } = await import('papaparse')
    vi.mocked(Papa.parse).mockImplementation((file, options) => {
      // Simulate async behavior by calling complete in next tick
      setTimeout(() => {
        options.complete({
          data: [
            { firstName: 'John', lastName: 'Doe', city: 'New York', state: 'NY', middleName: '', trade: '', licenseNumber: '', status: '' },
            { firstName: 'Jane', lastName: 'Smith', city: 'Chicago', state: 'IL', middleName: '', trade: '', licenseNumber: '', status: '' }
          ],
          errors: [],
          meta: { fields: ['firstName', 'lastName', 'city', 'state'] }
        })
      }, 0)
    })

    render(<CSVUploader onDataParsed={mockOnDataParsed} />)

    const fileInput = document.getElementById('csv-upload') as HTMLInputElement
    const file = new File(['firstName,lastName,city,state\nJohn,Doe,New York,NY\nJane,Smith,Chicago,IL'], 'valid.csv', { type: 'text/csv' })

    await user.upload(fileInput, file)

    // Should call onDataParsed with parsed data
    await waitFor(() => {
      expect(mockOnDataParsed).toHaveBeenCalledWith([
        { firstName: 'John', lastName: 'Doe', city: 'New York', state: 'NY', middleName: '', trade: '', licenseNumber: '', status: '' },
        { firstName: 'Jane', lastName: 'Smith', city: 'Chicago', state: 'IL', middleName: '', trade: '', licenseNumber: '', status: '' }
      ])
    })
  })
})
