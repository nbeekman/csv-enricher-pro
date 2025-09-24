import { EnformionService } from '@/services/enformionService'
import { extractContactData, mergeContactData } from '@/utils/dataExtractor'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Enrichment Workflow Integration Tests', () => {
  let service: EnformionService
  const mockCredentials = {
    accessProfile: 'testProfile',
    password: 'testPassword123'
  }

  beforeEach(() => {
    service = new EnformionService(mockCredentials)
    mockFetch.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Enrichment Workflow', () => {
    const mockContactData = {
      firstName: 'John',
      middleName: 'A',
      lastName: 'Doe',
      city: 'New York',
      state: 'NY'
    }

    it('should complete full workflow with Contact Enrichment only', async () => {
      // Mock successful Contact Enrichment response
      const mockContactResponse = {
        ok: true,
        json: () => Promise.resolve({
          person: {
            name: { firstName: 'John', middleName: 'A', lastName: 'Doe' },
            age: '35',
            addresses: [{
              firstReportedDate: '2020-01-01',
              lastReportedDate: '2024-01-01',
              street: '123 Main St',
              unit: 'Apt 4B',
              city: 'New York',
              state: 'NY',
              zip: '10001'
            }],
            phones: [{
              number: '(555) 123-4567',
              type: 'mobile',
              isConnected: true,
              firstReportedDate: '2020-01-01',
              lastReportedDate: '2024-01-01'
            }],
            emails: [{
              address: 'john.doe@email.com',
              type: 'personal',
              isConnected: true,
              firstReportedDate: '2020-01-01',
              lastReportedDate: '2024-01-01'
            }]
          },
          identityScore: 98,
          message: '',
          pagination: { currentPageNumber: 1, resultsPerPage: 1, totalPages: 1, totalResults: 1 }
        })
      }

      mockFetch.mockResolvedValueOnce(mockContactResponse)

      // Step 1: Search contact
      const searchResult = await service.searchContact(mockContactData, 'combination')

      // Step 2: Extract data
      const extractedData = extractContactData(searchResult.data, searchResult.searchType)

      // Step 3: Verify results
      expect(searchResult.searchType).toBe('combination')
      expect(searchResult.cost).toBe(0.10)
      expect(searchResult.usedCombination).toBe(false)
      expect(extractedData.email).toBe('john.doe@email.com')
      expect(extractedData.phone).toBe('(555) 123-4567')
      expect(extractedData.address).toBe('123 Main St Apt 4B, New York, NY 10001')
    })

    it('should complete full workflow with combination search', async () => {
      // Mock Contact Enrichment response (no email data)
      const mockContactResponse = {
        ok: true,
        json: () => Promise.resolve({
          person: {
            name: { firstName: 'Jane', middleName: '', lastName: 'Smith' },
            age: '28',
            addresses: [{
              firstReportedDate: '2020-01-01',
              lastReportedDate: '2024-01-01',
              street: '456 Oak St',
              unit: '',
              city: 'Chicago',
              state: 'IL',
              zip: '60601'
            }],
            phones: [{
              number: '(312) 555-9876',
              type: 'mobile',
              isConnected: true,
              firstReportedDate: '2020-01-01',
              lastReportedDate: '2024-01-01'
            }],
            emails: [] // No email data
          },
          identityScore: 90,
          message: '',
          pagination: { currentPageNumber: 1, resultsPerPage: 1, totalPages: 1, totalResults: 0 }
        })
      }

      // Mock Person Search response (with email data)
      const mockPersonResponse = {
        ok: true,
        json: () => Promise.resolve({
          person: {
            name: { firstName: 'Jane', middleName: '', lastName: 'Smith' },
            age: 28,
            addresses: [{
              isDeliverable: true,
              isPublic: true,
              houseNumber: '456',
              streetPreDirection: '',
              streetName: 'Oak',
              streetPostDirection: '',
              streetType: 'St',
              unit: '',
              unitType: null,
              city: 'Chicago',
              state: 'IL',
              county: 'Cook',
              zip: '60601',
              zip4: '1234',
              fullAddress: '456 Oak St, Chicago, IL 60601-1234',
              addressOrder: 1,
              firstReportedDate: '1/1/2020',
              lastReportedDate: '8/1/2025'
            }],
            phoneNumbers: [{
              phoneNumber: '(312) 555-9876',
              company: 'Verizon Wireless',
              location: 'ILLINOIS-ALL AREAS, IL',
              phoneType: 'Wireless',
              isConnected: true,
              isPublic: true,
              phoneOrder: 1,
              firstReportedDate: '1/1/2020',
              lastReportedDate: '8/1/2025'
            }],
            emailAddresses: [{
              emailAddress: 'jane.smith@email.com',
              emailOrdinal: 1,
              isPremium: true,
              nonBusiness: 1,
              sourceSummary: null
            }]
          },
          identityScore: 95,
          message: '',
          pagination: { currentPageNumber: 1, resultsPerPage: 1, totalPages: 1, totalResults: 1 }
        })
      }

      mockFetch
        .mockResolvedValueOnce(mockContactResponse)
        .mockResolvedValueOnce(mockPersonResponse)

      // Step 1: Search contact
      const searchResult = await service.searchContact(mockContactData, 'combination')

      // Step 2: Extract data from both sources
      const contactData = extractContactData(searchResult.allApiResponses[0].response, 'contact')
      const personData = extractContactData(searchResult.allApiResponses[1].response, 'person')

      // Step 3: Merge data
      const mergedData = mergeContactData(contactData, personData)

      // Step 4: Verify results
      expect(searchResult.searchType).toBe('combination')
      expect(searchResult.cost).toBe(0.35)
      expect(searchResult.usedCombination).toBe(true)
      expect(searchResult.allApiResponses).toHaveLength(2)

      // Verify individual extractions
      expect(contactData.email).toBe('') // No email from Contact Enrichment
      expect(contactData.phone).toBe('(312) 555-9876')
      expect(contactData.address).toBe('456 Oak St, Chicago, IL 60601')

      expect(personData.email).toBe('jane.smith@email.com') // Email from Person Search
      expect(personData.phone).toBe('(312) 555-9876')
      expect(personData.address).toBe('456 Oak St, Chicago, IL 60601-1234')

      // Verify merged data
      expect(mergedData.email).toBe('jane.smith@email.com') // From Person Search
      expect(mergedData.phone).toBe('(312) 555-9876') // From either source
      expect(mergedData.address).toBe('456 Oak St, Chicago, IL 60601') // From Contact Enrichment (first)
    })

    it('should handle workflow with Person Search only', async () => {
      // Mock Person Search response
      const mockPersonResponse = {
        ok: true,
        json: () => Promise.resolve({
          person: {
            name: { firstName: 'Bob', middleName: '', lastName: 'Johnson' },
            age: 42,
            addresses: [{
              isDeliverable: true,
              isPublic: true,
              houseNumber: '789',
              streetPreDirection: '',
              streetName: 'Pine',
              streetPostDirection: '',
              streetType: 'St',
              unit: '',
              unitType: null,
              city: 'Seattle',
              state: 'WA',
              county: 'King',
              zip: '98101',
              zip4: '',
              fullAddress: '789 Pine St, Seattle, WA 98101',
              addressOrder: 1,
              firstReportedDate: '1/1/2020',
              lastReportedDate: '8/1/2025'
            }],
            phoneNumbers: [{
              phoneNumber: '(206) 555-1234',
              company: 'T-Mobile',
              location: 'WASHINGTON-ALL AREAS, WA',
              phoneType: 'Wireless',
              isConnected: true,
              isPublic: true,
              phoneOrder: 1,
              firstReportedDate: '1/1/2020',
              lastReportedDate: '8/1/2025'
            }],
            emailAddresses: [{
              emailAddress: 'bob.johnson@email.com',
              emailOrdinal: 1,
              isPremium: true,
              nonBusiness: 1,
              sourceSummary: null
            }]
          },
          identityScore: 95,
          message: '',
          pagination: { currentPageNumber: 1, resultsPerPage: 1, totalPages: 1, totalResults: 1 }
        })
      }

      mockFetch.mockResolvedValueOnce(mockPersonResponse)

      // Step 1: Search contact
      const searchResult = await service.searchContact(mockContactData, 'person')

      // Step 2: Extract data
      const extractedData = extractContactData(searchResult.data, searchResult.searchType)

      // Step 3: Verify results
      expect(searchResult.searchType).toBe('person')
      expect(searchResult.cost).toBe(0.25)
      expect(searchResult.usedCombination).toBe(false)
      expect(extractedData.email).toBe('bob.johnson@email.com')
      expect(extractedData.phone).toBe('(206) 555-1234')
      expect(extractedData.address).toBe('789 Pine St, Seattle, WA 98101')
    })
  })

  describe('Error Handling Workflow', () => {
    const mockContactData = {
      firstName: 'Error',
      middleName: '',
      lastName: 'Test',
      city: 'Error City',
      state: 'ER'
    }

    it('should handle API errors gracefully', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error')
      }

      mockFetch.mockResolvedValueOnce(mockErrorResponse)

      await expect(service.searchContact(mockContactData, 'contact')).rejects.toThrow()
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(service.searchContact(mockContactData, 'contact')).rejects.toThrow('Network error')
    })

    it('should handle malformed API responses', async () => {
      const mockMalformedResponse = {
        ok: true,
        json: () => Promise.resolve({
          // Missing required fields
          message: 'Success',
          identityScore: 95
        })
      }

      mockFetch.mockResolvedValueOnce(mockMalformedResponse)

      const searchResult = await service.searchContact(mockContactData, 'contact')
      const extractedData = extractContactData(searchResult.data, searchResult.searchType)

      // Should handle gracefully with empty data
      expect(extractedData.email).toBe('')
      expect(extractedData.phone).toBe('')
      expect(extractedData.address).toBe('')
    })
  })

  describe('Data Quality Workflow', () => {
    it('should prioritize better quality data in combination search', async () => {
      // Mock Contact Enrichment with basic data
      const mockContactResponse = {
        ok: true,
        json: () => Promise.resolve({
          person: {
            name: { firstName: 'Quality', middleName: '', lastName: 'Test' },
            age: '30',
            addresses: [{
              firstReportedDate: '2020-01-01',
              lastReportedDate: '2024-01-01',
              street: '123 Basic St',
              unit: '',
              city: 'Basic City',
              state: 'BC',
              zip: '12345'
            }],
            phones: [{
              number: '(555) 000-0000',
              type: 'landline',
              isConnected: false, // Not connected
              firstReportedDate: '2020-01-01',
              lastReportedDate: '2024-01-01'
            }],
            emails: [] // No email
          },
          identityScore: 85,
          message: '',
          pagination: { currentPageNumber: 1, resultsPerPage: 1, totalPages: 1, totalResults: 0 }
        })
      }

      // Mock Person Search with better quality data
      const mockPersonResponse = {
        ok: true,
        json: () => Promise.resolve({
          person: {
            name: { firstName: 'Quality', middleName: '', lastName: 'Test' },
            age: 30,
            addresses: [{
              isDeliverable: true,
              isPublic: true,
              houseNumber: '456',
              streetPreDirection: '',
              streetName: 'Premium',
              streetPostDirection: '',
              streetType: 'Ave',
              unit: '',
              unitType: null,
              city: 'Premium City',
              state: 'PC',
              county: 'Premium County',
              zip: '54321',
              zip4: '1234',
              fullAddress: '456 Premium Ave, Premium City, PC 54321-1234',
              addressOrder: 1,
              firstReportedDate: '1/1/2020',
              lastReportedDate: '8/1/2025'
            }],
            phoneNumbers: [{
              phoneNumber: '(555) 999-9999',
              company: 'Premium Wireless',
              location: 'PREMIUM-ALL AREAS, PC',
              phoneType: 'Wireless',
              isConnected: true, // Connected
              isPublic: true,
              phoneOrder: 1,
              firstReportedDate: '1/1/2020',
              lastReportedDate: '8/1/2025'
            }],
            emailAddresses: [{
              emailAddress: 'quality.test@premium.com',
              emailOrdinal: 1,
              isPremium: true,
              nonBusiness: 1,
              sourceSummary: null
            }]
          },
          identityScore: 95,
          message: '',
          pagination: { currentPageNumber: 1, resultsPerPage: 1, totalPages: 1, totalResults: 1 }
        })
      }

      mockFetch
        .mockResolvedValueOnce(mockContactResponse)
        .mockResolvedValueOnce(mockPersonResponse)

      const searchResult = await service.searchContact({
        firstName: 'Quality',
        middleName: '',
        lastName: 'Test',
        city: 'Basic City',
        state: 'BC'
      }, 'combination')
      const contactData = extractContactData(searchResult.allApiResponses[0].response, 'contact')
      const personData = extractContactData(searchResult.allApiResponses[1].response, 'person')
      const mergedData = mergeContactData(contactData, personData)

      // Verify that better quality data is prioritized
      expect(mergedData.email).toBe('quality.test@premium.com') // From Person Search
      expect(mergedData.phone).toBe('(555) 999-9999') // Connected phone from Person Search
      expect(mergedData.address).toBe('123 Basic St, Basic City, BC 12345') // From Contact Enrichment (first)
    })
  })
})
