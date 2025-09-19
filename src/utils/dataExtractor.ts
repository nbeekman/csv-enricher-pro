/**
 * Unified data extraction utility for both Contact Enrichment and Person Search API responses
 */

interface ContactEnrichmentPerson {
  name: {
    firstName: string;
    middleName: string;
    lastName: string;
  };
  age: string;
  addresses: Array<{
    firstReportedDate: string;
    lastReportedDate: string;
    street: string;
    unit: string;
    city: string;
    state: string;
    zip: string;
  }>;
  phones: Array<{
    number: string;
    type: string;
    isConnected: boolean;
    firstReportedDate: string;
    lastReportedDate: string;
  }>;
  emails: Array<{
    address: string;
    type: string;
    isConnected: boolean;
    firstReportedDate: string;
    lastReportedDate: string;
  }>;
}

interface PersonSearchPerson {
  name: {
    firstName: string;
    middleName: string;
    lastName: string;
  };
  age: number;
  addresses: Array<{
    isDeliverable: boolean;
    isPublic: boolean;
    houseNumber: string;
    streetPreDirection: string;
    streetName: string;
    streetPostDirection: string;
    streetType: string;
    unit: string;
    unitType: string | null;
    city: string;
    state: string;
    county: string;
    zip: string;
    zip4: string;
    fullAddress: string;
    addressOrder: number;
    firstReportedDate: string;
    lastReportedDate: string;
  }>;
  phoneNumbers: Array<{
    phoneNumber: string;
    company: string;
    location: string;
    phoneType: string;
    isConnected: boolean;
    isPublic: boolean;
    phoneOrder: number;
    firstReportedDate: string;
    lastReportedDate: string;
  }>;
  emailAddresses: Array<{
    emailAddress: string;
    emailOrdinal: number;
    isPremium: boolean;
    nonBusiness: number;
    sourceSummary: any;
  }>;
}

interface ExtractedContactData {
  email: string;
  phone: string;
  address: string;
}

/**
 * Extracts contact data from Contact Enrichment API response
 */
function extractFromContactEnrichment(person: ContactEnrichmentPerson): ExtractedContactData {
  const email = person.emails?.[0]?.address || '';
  const phone = person.phones?.[0]?.number || '';
  
  let address = '';
  if (person.addresses?.[0]) {
    const addr = person.addresses[0];
    address = `${addr.street}${addr.unit ? ' ' + addr.unit : ''}, ${addr.city}, ${addr.state} ${addr.zip}`;
  }
  
  return { email, phone, address };
}

/**
 * Extracts contact data from Person Search API response
 */
function extractFromPersonSearch(person: PersonSearchPerson): ExtractedContactData {
  // Get the best email address (first premium, then by ordinal)
  const bestEmail = person.emailAddresses
    ?.sort((a, b) => {
      // Prioritize premium emails
      if (a.isPremium !== b.isPremium) {
        return a.isPremium ? -1 : 1;
      }
      // Then by ordinal (lower is better)
      return a.emailOrdinal - b.emailOrdinal;
    })?.[0];
  
  const email = bestEmail?.emailAddress || '';
  
  // Get the best phone number (first connected, public, wireless)
  const bestPhone = person.phoneNumbers
    ?.filter(phone => phone.isConnected && phone.isPublic)
    ?.sort((a, b) => {
      // Prioritize wireless phones
      const aIsWireless = a.phoneType?.toLowerCase().includes('wireless');
      const bIsWireless = b.phoneType?.toLowerCase().includes('wireless');
      if (aIsWireless !== bIsWireless) {
        return aIsWireless ? -1 : 1;
      }
      // Then by phone order
      return a.phoneOrder - b.phoneOrder;
    })?.[0];
  
  const phone = bestPhone?.phoneNumber || '';
  
  // Get the best address (first deliverable, public, primary)
  const bestAddress = person.addresses
    ?.filter(addr => addr.isDeliverable && addr.isPublic)
    ?.sort((a, b) => a.addressOrder - b.addressOrder)?.[0];
  
  const address = bestAddress?.fullAddress || '';
  
  return { email, phone, address };
}

