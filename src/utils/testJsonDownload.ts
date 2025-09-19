/**
 * Test utility to demonstrate the JSON download functionality
 * This simulates the data structure that would be created during enrichment
 */

interface TestDataRecord {
  firstName: string;
  middleName: string;
  lastName: string;
  city: string;
  state: string;
  trade: string;
  licenseNumber: string;
  status: string;
  email?: string;
  phone?: string;
  address?: string;
  enriched?: boolean;
  allApiResponses?: Array<{
    response: any;
    searchType: 'contact' | 'person';
    timestamp: string;
    cost: number;
  }>;
}

/**
 * Creates sample enriched data with raw JSON responses for testing
 */
export function createSampleEnrichedData(): TestDataRecord[] {
  return [
    {
      firstName: "John",
      middleName: "A",
      lastName: "Doe",
      city: "New York",
      state: "NY",
      trade: "Electrician",
      licenseNumber: "EL123456",
      status: "Active",
      email: "john.doe@email.com",
      phone: "(555) 123-4567",
      address: "123 Main St, New York, NY 10001",
      enriched: true,
      rawJsonResponse: {
        requestId: "req-123",
        requestType: "PersonSearch",
        requestTime: "2024-01-15T10:30:00Z",
        isError: false,
        person: {
          name: {
            firstName: "John",
            middleName: "A",
            lastName: "Doe"
          },
          age: "35",
          addresses: [
            {
              firstReportedDate: "2020-01-01",
              lastReportedDate: "2024-01-01",
              street: "123 Main St",
              unit: "",
              city: "New York",
              state: "NY",
              zip: "10001"
            }
          ],
          phones: [
            {
              number: "(555) 123-4567",
              type: "Wireless",
              isConnected: true,
              firstReportedDate: "2020-01-01",
              lastReportedDate: "2024-01-01"
            }
          ],
          emails: [
            {
              address: "john.doe@email.com",
              type: "Personal",
              isConnected: true,
              firstReportedDate: "2020-01-01",
              lastReportedDate: "2024-01-01"
            }
          ]
        },
        message: "Search completed successfully",
        identityScore: 95,
        pagination: {
          currentPageNumber: 1,
          resultsPerPage: 10,
          totalPages: 1,
          totalResults: 1
        },
        databaseQueryInfo: [],
        searchCriteria: [],
        totalRequestExecutionTimeMs: 1500
      }
    },
    {
      firstName: "Jane",
      middleName: "B",
      lastName: "Smith",
      city: "Los Angeles",
      state: "CA",
      trade: "Plumber",
      licenseNumber: "PL789012",
      status: "Active",
      email: "jane.smith@email.com",
      phone: "(555) 987-6543",
      address: "456 Oak Ave, Los Angeles, CA 90210",
      enriched: true,
      rawJsonResponse: {
        requestId: "req-456",
        requestType: "ContactEnrichment",
        requestTime: "2024-01-15T10:35:00Z",
        isError: false,
        person: {
          name: {
            firstName: "Jane",
            middleName: "B",
            lastName: "Smith"
          },
          age: "28",
          addresses: [
            {
              firstReportedDate: "2019-06-01",
              lastReportedDate: "2024-01-01",
              street: "456 Oak Ave",
              unit: "Apt 2B",
              city: "Los Angeles",
              state: "CA",
              zip: "90210"
            }
          ],
          phones: [
            {
              number: "(555) 987-6543",
              type: "Wireless",
              isConnected: true,
              firstReportedDate: "2019-06-01",
              lastReportedDate: "2024-01-01"
            }
          ],
          emails: [
            {
              address: "jane.smith@email.com",
              type: "Personal",
              isConnected: true,
              firstReportedDate: "2019-06-01",
              lastReportedDate: "2024-01-01"
            }
          ]
        },
        message: "Search completed successfully",
        identityScore: 88,
        pagination: {
          currentPageNumber: 1,
          resultsPerPage: 10,
          totalPages: 1,
          totalResults: 1
        },
        databaseQueryInfo: [],
        searchCriteria: [],
        totalRequestExecutionTimeMs: 1200
      }
    }
  ];
}

/**
 * Simulates the JSON download function for testing
 */
export function testJsonDownload(enrichedData: TestDataRecord[]) {
  if (enrichedData.length === 0) {
    console.log("No data to download");
    return;
  }

  // Filter only enriched records that have raw JSON responses
  const recordsWithJson = enrichedData.filter(record => record.enriched && record.rawJsonResponse);
  
  if (recordsWithJson.length === 0) {
    console.log("No JSON data available");
    return;
  }

  // Create a combined JSON structure with metadata
  const combinedJson = {
    exportInfo: {
      exportDate: new Date().toISOString(),
      totalRecords: enrichedData.length,
      enrichedRecords: recordsWithJson.length,
      searchType: "combination",
      totalCost: "0.70" // $0.35 per record for combination search
    },
    records: recordsWithJson.map(record => ({
      originalData: {
        firstName: record.firstName,
        middleName: record.middleName,
        lastName: record.lastName,
        city: record.city,
        state: record.state,
        trade: record.trade,
        licenseNumber: record.licenseNumber,
        status: record.status
      },
      enrichedData: {
        email: record.email,
        phone: record.phone,
        address: record.address,
        searchType: "combination",
        cost: 0.35,
        identityScore: record.rawJsonResponse?.identityScore,
        usedCombination: true
      },
      rawApiResponse: record.rawJsonResponse
    }))
  };

  console.log("=== JSON Download Test ===");
  console.log("Export Info:", combinedJson.exportInfo);
  console.log("Number of records:", combinedJson.records.length);
  console.log("Sample record structure:", JSON.stringify(combinedJson.records[0], null, 2));
  
  return combinedJson;
}

/**
 * Run the test
 */
export function runJsonDownloadTest() {
  const sampleData = createSampleEnrichedData();
  const result = testJsonDownload(sampleData);
  return result;
}
