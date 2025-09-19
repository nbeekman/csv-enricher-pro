/**
 * Enhanced test utility to demonstrate the improved JSON download functionality
 * This shows how the system now handles multiple API calls per record
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
 * Creates sample enriched data with multiple API responses for testing
 * This simulates combination searches that make multiple API calls
 */
export function createSampleEnrichedDataWithMultipleResponses(): TestDataRecord[] {
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
      allApiResponses: [
        {
          response: {
            requestId: "req-contact-123",
            requestType: "ContactEnrichment",
            requestTime: "2024-01-15T10:30:00Z",
            isError: false,
            person: {
              name: { firstName: "John", middleName: "A", lastName: "Doe" },
              age: "35",
              addresses: [{
                firstReportedDate: "2020-01-01",
                lastReportedDate: "2024-01-01",
                street: "123 Main St",
                unit: "",
                city: "New York",
                state: "NY",
                zip: "10001"
              }],
              phones: [{
                number: "(555) 123-4567",
                type: "Wireless",
                isConnected: true,
                firstReportedDate: "2020-01-01",
                lastReportedDate: "2024-01-01"
              }],
              emails: [{
                address: "john.doe@email.com",
                type: "Personal",
                isConnected: true,
                firstReportedDate: "2020-01-01",
                lastReportedDate: "2024-01-01"
              }]
            },
            message: "Contact enrichment completed",
            identityScore: 85, // Below 100, so Person Search was triggered
            pagination: { currentPageNumber: 1, resultsPerPage: 10, totalPages: 1, totalResults: 1 },
            databaseQueryInfo: [],
            searchCriteria: [],
            totalRequestExecutionTimeMs: 1200
          },
          searchType: 'contact',
          timestamp: "2024-01-15T10:30:00Z",
          cost: 0.10
        },
        {
          response: {
            requestId: "req-person-123",
            requestType: "PersonSearch",
            requestTime: "2024-01-15T10:30:02Z",
            isError: false,
            person: {
              name: { firstName: "John", middleName: "A", lastName: "Doe" },
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
                },
                {
                  firstReportedDate: "2018-06-01",
                  lastReportedDate: "2019-12-01",
                  street: "456 Old Ave",
                  unit: "Apt 2B",
                  city: "Brooklyn",
                  state: "NY",
                  zip: "11201"
                }
              ],
              phones: [
                {
                  number: "(555) 123-4567",
                  type: "Wireless",
                  isConnected: true,
                  firstReportedDate: "2020-01-01",
                  lastReportedDate: "2024-01-01"
                },
                {
                  number: "(555) 987-6543",
                  type: "LandLine",
                  isConnected: false,
                  firstReportedDate: "2018-06-01",
                  lastReportedDate: "2019-12-01"
                }
              ],
              emails: [
                {
                  address: "john.doe@email.com",
                  type: "Personal",
                  isConnected: true,
                  firstReportedDate: "2020-01-01",
                  lastReportedDate: "2024-01-01"
                },
                {
                  address: "j.doe@oldcompany.com",
                  type: "Work",
                  isConnected: false,
                  firstReportedDate: "2018-06-01",
                  lastReportedDate: "2019-12-01"
                }
              ]
            },
            message: "Person search completed successfully",
            identityScore: 95,
            pagination: { currentPageNumber: 1, resultsPerPage: 10, totalPages: 1, totalResults: 1 },
            databaseQueryInfo: [],
            searchCriteria: [],
            totalRequestExecutionTimeMs: 1800
          },
          searchType: 'person',
          timestamp: "2024-01-15T10:30:02Z",
          cost: 0.25
        }
      ]
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
      allApiResponses: [
        {
          response: {
            requestId: "req-contact-456",
            requestType: "ContactEnrichment",
            requestTime: "2024-01-15T10:35:00Z",
            isError: false,
            person: {
              name: { firstName: "Jane", middleName: "B", lastName: "Smith" },
              age: "28",
              addresses: [{
                firstReportedDate: "2019-06-01",
                lastReportedDate: "2024-01-01",
                street: "456 Oak Ave",
                unit: "Apt 2B",
                city: "Los Angeles",
                state: "CA",
                zip: "90210"
              }],
              phones: [{
                number: "(555) 987-6543",
                type: "Wireless",
                isConnected: true,
                firstReportedDate: "2019-06-01",
                lastReportedDate: "2024-01-01"
              }],
              emails: [{
                address: "jane.smith@email.com",
                type: "Personal",
                isConnected: true,
                firstReportedDate: "2019-06-01",
                lastReportedDate: "2024-01-01"
              }]
            },
            message: "Contact enrichment completed",
            identityScore: 100, // Perfect score, so no Person Search needed
            pagination: { currentPageNumber: 1, resultsPerPage: 10, totalPages: 1, totalResults: 1 },
            databaseQueryInfo: [],
            searchCriteria: [],
            totalRequestExecutionTimeMs: 900
          },
          searchType: 'contact',
          timestamp: "2024-01-15T10:35:00Z",
          cost: 0.10
        }
      ]
    },
    {
      firstName: "Bob",
      middleName: "C",
      lastName: "Johnson",
      city: "Chicago",
      state: "IL",
      trade: "HVAC",
      licenseNumber: "HV345678",
      status: "Active",
      email: "bob.johnson@email.com",
      phone: "(555) 456-7890",
      address: "789 Pine St, Chicago, IL 60601",
      enriched: true,
      allApiResponses: [
        {
          response: {
            requestId: "req-person-789",
            requestType: "PersonSearch",
            requestTime: "2024-01-15T10:40:00Z",
            isError: false,
            person: {
              name: { firstName: "Bob", middleName: "C", lastName: "Johnson" },
              age: "42",
              addresses: [{
                firstReportedDate: "2015-03-01",
                lastReportedDate: "2024-01-01",
                street: "789 Pine St",
                unit: "",
                city: "Chicago",
                state: "IL",
                zip: "60601"
              }],
              phones: [{
                number: "(555) 456-7890",
                type: "Wireless",
                isConnected: true,
                firstReportedDate: "2015-03-01",
                lastReportedDate: "2024-01-01"
              }],
              emails: [{
                address: "bob.johnson@email.com",
                type: "Personal",
                isConnected: true,
                firstReportedDate: "2015-03-01",
                lastReportedDate: "2024-01-01"
              }]
            },
            message: "Person search completed successfully",
            identityScore: 92,
            pagination: { currentPageNumber: 1, resultsPerPage: 10, totalPages: 1, totalResults: 1 },
            databaseQueryInfo: [],
            searchCriteria: [],
            totalRequestExecutionTimeMs: 1500
          },
          searchType: 'person',
          timestamp: "2024-01-15T10:40:00Z",
          cost: 0.25
        }
      ]
    }
  ];
}

