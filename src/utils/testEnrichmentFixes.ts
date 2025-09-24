/**
 * Test script to verify the enrichment fixes work correctly
 */

import { extractContactData, mergeContactData } from './dataExtractor';

// Test data based on the actual API responses we've seen
const testContactEnrichmentResponse = {
  person: {
    name: { firstName: "JORDON", middleName: "MICHAEL", lastName: "ZYMOLA" },
    age: "32",
    addresses: [{
      firstReportedDate: "2/1/2021",
      lastReportedDate: "8/1/2025",
      street: "8369 S Etude Dr",
      unit: "",
      city: "West Jordan",
      state: "UT",
      zip: "84088"
    }],
    phones: [{
      number: "(801) 503-7910",
      type: "mobile",
      isConnected: true,
      firstReportedDate: "11/1/2011",
      lastReportedDate: "8/1/2025"
    }],
    emails: [] // This is the issue - empty emails array
  },
  identityScore: 85,
  message: "",
  pagination: {
    currentPageNumber: 1,
    resultsPerPage: 1,
    totalPages: 1,
    totalResults: 0
  }
};

const testPersonSearchResponse = {
  person: {
    name: { firstName: "JORDON", middleName: "MICHAEL", lastName: "ZYMOLA" },
    age: 32,
    addresses: [{
      isDeliverable: true,
      isPublic: true,
      houseNumber: "8369",
      streetPreDirection: "S",
      streetName: "Etude",
      streetPostDirection: "",
      streetType: "Dr",
      unit: "",
      unitType: null,
      city: "West Jordan",
      state: "UT",
      county: "Salt Lake",
      zip: "84088",
      zip4: "",
      fullAddress: "8369 S Etude Dr, West Jordan, UT 84088",
      addressOrder: 1,
      firstReportedDate: "2/1/2021",
      lastReportedDate: "8/1/2025"
    }],
    phoneNumbers: [{
      phoneNumber: "(801) 503-7910",
      company: "Verizon Wireless",
      location: "UTAH-ALL AREAS, UT",
      phoneType: "Wireless",
      isConnected: true,
      isPublic: true,
      phoneOrder: 1,
      firstReportedDate: "11/1/2011",
      lastReportedDate: "8/1/2025"
    }],
    emailAddresses: [{
      emailAddress: "jordon.zymola@email.com",
      emailOrdinal: 1,
      isPremium: true,
      nonBusiness: 1,
      sourceSummary: null
    }]
  },
  identityScore: 95,
  message: "",
  pagination: {
    currentPageNumber: 1,
    resultsPerPage: 1,
    totalPages: 1,
    totalResults: 1
  }
};

export function testEnrichmentFixes() {
  console.log("=== Testing Enrichment Fixes ===");

  // Test 1: Contact Enrichment extraction (no email data)
  console.log("\n1. Testing Contact Enrichment extraction:");
  const contactData = extractContactData(testContactEnrichmentResponse, 'contact');
  console.log("Contact Enrichment result:", contactData);
  console.log("Expected: email='', phone='(801) 503-7910', address='8369 S Etude Dr, West Jordan, UT 84088'");

  // Test 2: Person Search extraction (with email data)
  console.log("\n2. Testing Person Search extraction:");
  const personData = extractContactData(testPersonSearchResponse, 'person');
  console.log("Person Search result:", personData);
  console.log("Expected: email='jordon.zymola@email.com', phone='(801) 503-7910', address='8369 S Etude Dr, West Jordan, UT 84088'");

  // Test 3: Data merging (combination search)
  console.log("\n3. Testing data merging:");
  const mergedData = mergeContactData(contactData, personData);
  console.log("Merged result:", mergedData);
  console.log("Expected: email='jordon.zymola@email.com' (from Person Search), phone='(801) 503-7910', address='8369 S Etude Dr, West Jordan, UT 84088'");

  // Test 4: Verify the fixes address the original issues
  console.log("\n4. Verifying fixes:");
  console.log("✅ Email extraction fixed:", !!mergedData.email);
  console.log("✅ Phone extraction working:", !!mergedData.phone);
  console.log("✅ Address extraction working:", !!mergedData.address);
  console.log("✅ Data merging working:", mergedData.email === personData.email);

  return {
    contactData,
    personData,
    mergedData,
    fixesWorking: {
      emailExtraction: !!mergedData.email,
      phoneExtraction: !!mergedData.phone,
      addressExtraction: !!mergedData.address,
      dataMerging: mergedData.email === personData.email
    }
  };
}

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  testEnrichmentFixes();
}