/**
 * Unified function to extract contact data from any API response
 */
export function extractContactData(apiResponse: any, searchType: 'contact' | 'person' | 'combination'): ExtractedContactData {
  // Handle different response structures
  let person = null;
  
  if (apiResponse?.person) {
    // Contact Enrichment response structure
    person = apiResponse.person;
  } else if (apiResponse?.persons && apiResponse.persons.length > 0) {
    // Person Search response structure with persons array
    person = apiResponse.persons[0]; // Use first person
  }
  
  if (!person) {
    return { email: '', phone: '', address: '' };
  }
  
  // Determine which extraction method to use based on the response structure
  if (person.phoneNumbers && person.addresses?.[0]?.fullAddress) {
    // Person Search API response structure
    return extractFromPersonSearch(person as PersonSearchPerson);
  } else if (person.phones && person.emails) {
    // Contact Enrichment API response structure
    return extractFromContactEnrichment(person as ContactEnrichmentPerson);
  } else {
    // Fallback: try to extract what we can
    console.warn('Unknown API response structure, attempting fallback extraction');
    
    const email = person.emails?.[0]?.address || 
                  person.emailAddresses?.[0]?.emailAddress || 
                  '';
    
    const phone = person.phones?.[0]?.number || 
                  person.phoneNumbers?.[0]?.phoneNumber || 
                  person.phoneNumbers?.[0]?.number ||
                  '';
    
    let address = '';
    if (person.addresses?.[0]) {
      const addr = person.addresses[0];
      if (addr.fullAddress) {
        address = addr.fullAddress;
      } else if (addr.street) {
        address = `${addr.street}${addr.unit ? ' ' + addr.unit : ''}, ${addr.city}, ${addr.state} ${addr.zip}`;
      }
    }
    
    return { email, phone, address };
  }
}

/**
 * Test function to verify data extraction works with both API types
 */
export function testDataExtraction() {
  // Sample Contact Enrichment response
  const contactEnrichmentResponse = {
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
    }
  };
  
  // Sample Person Search response
  const personSearchResponse = {
    person: {
      name: { firstName: "Aaron", middleName: "", lastName: "Smith" },
      age: 46,
      addresses: [{
        isDeliverable: true,
        isPublic: true,
        houseNumber: "326",
        streetPreDirection: "S",
        streetName: "900",
        streetPostDirection: "W",
        streetType: "",
        unit: "",
        unitType: null,
        city: "Payson",
        state: "UT",
        county: "Utah",
        zip: "84651",
        zip4: "2429",
        fullAddress: "326 S 900 W; Payson, UT 84651-2429",
        addressOrder: 1,
        firstReportedDate: "1/8/2007",
        lastReportedDate: "8/1/2025"
      }],
      phoneNumbers: [{
        phoneNumber: "(801) 404-0751",
        company: "Sprint Spectrum LP",
        location: "UTAH-ALL AREAS, UT",
        phoneType: "Wireless",
        isConnected: true,
        isPublic: true,
        phoneOrder: 1,
        firstReportedDate: "10/1/2018",
        lastReportedDate: "8/1/2025"
      }],
      emailAddresses: [{
        emailAddress: "aaron.smith@email.com",
        emailOrdinal: 1,
        isPremium: true,
        nonBusiness: 1,
        sourceSummary: null
      }]
    }
  };
  
  console.log("=== Data Extraction Test ===");
  
  const contactData = extractContactData(contactEnrichmentResponse, 'contact');
  console.log("Contact Enrichment extraction:", contactData);
  
  const personData = extractContactData(personSearchResponse, 'person');
  console.log("Person Search extraction:", personData);
  
  return { contactData, personData };
}
