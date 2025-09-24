import { extractContactData, mergeContactData } from '@/utils/dataExtractor'
import { describe, expect, it } from 'vitest'

describe('Data Extractor', () => {
  describe('extractContactData', () => {
    it('should extract data from Contact Enrichment API response', () => {
      const contactEnrichmentResponse = {
        person: {
          name: { firstName: "John", middleName: "A", lastName: "Doe" },
          age: "35",
          addresses: [{
            firstReportedDate: "2020-01-01",
            lastReportedDate: "2024-01-01",
            street: "123 Main St",
            unit: "Apt 4B",
            city: "New York",
            state: "NY",
            zip: "10001"
          }],
          phones: [{
            number: "(555) 123-4567",
            type: "mobile",
            isConnected: true,
            firstReportedDate: "2020-01-01",
            lastReportedDate: "2024-01-01"
          }],
          emails: [{
            address: "john.doe@email.com",
            type: "personal",
            isConnected: true,
            firstReportedDate: "2020-01-01",
            lastReportedDate: "2024-01-01"
          }]
        }
      }

      const result = extractContactData(contactEnrichmentResponse, 'contact')

      expect(result).toEqual({
        email: "john.doe@email.com",
        phone: "(555) 123-4567",
        address: "123 Main St Apt 4B, New York, NY 10001"
      })
    })

    it('should extract data from Person Search API response', () => {
      const personSearchResponse = {
        person: {
          name: { firstName: "Jane", middleName: "", lastName: "Smith" },
          age: 28,
          addresses: [{
            isDeliverable: true,
            isPublic: true,
            houseNumber: "456",
            streetPreDirection: "N",
            streetName: "Oak",
            streetPostDirection: "",
            streetType: "St",
            unit: "",
            unitType: null,
            city: "Chicago",
            state: "IL",
            county: "Cook",
            zip: "60601",
            zip4: "1234",
            fullAddress: "456 N Oak St, Chicago, IL 60601-1234",
            addressOrder: 1,
            firstReportedDate: "1/1/2020",
            lastReportedDate: "8/1/2025"
          }],
          phoneNumbers: [{
            phoneNumber: "(312) 555-9876",
            company: "Verizon Wireless",
            location: "ILLINOIS-ALL AREAS, IL",
            phoneType: "Wireless",
            isConnected: true,
            isPublic: true,
            phoneOrder: 1,
            firstReportedDate: "1/1/2020",
            lastReportedDate: "8/1/2025"
          }],
          emailAddresses: [{
            emailAddress: "jane.smith@email.com",
            emailOrdinal: 1,
            isPremium: true,
            nonBusiness: 1,
            sourceSummary: null
          }]
        }
      }

      const result = extractContactData(personSearchResponse, 'person')

      expect(result).toEqual({
        email: "jane.smith@email.com",
        phone: "(312) 555-9876",
        address: "456 N Oak St, Chicago, IL 60601-1234"
      })
    })

    it('should handle empty email arrays in Contact Enrichment response', () => {
      const contactEnrichmentResponse = {
        person: {
          name: { firstName: "Bob", middleName: "", lastName: "Johnson" },
          age: "42",
          addresses: [{
            firstReportedDate: "2020-01-01",
            lastReportedDate: "2024-01-01",
            street: "789 Pine St",
            unit: "",
            city: "Seattle",
            state: "WA",
            zip: "98101"
          }],
          phones: [{
            number: "(206) 555-1234",
            type: "landline",
            isConnected: true,
            firstReportedDate: "2020-01-01",
            lastReportedDate: "2024-01-01"
          }],
          emails: [] // Empty emails array
        }
      }

      const result = extractContactData(contactEnrichmentResponse, 'contact')

      expect(result).toEqual({
        email: "",
        phone: "(206) 555-1234",
        address: "789 Pine St, Seattle, WA 98101"
      })
    })

    it('should prioritize connected emails and phones', () => {
      const contactEnrichmentResponse = {
        person: {
          name: { firstName: "Alice", middleName: "", lastName: "Brown" },
          age: "30",
          addresses: [{
            firstReportedDate: "2020-01-01",
            lastReportedDate: "2024-01-01",
            street: "321 Elm St",
            unit: "",
            city: "Boston",
            state: "MA",
            zip: "02101"
          }],
          phones: [
            {
              number: "(617) 555-0000",
              type: "landline",
              isConnected: false,
              firstReportedDate: "2020-01-01",
              lastReportedDate: "2024-01-01"
            },
            {
              number: "(617) 555-1111",
              type: "mobile",
              isConnected: true,
              firstReportedDate: "2020-01-01",
              lastReportedDate: "2024-01-01"
            }
          ],
          emails: [
            {
              address: "old.email@email.com",
              type: "personal",
              isConnected: false,
              firstReportedDate: "2020-01-01",
              lastReportedDate: "2024-01-01"
            },
            {
              address: "alice.brown@email.com",
              type: "personal",
              isConnected: true,
              firstReportedDate: "2020-01-01",
              lastReportedDate: "2024-01-01"
            }
          ]
        }
      }

      const result = extractContactData(contactEnrichmentResponse, 'contact')

      expect(result).toEqual({
        email: "alice.brown@email.com", // Connected email
        phone: "(617) 555-1111", // Connected phone
        address: "321 Elm St, Boston, MA 02101"
      })
    })

    it('should handle missing person data gracefully', () => {
      const emptyResponse = {}

      const result = extractContactData(emptyResponse, 'contact')

      expect(result).toEqual({
        email: "",
        phone: "",
        address: ""
      })
    })

    it('should handle unknown response structure with fallback', () => {
      const unknownResponse = {
        person: {
          name: { firstName: "Test", lastName: "User" },
          // Missing standard fields but has some data
          emailAddresses: [{ emailAddress: "test@email.com", emailOrdinal: 1, isPremium: false }],
          phoneNumbers: [{ phoneNumber: "(555) 999-8888", isConnected: true, isPublic: true, phoneType: "Wireless", phoneOrder: 1 }],
          addresses: [{ fullAddress: "123 Test St, Test City, TS 12345", addressOrder: 1, isDeliverable: true, isPublic: true }]
        }
      }

      const result = extractContactData(unknownResponse, 'person')

      expect(result).toEqual({
        email: "test@email.com",
        phone: "(555) 999-8888",
        address: "123 Test St, Test City, TS 12345"
      })
    })
  })

  describe('mergeContactData', () => {
    it('should merge data from two sources, prioritizing non-empty values', () => {
      const contactData = {
        email: "",
        phone: "(555) 111-2222",
        address: "123 First St, City, ST 12345"
      }

      const personData = {
        email: "user@email.com",
        phone: "",
        address: "456 Second St, City, ST 12345"
      }

      const result = mergeContactData(contactData, personData)

      expect(result).toEqual({
        email: "user@email.com", // From personData (contactData is empty)
        phone: "(555) 111-2222", // From contactData (personData is empty)
        address: "123 First St, City, ST 12345" // From contactData (both have data, contactData takes precedence)
      })
    })

    it('should handle both sources having the same data', () => {
      const contactData = {
        email: "same@email.com",
        phone: "(555) 111-2222",
        address: "123 Same St, City, ST 12345"
      }

      const personData = {
        email: "same@email.com",
        phone: "(555) 111-2222",
        address: "123 Same St, City, ST 12345"
      }

      const result = mergeContactData(contactData, personData)

      expect(result).toEqual({
        email: "same@email.com",
        phone: "(555) 111-2222",
        address: "123 Same St, City, ST 12345"
      })
    })

    it('should handle both sources being empty', () => {
      const contactData = {
        email: "",
        phone: "",
        address: ""
      }

      const personData = {
        email: "",
        phone: "",
        address: ""
      }

      const result = mergeContactData(contactData, personData)

      expect(result).toEqual({
        email: "",
        phone: "",
        address: ""
      })
    })
  })
})