/**
 * Simulates the enhanced JSON download function for testing
 */
export function testEnhancedJsonDownload(enrichedData: TestDataRecord[]) {
  if (enrichedData.length === 0) {
    console.log("No data to download");
    return;
  }

  // Filter only enriched records that have API responses
  const recordsWithJson = enrichedData.filter(record => record.enriched && record.allApiResponses && record.allApiResponses.length > 0);
  
  if (recordsWithJson.length === 0) {
    console.log("No JSON data available");
    return;
  }

  // Calculate total API calls across all records
  const totalApiCalls = recordsWithJson.reduce((sum, record) => sum + (record.allApiResponses?.length || 0), 0);
  
  // Create a combined JSON structure with metadata
  const combinedJson = {
    exportInfo: {
      exportDate: new Date().toISOString(),
      totalRecords: enrichedData.length,
      enrichedRecords: recordsWithJson.length,
      totalApiCalls: totalApiCalls,
      searchTypes: {
        contact: recordsWithJson.filter(r => r.allApiResponses?.some(resp => resp.searchType === 'contact')).length,
        person: recordsWithJson.filter(r => r.allApiResponses?.some(resp => resp.searchType === 'person')).length,
        combination: recordsWithJson.filter(r => r.allApiResponses && r.allApiResponses.length > 1).length
      },
      totalCost: enrichedData.reduce((sum, record) => sum + (record.allApiResponses?.reduce((respSum, resp) => respSum + resp.cost, 0) || 0), 0).toFixed(2)
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
        searchType: record.allApiResponses && record.allApiResponses.length > 1 ? 'combination' : record.allApiResponses?.[0]?.searchType || 'unknown',
        totalCost: record.allApiResponses?.reduce((sum, resp) => sum + resp.cost, 0) || 0,
        apiCallsMade: record.allApiResponses?.length || 0
      },
      allApiResponses: record.allApiResponses
    }))
  };

  console.log("=== Enhanced JSON Download Test ===");
  console.log("Export Info:", combinedJson.exportInfo);
  console.log("Number of records:", combinedJson.records.length);
  console.log("Total API calls made:", totalApiCalls);
  console.log("Search type breakdown:", combinedJson.exportInfo.searchTypes);
  console.log("Sample record with multiple API calls:", JSON.stringify(combinedJson.records[0], null, 2));
  
  return combinedJson;
}

/**
 * Run the enhanced test
 */
export function runEnhancedJsonDownloadTest() {
  const sampleData = createSampleEnrichedDataWithMultipleResponses();
  const result = testEnhancedJsonDownload(sampleData);
  return result;
}
