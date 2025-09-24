import { DataTable } from '@/components/DataTable'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('DataTable', () => {
  const mockData = [
    {
      firstName: 'John',
      middleName: 'A',
      lastName: 'Doe',
      city: 'New York',
      state: 'NY',
      trade: 'ELECTRICIAN',
      licenseNumber: '12345-5505',
      status: 'ACTIVE',
      email: 'john.doe@email.com',
      phone: '(555) 123-4567',
      address: '123 Main St, New York, NY 10001',
      enriched: true,
      cost: 0.10,
      identityScore: 95,
      usedCombination: false,
      allApiResponses: []
    },
    {
      firstName: 'Jane',
      middleName: '',
      lastName: 'Smith',
      city: 'Chicago',
      state: 'IL',
      trade: 'ELECTRICIAN',
      licenseNumber: '67890-5505',
      status: 'ACTIVE',
      email: '',
      phone: '(312) 555-9876',
      address: '456 Oak St, Chicago, IL 60601',
      enriched: true,
      cost: 0.35,
      identityScore: 85,
      usedCombination: true,
      allApiResponses: []
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render data table with headers', () => {
    render(<DataTable data={mockData} title="Test Data" />)

    expect(screen.getByText('First Name')).toBeInTheDocument()
    expect(screen.getByText('Last Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Phone')).toBeInTheDocument()
    expect(screen.getByText('Address')).toBeInTheDocument()
  })

  it('should display data rows', () => {
    render(<DataTable data={mockData} title="Test Data" />)

    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getByText('Doe')).toBeInTheDocument()
    expect(screen.getByText('john.doe@email.com')).toBeInTheDocument()
    expect(screen.getByText('(555) 123-4567')).toBeInTheDocument()
    expect(screen.getByText('123 Main St, New York, NY 10001')).toBeInTheDocument()

    expect(screen.getByText('Jane')).toBeInTheDocument()
    expect(screen.getByText('Smith')).toBeInTheDocument()
    expect(screen.getByText('(312) 555-9876')).toBeInTheDocument()
  })

  it('should show enrichment status indicators', () => {
    render(<DataTable data={mockData} title="Test Data" />)

    // Should show enriched columns
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Phone')).toBeInTheDocument()
    expect(screen.getByText('Address')).toBeInTheDocument()
  })

  it('should handle empty data', () => {
    render(<DataTable data={[]} title="Test Data" />)

    // Should not render anything for empty data
    expect(screen.queryByText('Test Data')).not.toBeInTheDocument()
  })

  it('should show loading state', () => {
    render(<DataTable data={[]} title="Test Data" isLoading={true} />)

    expect(screen.getByText('Test Data')).toBeInTheDocument()
    // Should show loading skeleton rows
    const skeletonRows = screen.getAllByRole('row')
    expect(skeletonRows.length).toBeGreaterThan(0)
  })

  it('should display cost and combination usage information', () => {
    render(<DataTable data={mockData} title="Test Data" />)

    // Should show cost information
    expect(screen.getByText('$0.10')).toBeInTheDocument()
    expect(screen.getByText('$0.35')).toBeInTheDocument()

    // Should show combination usage
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('should show search type badges', () => {
    render(<DataTable data={mockData} title="Test Data" />)

    // Should show search type information
    expect(screen.getByText('Search Type')).toBeInTheDocument()
  })

  it('should show identity scores', () => {
    render(<DataTable data={mockData} title="Test Data" />)

    // Should show identity scores
    expect(screen.getByText('95')).toBeInTheDocument()
    expect(screen.getByText('85')).toBeInTheDocument()
  })

  it('should show API calls count', () => {
    render(<DataTable data={mockData} title="Test Data" />)

    // Should show API calls column
    expect(screen.getByText('API Calls')).toBeInTheDocument()
  })

  it('should show combination column', () => {
    render(<DataTable data={mockData} title="Test Data" />)

    // Should show combination column
    expect(screen.getByText('Combination')).toBeInTheDocument()
  })

  it('should display title and record count', () => {
    render(<DataTable data={mockData} title="Test Data" />)

    expect(screen.getByText('Test Data')).toBeInTheDocument()
    expect(screen.getByText('2 records')).toBeInTheDocument()
  })

  it('should show horizontal scroll indicator for enriched data', () => {
    render(<DataTable data={mockData} title="Test Data" />)

    expect(screen.getByText('← Scroll horizontally →')).toBeInTheDocument()
  })

  it('should handle data without enriched fields', () => {
    const nonEnrichedData = [
      {
        firstName: 'Bob',
        middleName: '',
        lastName: 'Johnson',
        city: 'Seattle',
        state: 'WA',
        trade: 'ELECTRICIAN',
        licenseNumber: '11111-5505',
        status: 'ACTIVE'
      }
    ]

    render(<DataTable data={nonEnrichedData} title="Test Data" />)

    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Johnson')).toBeInTheDocument()
    // Should not show enriched columns
    expect(screen.queryByText('Email')).not.toBeInTheDocument()
  })

  it('should show status badges', () => {
    render(<DataTable data={mockData} title="Test Data" />)

    // Should show status badges
    expect(screen.getAllByText('ACTIVE')).toHaveLength(2)
  })

  it('should handle mixed enriched and non-enriched data', () => {
    const mixedData = [
      ...mockData,
      {
        firstName: 'Alice',
        middleName: '',
        lastName: 'Brown',
        city: 'Boston',
        state: 'MA',
        trade: 'ELECTRICIAN',
        licenseNumber: '22222-5505',
        status: 'ACTIVE'
      }
    ]

    render(<DataTable data={mixedData} title="Test Data" />)

    expect(screen.getByText('Alice')).toBeInTheDocument()
    // Should show enriched columns because some data is enriched
    expect(screen.getByText('Email')).toBeInTheDocument()
  })
})
