/**
 * Test utility to demonstrate the horizontal scrolling functionality
 * This creates sample data with many columns to test the table scrolling
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
  searchType?: 'contact' | 'person' | 'combination';
  cost?: number;
  identityScore?: number;
  usedCombination?: boolean;
  allApiResponses?: Array<{
    response: any;
    searchType: 'contact' | 'person';
    timestamp: string;
    cost: number;
  }>;
}

/**
 * Creates sample data with many columns to test horizontal scrolling
 */
export function createSampleDataForHorizontalScroll(): TestDataRecord[] {
  return [
    {
      firstName: "John",
      middleName: "Alexander",
      lastName: "Doe",
      city: "New York",
      state: "NY",
      trade: "Electrician",
      licenseNumber: "EL123456789",
      status: "Active",
      email: "john.alexander.doe@verylongemaildomain.com",
      phone: "(555) 123-4567",
      address: "123 Main Street, Apartment 4B, New York, NY 10001-1234",
      enriched: true,
      searchType: 'combination',
      cost: 0.35,
      identityScore: 95,
      usedCombination: true,
      allApiResponses: [
        {
          response: { requestId: "req-1", identityScore: 85 },
          searchType: 'contact',
          timestamp: "2024-01-15T10:30:00Z",
          cost: 0.10
        },
        {
          response: { requestId: "req-2", identityScore: 95 },
          searchType: 'person',
          timestamp: "2024-01-15T10:30:02Z",
          cost: 0.25
        }
      ]
    },
    {
      firstName: "Jane",
      middleName: "Elizabeth",
      lastName: "Smith-Wilson",
      city: "Los Angeles",
      state: "CA",
      trade: "Plumber",
      licenseNumber: "PL987654321",
      status: "Active",
      email: "jane.elizabeth.smith.wilson@anotherverylongemaildomain.com",
      phone: "(555) 987-6543",
      address: "456 Oak Avenue, Suite 200, Los Angeles, CA 90210-5678",
      enriched: true,
      searchType: 'contact',
      cost: 0.10,
      identityScore: 100,
      usedCombination: false,
      allApiResponses: [
        {
          response: { requestId: "req-3", identityScore: 100 },
          searchType: 'contact',
          timestamp: "2024-01-15T10:35:00Z",
          cost: 0.10
        }
      ]
    },
    {
      firstName: "Robert",
      middleName: "Michael",
      lastName: "Johnson",
      city: "Chicago",
      state: "IL",
      trade: "HVAC Technician",
      licenseNumber: "HV456789123",
      status: "Active",
      email: "robert.michael.johnson@yetanotherverylongemaildomain.com",
      phone: "(555) 456-7890",
      address: "789 Pine Street, Unit 15, Chicago, IL 60601-9012",
      enriched: true,
      searchType: 'person',
      cost: 0.25,
      identityScore: 88,
      usedCombination: false,
      allApiResponses: [
        {
          response: { requestId: "req-4", identityScore: 88 },
          searchType: 'person',
          timestamp: "2024-01-15T10:40:00Z",
          cost: 0.25
        }
      ]
    },
    {
      firstName: "Sarah",
      middleName: "Marie",
      lastName: "Brown-Davis",
      city: "Houston",
      state: "TX",
      trade: "General Contractor",
      licenseNumber: "GC789123456",
      status: "Active",
      email: "sarah.marie.brown.davis@extremelylongemaildomainname.com",
      phone: "(555) 321-0987",
      address: "321 Elm Street, Building A, Floor 3, Houston, TX 77001-3456",
      enriched: true,
      searchType: 'combination',
      cost: 0.35,
      identityScore: 92,
      usedCombination: true,
      allApiResponses: [
        {
          response: { requestId: "req-5", identityScore: 75 },
          searchType: 'contact',
          timestamp: "2024-01-15T10:45:00Z",
          cost: 0.10
        },
        {
          response: { requestId: "req-6", identityScore: 92 },
          searchType: 'person',
          timestamp: "2024-01-15T10:45:02Z",
          cost: 0.25
        }
      ]
    },
    {
      firstName: "Michael",
      middleName: "David",
      lastName: "Garcia-Rodriguez",
      city: "Phoenix",
      state: "AZ",
      trade: "Roofing Contractor",
      licenseNumber: "RC123789456",
      status: "Active",
      email: "michael.david.garcia.rodriguez@superlongemaildomainname.com",
      phone: "(555) 654-3210",
      address: "654 Maple Drive, House 7, Phoenix, AZ 85001-7890",
      enriched: true,
      searchType: 'person',
      cost: 0.25,
      identityScore: 96,
      usedCombination: false,
      allApiResponses: [
        {
          response: { requestId: "req-7", identityScore: 96 },
          searchType: 'person',
          timestamp: "2024-01-15T10:50:00Z",
          cost: 0.25
        }
      ]
    }
  ];
}

/**
 * Test function to demonstrate horizontal scrolling
 */
export function testHorizontalScroll() {
  const sampleData = createSampleDataForHorizontalScroll();
  
  console.log("=== Horizontal Scroll Test ===");
  console.log("Sample data created with", sampleData.length, "records");
  console.log("Each record has", Object.keys(sampleData[0]).length, "columns");
  console.log("Enriched records:", sampleData.filter(r => r.enriched).length);
  console.log("Combination searches:", sampleData.filter(r => r.usedCombination).length);
  console.log("Total API calls:", sampleData.reduce((sum, r) => sum + (r.allApiResponses?.length || 0), 0));
  
  // Calculate total table width
  const columnWidths = [
    100, // First Name
    100, // Middle Name  
    100, // Last Name
    120, // City
    80,  // State
    120, // Trade
    100, // License #
    80,  // Status
    200, // Email
    120, // Phone
    250, // Address
    120, // Search Type
    80,  // Cost
    100, // Identity Score
    80,  // API Calls
    100  // Combination
  ];
  
  const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  console.log("Estimated total table width:", totalWidth, "px");
  console.log("This will require horizontal scrolling on most screens");
  
  return sampleData;
}

/**
 * Run the horizontal scroll test
 */
export function runHorizontalScrollTest() {
  return testHorizontalScroll();
}
