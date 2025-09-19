import { extractBestContactInfo, formatContactInfo } from './contactExtractor';

/**
 * Test function to demonstrate contact extraction with the sample response
 */
export async function testContactExtraction() {
  try {
    // Load the sample response
    const response = await fetch('/sampleResponse.json');
    const data = await response.json();
    
    // Extract best contact information
    const contactInfo = extractBestContactInfo(data);
    
    // Format and display results
    console.log('=== Best Contact Information ===');
    console.log(formatContactInfo(contactInfo));
    
    // Also return structured data
    return {
      contactInfo,
      formatted: formatContactInfo(contactInfo)
    };
  } catch (error) {
    console.error('Error testing contact extraction:', error);
    return null;
  }
}

/**
 * Example usage for integration into your CSV enricher
 */
export function enrichPersonWithBestContact(personData: any, searchResponse: any) {
  const contactInfo = extractBestContactInfo(searchResponse);
  
  return {
    ...personData,
    bestEmail: contactInfo.bestEmail,
    bestPhone: contactInfo.bestPhone,
    bestAddress: contactInfo.bestAddress,
    contactConfidence: {
      email: contactInfo.confidence.email,
      phone: contactInfo.confidence.phone,
      address: contactInfo.confidence.address
    }
  };
}
