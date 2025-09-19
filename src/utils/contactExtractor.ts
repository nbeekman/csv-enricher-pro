interface PersonSearchResponse {
  persons: Array<{
    tahoeId: string;
    name: {
      firstName: string;
      lastName: string;
    };
    addresses: Array<{
      isDeliverable: boolean;
      isPublic: boolean;
      addressOrder: number;
      fullAddress: string;
      firstReportedDate: string;
      lastReportedDate: string;
      phoneNumbers: string[];
      addressQualityCodes: string[];
    }>;
    phoneNumbers: Array<{
      phoneNumber: string;
      phoneType: string;
      isConnected: boolean;
      isPublic: boolean;
      phoneOrder: number;
      firstReportedDate: string;
      lastReportedDate: string;
    }>;
  }>;
}

interface BestContactInfo {
  bestEmail: string | null;
  bestPhone: string | null;
  bestAddress: string | null;
  confidence: {
    email: number;
    phone: number;
    address: number;
  };
}

/**
 * Extracts the best contact information from a Person Search response
 * @param response - The Person Search API response
 * @returns Best contact information with confidence scores
 */
export function extractBestContactInfo(response: PersonSearchResponse): BestContactInfo {
  if (!response.persons || response.persons.length === 0) {
    return {
      bestEmail: null,
      bestPhone: null,
      bestAddress: null,
      confidence: { email: 0, phone: 0, address: 0 }
    };
  }

  const person = response.persons[0]; // Use first person if multiple results

  // Extract best address
  const bestAddress = extractBestAddress(person.addresses);
  
  // Extract best phone
  const bestPhone = extractBestPhone(person.phoneNumbers);
  
  // No email information available in this response structure
  const bestEmail = null;

  return {
    bestEmail,
    bestPhone: bestPhone?.phoneNumber || null,
    bestAddress: bestAddress?.fullAddress || null,
    confidence: {
      email: 0, // No email data available
      phone: bestPhone ? calculatePhoneConfidence(bestPhone) : 0,
      address: bestAddress ? calculateAddressConfidence(bestAddress) : 0
    }
  };
}

/**
 * Extracts the best address based on quality indicators
 */
function extractBestAddress(addresses: any[]): any | null {
  if (!addresses || addresses.length === 0) return null;

  // Sort addresses by priority:
  // 1. Deliverable and public addresses first
  // 2. Lower address order (more recent/primary)
  // 3. No quality codes (clean addresses)
  // 4. Most recent lastReportedDate
  const sortedAddresses = addresses
    .filter(addr => addr.isPublic) // Only consider public addresses
    .sort((a, b) => {
      // Prioritize deliverable addresses
      if (a.isDeliverable !== b.isDeliverable) {
        return a.isDeliverable ? -1 : 1;
      }
      
      // Prioritize lower address order (primary addresses)
      if (a.addressOrder !== b.addressOrder) {
        return a.addressOrder - b.addressOrder;
      }
      
      // Prioritize addresses without quality codes
      if (a.addressQualityCodes.length !== b.addressQualityCodes.length) {
        return a.addressQualityCodes.length - b.addressQualityCodes.length;
      }
      
      // Prioritize more recent addresses
      const aDate = new Date(a.lastReportedDate);
      const bDate = new Date(b.lastReportedDate);
      return bDate.getTime() - aDate.getTime();
    });

  return sortedAddresses[0] || null;
}

/**
 * Extracts the best phone number based on quality indicators
 */
function extractBestPhone(phoneNumbers: any[]): any | null {
  if (!phoneNumbers || phoneNumbers.length === 0) return null;

  // Sort phone numbers by priority:
  // 1. Connected and public phones first
  // 2. Wireless phones (more likely to be current)
  // 3. Lower phone order (primary numbers)
  // 4. Most recent lastReportedDate
  const sortedPhones = phoneNumbers
    .filter(phone => phone.isPublic) // Only consider public phones
    .sort((a, b) => {
      // Prioritize connected phones
      if (a.isConnected !== b.isConnected) {
        return a.isConnected ? -1 : 1;
      }
      
      // Prioritize wireless phones
      const aIsWireless = a.phoneType?.toLowerCase().includes('wireless');
      const bIsWireless = b.phoneType?.toLowerCase().includes('wireless');
      if (aIsWireless !== bIsWireless) {
        return aIsWireless ? -1 : 1;
      }
      
      // Prioritize lower phone order (primary numbers)
      if (a.phoneOrder !== b.phoneOrder) {
        return a.phoneOrder - b.phoneOrder;
      }
      
      // Prioritize more recent phones
      const aDate = new Date(a.lastReportedDate);
      const bDate = new Date(b.lastReportedDate);
      return bDate.getTime() - aDate.getTime();
    });

  return sortedPhones[0] || null;
}

/**
 * Calculates confidence score for phone number (0-100)
 */
function calculatePhoneConfidence(phone: any): number {
  let confidence = 50; // Base confidence
  
  if (phone.isConnected) confidence += 20;
  if (phone.isPublic) confidence += 10;
  if (phone.phoneType?.toLowerCase().includes('wireless')) confidence += 15;
  if (phone.phoneOrder === 1) confidence += 10; // Primary number
  
  // Check recency (more recent = higher confidence)
  const lastReported = new Date(phone.lastReportedDate);
  const now = new Date();
  const daysSinceReported = (now.getTime() - lastReported.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceReported < 365) confidence += 5; // Less than a year old
  
  return Math.min(confidence, 100);
}

/**
 * Calculates confidence score for address (0-100)
 */
function calculateAddressConfidence(address: any): number {
  let confidence = 50; // Base confidence
  
  if (address.isDeliverable) confidence += 25;
  if (address.isPublic) confidence += 10;
  if (address.addressOrder === 1) confidence += 10; // Primary address
  if (address.addressQualityCodes.length === 0) confidence += 10; // No quality issues
  
  // Check recency (more recent = higher confidence)
  const lastReported = new Date(address.lastReportedDate);
  const now = new Date();
  const daysSinceReported = (now.getTime() - lastReported.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceReported < 365) confidence += 5; // Less than a year old
  
  return Math.min(confidence, 100);
}

/**
 * Formats contact information for display
 */
export function formatContactInfo(contactInfo: BestContactInfo): string {
  const parts: string[] = [];
  
  if (contactInfo.bestAddress) {
    parts.push(`Address: ${contactInfo.bestAddress} (${contactInfo.confidence.address}% confidence)`);
  }
  
  if (contactInfo.bestPhone) {
    parts.push(`Phone: ${contactInfo.bestPhone} (${contactInfo.confidence.phone}% confidence)`);
  }
  
  if (contactInfo.bestEmail) {
    parts.push(`Email: ${contactInfo.bestEmail} (${contactInfo.confidence.email}% confidence)`);
  } else {
    parts.push('Email: Not available in this data source');
  }
  
  return parts.join('\n');
}
