import { EnformionService, SearchType } from '@/services/enformionService'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('EnformionService', () => {
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

  describe('constructor', () => {
    it('should create service with valid credentials', () => {
      expect(service).toBeInstanceOf(EnformionService)
    })

    it('should throw error for missing access profile', () => {
      expect(() => {
        new EnformionService({ accessProfile: '', password: 'test123' })
      }).toThrow('Both accessProfile and password are required')
    })

    it('should throw error for missing password', () => {
      expect(() => {
        new EnformionService({ accessProfile: 'test', password: '' })
      }).toThrow('Both accessProfile and password are required')
    })
  })

  describe('setIdentityScoreThreshold', () => {
    it('should set valid threshold', () => {
      service.setIdentityScoreThreshold(90)
      // We can't directly test the private property, but we can test the behavior
      expect(() => service.setIdentityScoreThreshold(90)).not.toThrow()
    })

    it('should throw error for invalid threshold', () => {
      expect(() => service.setIdentityScoreThreshold(-1)).toThrow('Identity score threshold must be between 0 and 100')
      expect(() => service.setIdentityScoreThreshold(101)).toThrow('Identity score threshold must be between 0 and 100')
    })
  })

  describe('searchContact', () => {
    const mockContactData = {
      firstName: 'John',
      middleName: 'A',
      lastName: 'Doe',
      city: 'New York',
      state: 'NY'
    }

    describe('contact search type', () => {
      it('should make contact enrichment API call', async () => {
        const mockResponse = {
          ok: true,
          json: () => Promise.resolve({
            person: {
              name: { firstName: 'John', middleName: 'A', lastName: 'Doe' },
              age: '35',
              addresses: [{
                firstReportedDate: '2020-01-01',
                lastReportedDate: '2024-01-01',
                street: '123 Main St',
                unit: '',
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
            identityScore: 95,
            message: '',
            pagination: { currentPageNumber: 1, resultsPerPage: 1, totalPages: 1, totalResults: 1 }
          })
        }

        mockFetch.mockResolvedValueOnce(mockResponse)

        const result = await service.searchContact(mockContactData, 'contact')

        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(result.searchType).toBe('contact')
        expect(result.cost).toBe(0.10)
        expect(result.usedCombination).toBe(false)
        expect(result.data.person?.name.firstName).toBe('John')
      })

      it('should handle API errors gracefully', async () => {
        const mockErrorResponse = {
          ok: false,
          status: 400,
          text: () => Promise.resolve('Bad Request')
        }

        mockFetch.mockResolvedValueOnce(mockErrorResponse)

        await expect(service.searchContact(mockContactData, 'contact')).rejects.toThrow()
      })
    })

    describe('person search type', () => {
      it('should make person search API call', async () => {
        const mockResponse = {
          ok: true,
          json: () => Promise.resolve({
            person: {
              name: { firstName: 'John', middleName: 'A', lastName: 'Doe' },
              age: 35,
              addresses: [{
                isDeliverable: true,
                isPublic: true,
                houseNumber: '123',
                streetPreDirection: '',
                streetName: 'Main',
                streetPostDirection: '',
                streetType: 'St',
                unit: '',
                unitType: null,
                city: 'New York',
                state: 'NY',
                county: 'New York',
                zip: '10001',
                zip4: '',
                fullAddress: '123 Main St, New York, NY 10001',
                addressOrder: 1,
                firstReportedDate: '1/1/2020',
                lastReportedDate: '8/1/2025'
              }],
              phoneNumbers: [{
                phoneNumber: '(555) 123-4567',
                company: 'Verizon Wireless',
                location: 'NEW YORK-ALL AREAS, NY',
                phoneType: 'Wireless',
                isConnected: true,
                isPublic: true,
                phoneOrder: 1,
                firstReportedDate: '1/1/2020',
                lastReportedDate: '8/1/2025'
              }],
              emailAddresses: [{
                emailAddress: 'john.doe@email.com',
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

        mockFetch.mockResolvedValueOnce(mockResponse)

        const result = await service.searchContact(mockContactData, 'person')

        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(result.searchType).toBe('person')
        expect(result.cost).toBe(0.25)
        expect(result.usedCombination).toBe(false)
        expect(result.data.person?.name.firstName).toBe('John')
      })
    })

    describe('combination search type', () => {
      it('should use only Contact Enrichment when identity score is high and has email data', async () => {
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
                unit: '',
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
            identityScore: 98, // High score
            message: '',
            pagination: { currentPageNumber: 1, resultsPerPage: 1, totalPages: 1, totalResults: 1 }
          })
        }

        mockFetch.mockResolvedValueOnce(mockContactResponse)

        const result = await service.searchContact(mockContactData, 'combination')

        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(result.searchType).toBe('combination')
        expect(result.cost).toBe(0.10)
        expect(result.usedCombination).toBe(false)
        expect(result.allApiResponses).toHaveLength(1)
      })

      it('should use Person Search when identity score is low', async () => {
        const mockContactResponse = {
          ok: true,
          json: () => Promise.resolve({
            person: {
              name: { firstName: 'John', middleName: 'A', lastName: 'Doe' },
              age: '35',
              addresses: [],
              phones: [],
              emails: []
            },
            identityScore: 85, // Low score
            message: '',
            pagination: { currentPageNumber: 1, resultsPerPage: 1, totalPages: 1, totalResults: 0 }
          })
        }

        const mockPersonResponse = {
          ok: true,
          json: () => Promise.resolve({
            person: {
              name: { firstName: 'John', middleName: 'A', lastName: 'Doe' },
              age: 35,
              addresses: [{
                isDeliverable: true,
                isPublic: true,
                houseNumber: '123',
                streetPreDirection: '',
                streetName: 'Main',
                streetPostDirection: '',
                streetType: 'St',
                unit: '',
                unitType: null,
                city: 'New York',
                state: 'NY',
                county: 'New York',
                zip: '10001',
                zip4: '',
                fullAddress: '123 Main St, New York, NY 10001',
                addressOrder: 1,
                firstReportedDate: '1/1/2020',
                lastReportedDate: '8/1/2025'
              }],
              phoneNumbers: [{
                phoneNumber: '(555) 123-4567',
                company: 'Verizon Wireless',
                location: 'NEW YORK-ALL AREAS, NY',
                phoneType: 'Wireless',
                isConnected: true,
                isPublic: true,
                phoneOrder: 1,
                firstReportedDate: '1/1/2020',
                lastReportedDate: '8/1/2025'
              }],
              emailAddresses: [{
                emailAddress: 'john.doe@email.com',
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

        const result = await service.searchContact(mockContactData, 'combination')

        expect(mockFetch).toHaveBeenCalledTimes(2)
        expect(result.searchType).toBe('combination')
        expect(result.cost).toBe(0.35) // $0.10 + $0.25
        expect(result.usedCombination).toBe(true)
        expect(result.allApiResponses).toHaveLength(2)
      })

      it('should use Person Search when no email data is found', async () => {
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
                unit: '',
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
              emails: [] // No email data
            },
            identityScore: 98, // High score but no email
            message: '',
            pagination: { currentPageNumber: 1, resultsPerPage: 1, totalPages: 1, totalResults: 1 }
          })
        }

        const mockPersonResponse = {
          ok: true,
          json: () => Promise.resolve({
            person: {
              name: { firstName: 'John', middleName: 'A', lastName: 'Doe' },
              age: 35,
              addresses: [{
                isDeliverable: true,
                isPublic: true,
                houseNumber: '123',
                streetPreDirection: '',
                streetName: 'Main',
                streetPostDirection: '',
                streetType: 'St',
                unit: '',
                unitType: null,
                city: 'New York',
                state: 'NY',
                county: 'New York',
                zip: '10001',
                zip4: '',
                fullAddress: '123 Main St, New York, NY 10001',
                addressOrder: 1,
                firstReportedDate: '1/1/2020',
                lastReportedDate: '8/1/2025'
              }],
              phoneNumbers: [{
                phoneNumber: '(555) 123-4567',
                company: 'Verizon Wireless',
                location: 'NEW YORK-ALL AREAS, NY',
                phoneType: 'Wireless',
                isConnected: true,
                isPublic: true,
                phoneOrder: 1,
                firstReportedDate: '1/1/2020',
                lastReportedDate: '8/1/2025'
              }],
              emailAddresses: [{
                emailAddress: 'john.doe@email.com',
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

        const result = await service.searchContact(mockContactData, 'combination')

        expect(mockFetch).toHaveBeenCalledTimes(2)
        expect(result.searchType).toBe('combination')
        expect(result.cost).toBe(0.35)
        expect(result.usedCombination).toBe(true)
        expect(result.allApiResponses).toHaveLength(2)
      })

      it('should fallback to Contact Enrichment if Person Search fails', async () => {
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
                unit: '',
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
              emails: []
            },
            identityScore: 85,
            message: '',
            pagination: { currentPageNumber: 1, resultsPerPage: 1, totalPages: 1, totalResults: 0 }
          })
        }

        const mockPersonErrorResponse = {
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal Server Error')
        }

        mockFetch
          .mockResolvedValueOnce(mockContactResponse)
          .mockResolvedValueOnce(mockPersonErrorResponse)

        const result = await service.searchContact(mockContactData, 'combination')

        expect(mockFetch).toHaveBeenCalledTimes(2)
        expect(result.searchType).toBe('combination')
        expect(result.cost).toBe(0.10) // Only Contact Enrichment cost
        expect(result.usedCombination).toBe(false)
        expect(result.allApiResponses).toHaveLength(1)
      })
    })

    it('should throw error for invalid search type', async () => {
      await expect(service.searchContact(mockContactData, 'invalid' as SearchType)).rejects.toThrow('Invalid search type: invalid')
    })
  })
})
