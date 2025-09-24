import { EnrichmentControls } from '@/components/EnrichmentControls'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('EnrichmentControls', () => {
  const mockData = [
    {
      firstName: 'John',
      middleName: 'A',
      lastName: 'Doe',
      city: 'New York',
      state: 'NY',
      trade: 'ELECTRICIAN',
      licenseNumber: '12345-5505',
      status: 'ACTIVE'
    }
  ]

  const mockEnrichedData = [
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
    }
  ]

  const defaultProps = {
    data: mockData,
    enrichedData: [],
    onEnrichmentStart: vi.fn(),
    onEnrichmentStop: vi.fn(),
    isEnriching: false,
    progress: 0
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render enrichment controls', () => {
    render(<EnrichmentControls {...defaultProps} />)

    expect(screen.getByText(/enrichment controls/i)).toBeInTheDocument()
    expect(screen.getByText(/search type/i)).toBeInTheDocument()
    expect(screen.getByText(/start enrichment/i)).toBeInTheDocument()
  })

  it('should show search type options', () => {
    render(<EnrichmentControls {...defaultProps} />)

    expect(screen.getAllByText(/contact enrichment/i)).toHaveLength(3) // One in label, one in description, one in combination description
    expect(screen.getAllByText(/person search/i)).toHaveLength(4)
    expect(screen.getByText(/smart combination/i)).toBeInTheDocument()
  })

  it('should handle API key input', async () => {
    const user = userEvent.setup()
    render(<EnrichmentControls {...defaultProps} />)

    const apiKeyInput = screen.getByLabelText(/api key/i)
    await user.type(apiKeyInput, 'testProfile:testPassword')

    expect(apiKeyInput).toHaveValue('testProfile:testPassword')
  })

  it('should call onEnrichmentStart with correct parameters', async () => {
    const user = userEvent.setup()
    render(<EnrichmentControls {...defaultProps} />)

    const apiKeyInput = screen.getByLabelText(/api key/i)
    const startButton = screen.getByText(/start enrichment/i)

    await user.type(apiKeyInput, 'testProfile:testPassword')
    await user.click(startButton)

    expect(defaultProps.onEnrichmentStart).toHaveBeenCalledWith('testProfile:testPassword', 'contact')
  })

  it('should handle search type selection', async () => {
    const user = userEvent.setup()
    render(<EnrichmentControls {...defaultProps} />)

    const combinationRadio = screen.getByLabelText(/smart combination/i)
    await user.click(combinationRadio)

    const apiKeyInput = screen.getByLabelText(/api key/i)
    const startButton = screen.getByText(/start enrichment/i)

    await user.type(apiKeyInput, 'testProfile:testPassword')
    await user.click(startButton)

    expect(defaultProps.onEnrichmentStart).toHaveBeenCalledWith('testProfile:testPassword', 'combination')
  })

  it('should show progress bar when enriching', () => {
    render(<EnrichmentControls {...defaultProps} isEnriching={true} progress={50} />)

    expect(screen.getByText(/50%/)).toBeInTheDocument()
    expect(screen.getByText(/enriching contacts/i)).toBeInTheDocument()
  })

  it('should show stop button when enriching', () => {
    render(<EnrichmentControls {...defaultProps} isEnriching={true} />)

    expect(screen.getByText(/stop/i)).toBeInTheDocument()
  })

  it('should call onEnrichmentStop when stop button is clicked', async () => {
    const user = userEvent.setup()
    render(<EnrichmentControls {...defaultProps} isEnriching={true} />)

    const stopButton = screen.getByText(/stop/i)
    await user.click(stopButton)

    expect(defaultProps.onEnrichmentStop).toHaveBeenCalled()
  })

  it('should show download buttons when enriched data is available', () => {
    render(<EnrichmentControls {...defaultProps} enrichedData={mockEnrichedData} />)

    expect(screen.getByText(/download csv/i)).toBeInTheDocument()
    expect(screen.getByText(/download json/i)).toBeInTheDocument()
  })

  it('should disable start button when no data is available', () => {
    render(<EnrichmentControls {...defaultProps} data={[]} />)

    const startButton = screen.getByRole('button', { name: /start enrichment/i })
    expect(startButton).toBeDisabled()
  })

  it('should show stop button when enriching', () => {
    render(<EnrichmentControls {...defaultProps} isEnriching={true} data={mockData} />)
    const stopButton = screen.getByRole('button', { name: /stop/i })
    expect(stopButton).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /start enrichment/i })).not.toBeInTheDocument()
  })

  it('should show enrichment status', () => {
    render(<EnrichmentControls {...defaultProps} isEnriching={true} progress={75} />)

    expect(screen.getByText(/enriching contacts/i)).toBeInTheDocument()
    expect(screen.getByText(/75%/)).toBeInTheDocument()
  })

  it('should show help text for API key format', () => {
    render(<EnrichmentControls {...defaultProps} />)

    expect(screen.getByText(/profileName:password/i)).toBeInTheDocument()
  })

  it('should show search type descriptions', () => {
    render(<EnrichmentControls {...defaultProps} />)

    expect(screen.getAllByText(/contact enrichment/i)).toHaveLength(3)
    expect(screen.getAllByText(/person search/i)).toHaveLength(4)
    expect(screen.getByText(/smart combination/i)).toBeInTheDocument()
  })

  it('should show estimated cost', () => {
    render(<EnrichmentControls {...defaultProps} data={mockData} />)

    expect(screen.getByText(/estimated cost/i)).toBeInTheDocument()
    expect(screen.getAllByText(/\$0\.10/)).toHaveLength(4) // Multiple instances of $0.10
  })

  it('should show record count', () => {
    render(<EnrichmentControls {...defaultProps} />)

    expect(screen.getByText(/1 records loaded/i)).toBeInTheDocument()
  })

  it('should show enriched count when data is enriched', () => {
    render(<EnrichmentControls {...defaultProps} enrichedData={mockEnrichedData} />)

    expect(screen.getByText(/1 enriched/i)).toBeInTheDocument()
  })

  it('should show reset button when enriched data is available', () => {
    render(<EnrichmentControls {...defaultProps} enrichedData={mockEnrichedData} />)

    expect(screen.getByText(/reset/i)).toBeInTheDocument()
  })

  it('should handle API key visibility toggle', async () => {
    const user = userEvent.setup()
    render(<EnrichmentControls {...defaultProps} />)

    const showButton = screen.getByText(/show/i)
    await user.click(showButton)

    expect(screen.getByText(/hide/i)).toBeInTheDocument()
  })

  it('should show cost information for different search types', async () => {
    const user = userEvent.setup()
    render(<EnrichmentControls {...defaultProps} />)

    // Test person search cost
    const personRadio = screen.getByLabelText(/person search/i)
    await user.click(personRadio)

    expect(screen.getAllByText(/\$0\.25/)).toHaveLength(3)

    // Test combination search cost range
    const combinationRadio = screen.getByLabelText(/smart combination/i)
    await user.click(combinationRadio)

    expect(screen.getAllByText(/\$0\.10-\$0\.35/)).toHaveLength(2)
  })
})
