interface ContactEnrichmentRequest {
  FirstName: string | null;
  MiddleName: string | null;
  LastName: string | null;
  Dob: string | null;
  Age: number | null;
  Address: {
    AddressLine1: string | null;
    AddressLine2: string | null;
  };
  Phone: string | null;
  Email: string | null;
}

interface ContactEnrichmentResponse {
  requestId: string;
  requestType: string;
  requestTime: string;
  isError: boolean;
  error?: {
    code: string;
    message: string;
    technicalErrorMessage: string;
    inputErrors: any[];
    warnings: any[];
  };
  person?: {
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
  };
  message: string;
  identityScore: number;
  pagination: {
    currentPageNumber: number;
    resultsPerPage: number;
    totalPages: number;
    totalResults: number;
  };
  databaseQueryInfo: any[];
  searchCriteria: any[];
  totalRequestExecutionTimeMs: number;
}

export interface ApiError {
  type: 'rate_limit' | 'authentication' | 'validation' | 'network' | 'unknown';
  code: string;
  message: string;
  technicalMessage?: string;
  statusCode?: number;
  retryAfter?: number; // For rate limit errors
}

interface PersonSearchRequest {
  FirstName: string | null;
  MiddleName: string | null;
  LastName: string | null;
  Akas: any | null;
  Dob: string | null;
  Age: number | null;
  AgeRangeMinAge: number | null;
  AgeRangeMaxAge: number | null;
  AgeRange: string | null;
  Ssn: string | null;
  Addresses: Array<{
    AddressLine1: string | null;
    AddressLine2: string | null;
    County: string | null;
  }>;
  Email: string | null;
  ClientIp: number | null;
  Phone: string | null;
  Relatives: any | null;
  TahoeIds: string[] | null;
  FirstNameCharOffset: number | null;
  LastNameCharOffset: number | null;
  DobFormat: string | null;
  MaxAddressYears: number | null;
  MaxPhoneYears: number | null;
}

interface PersonSearchResponse {
  requestId: string;
  requestType: string;
  requestTime: string;
  isError: boolean;
  error?: {
    code: string;
    message: string;
    technicalErrorMessage: string;
    inputErrors: any[];
    warnings: any[];
  };
  person?: {
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
  };
  message: string;
  identityScore: number;
  pagination: {
    currentPageNumber: number;
    resultsPerPage: number;
    totalPages: number;
    totalResults: number;
  };
  databaseQueryInfo: any[];
  searchCriteria: any[];
  totalRequestExecutionTimeMs: number;
}

export type SearchType = 'contact' | 'person' | 'combination';

export interface SearchResult {
  data: ContactEnrichmentResponse | PersonSearchResponse;
  searchType: SearchType;
  cost: number;
  usedCombination: boolean;
  allApiResponses: Array<{
    response: ContactEnrichmentResponse | PersonSearchResponse;
    searchType: 'contact' | 'person';
    timestamp: string;
    cost: number;
  }>; // Store all API responses made during the search
}

interface EnformionCredentials {
  accessProfile: string;
  password: string;
}

export class EnformionService {
  private baseUrl = 'https://devapi.enformion.com';
  private proxyUrl = '/api'; // Use Vite proxy for CORS issues
  private credentials: EnformionCredentials;
  private identityScoreThreshold = 95; // Configurable threshold for combination search

  constructor(credentials: EnformionCredentials) {
    this.credentials = credentials;
    this.validateCredentials();
  }

  /**
   * Parse API error response and create a structured ApiError
   */
  private parseApiError(response: Response, errorText: string): ApiError {
    const statusCode = response.status;

    // Try to parse JSON error response
    try {
      const errorData = JSON.parse(errorText);

      if (errorData.error) {
        const error = errorData.error;

        // Handle rate limit errors (429)
        if (statusCode === 429 || error.code === 'Rate Limit Exceeded') {
          return {
            type: 'rate_limit',
            code: error.code || 'Rate Limit Exceeded',
            message: 'API rate limit exceeded. Please wait before making more requests.',
            technicalMessage: error.technicalErrorMessage,
            statusCode,
            retryAfter: 60 // Default to 60 seconds if not specified
          };
        }

        // Handle validation errors
        if (error.code === 'Invalid Input') {
          return {
            type: 'validation',
            code: error.code,
            message: `Validation failed: ${error.inputErrors?.join(', ') || error.message}`,
            technicalMessage: error.technicalErrorMessage,
            statusCode
          };
        }

        // Handle authentication errors
        if (statusCode === 401 || error.code === 'Unauthorized') {
          return {
            type: 'authentication',
            code: error.code || 'Unauthorized',
            message: 'Authentication failed. Please check your API credentials.',
            technicalMessage: error.technicalErrorMessage,
            statusCode
          };
        }

        // Generic API error
        return {
          type: 'unknown',
          code: error.code || 'API Error',
          message: error.message || 'An API error occurred',
          technicalMessage: error.technicalErrorMessage,
          statusCode
        };
      }
    } catch (parseError) {
      // If we can't parse the error, create a generic error
    }

    // Handle HTTP status codes
    if (statusCode === 429) {
      return {
        type: 'rate_limit',
        code: 'Rate Limit Exceeded',
        message: 'API rate limit exceeded. Please wait before making more requests.',
        statusCode,
        retryAfter: 60
      };
    }

    if (statusCode === 401) {
      return {
        type: 'authentication',
        code: 'Unauthorized',
        message: 'Authentication failed. Please check your API credentials.',
        statusCode
      };
    }

    if (statusCode >= 500) {
      return {
        type: 'network',
        code: 'Server Error',
        message: 'Server error occurred. Please try again later.',
        statusCode
      };
    }

    // Default error
    return {
      type: 'unknown',
      code: 'Unknown Error',
      message: `Request failed with status ${statusCode}`,
      statusCode
    };
  }

  private validateCredentials() {
    console.log('EnformionService: Validating credentials...');
    console.log('- Access Profile:', this.credentials.accessProfile);
    console.log('- Password length:', this.credentials.password.length);
    console.log('- Password (first 8 chars):', this.credentials.password.substring(0, 8) + '...');

    if (!this.credentials.accessProfile || !this.credentials.password) {
      throw new Error('Both accessProfile and password are required');
    }

    if (this.credentials.accessProfile.length < 3) {
      console.warn('Access profile seems very short:', this.credentials.accessProfile);
    }

    if (this.credentials.password.length < 8) {
      console.warn('Password seems very short:', this.credentials.password.length, 'characters');
    }
  }

  /**
   * Set the identity score threshold for combination search
   * @param threshold - The identity score threshold (default: 95)
   */
  setIdentityScoreThreshold(threshold: number) {
    if (threshold < 0 || threshold > 100) {
      throw new Error('Identity score threshold must be between 0 and 100');
    }
    this.identityScoreThreshold = threshold;
    console.log(`Identity score threshold set to: ${threshold}`);
  }

  // Person Search method
  async searchPerson(contactData: {
    firstName: string;
    middleName: string;
    lastName: string;
    city: string;
    state: string;
  }): Promise<PersonSearchResponse> {
    // Ensure we have required fields based on API validation rules
    const firstName = contactData.firstName?.trim() || null;
    const lastName = contactData.lastName?.trim() || null;

    // API requires Last Name if First Name is provided
    const finalFirstName = firstName && lastName ? firstName : null;
    const finalLastName = firstName && lastName ? lastName : null;

    // Simplified request body with only essential fields
    const requestBody = {
      FirstName: finalFirstName,
      LastName: finalLastName,
      Addresses: [{
        AddressLine2: contactData.city && contactData.state ? `${contactData.city}, ${contactData.state}` : null
      }]
    };

    console.log('EnformionService: Making Person Search API request');
    console.log('Input validation:');
    console.log('- Original First Name:', contactData.firstName);
    console.log('- Original Last Name:', contactData.lastName);
    console.log('- Final First Name:', finalFirstName);
    console.log('- Final Last Name:', finalLastName);
    console.log('- Request Body:', JSON.stringify(requestBody, null, 2));
    console.log('- Endpoint URL:', `${this.proxyUrl}/PersonSearch`);

    try {
      // Use proxy URL to avoid CORS issues in development
      const response = await fetch(`${this.proxyUrl}/PersonSearch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'galaxy-ap-name': this.credentials.accessProfile,
          'galaxy-ap-password': this.credentials.password,
          'galaxy-search-type': 'Person',
          'galaxy-client-type': 'javascript'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result: PersonSearchResponse = await response.json();
        console.log('Person Search API request succeeded!');
        return result;
      }

      const errorText = await response.text();
      console.log('Person Search API request failed with status:', response.status);
      console.log('Error response:', errorText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // Parse the error using our structured error handler
      const apiError = this.parseApiError(response, errorText);

      // Create a custom error that includes the structured API error
      const error = new Error(apiError.message) as Error & { apiError: ApiError };
      error.apiError = apiError;

      throw error;

    } catch (error) {
      console.error('EnformionService: Error searching person:', error);
      throw error;
    }
  }

  // Main method using the working authentication approach
  async enrichContact(contactData: {
    firstName: string;
    middleName: string;
    lastName: string;
    city: string;
    state: string;
  }): Promise<ContactEnrichmentResponse> {
    // Ensure we have required fields based on API validation rules
    const firstName = contactData.firstName?.trim() || null;
    const lastName = contactData.lastName?.trim() || null;

    // API requires Last Name if First Name is provided
    const finalFirstName = firstName && lastName ? firstName : null;
    const finalLastName = firstName && lastName ? lastName : null;

    const requestBody: ContactEnrichmentRequest = {
      FirstName: finalFirstName,
      MiddleName: contactData.middleName?.trim() || null,
      LastName: finalLastName,
      Dob: null,
      Age: null,
      Address: {
        AddressLine1: null,
        AddressLine2: contactData.city && contactData.state ? `${contactData.city}, ${contactData.state}` : null
      },
      Phone: null,
      Email: null
    };

    console.log('EnformionService: Making API request with official authentication method');
    console.log('Input validation:');
    console.log('- Original First Name:', contactData.firstName);
    console.log('- Original Last Name:', contactData.lastName);
    console.log('- Final First Name:', finalFirstName);
    console.log('- Final Last Name:', finalLastName);
    console.log('- Applied validation rule: Last Name required if First Name is used');

    try {
      const response = await fetch(`${this.baseUrl}/Contact/Enrich`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'galaxy-ap-name': this.credentials.accessProfile,
          'galaxy-ap-password': this.credentials.password,
          'galaxy-search-type': 'DevAPIContactEnrich',
          'galaxy-client-type': 'javascript'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result: ContactEnrichmentResponse = await response.json();
        console.log('API request succeeded!');
        return result;
      }

      const errorText = await response.text();
      console.log('API request failed with status:', response.status);
      console.log('Error response:', errorText);

      // Parse the error using our structured error handler
      const apiError = this.parseApiError(response, errorText);

      // Create a custom error that includes the structured API error
      const error = new Error(apiError.message) as Error & { apiError: ApiError };
      error.apiError = apiError;

      throw error;

    } catch (error) {
      console.error('EnformionService: Error enriching contact:', error);
      throw error;
    }
  }

  // Main search method that handles all three search types
  async searchContact(contactData: {
    firstName: string;
    middleName: string;
    lastName: string;
    city: string;
    state: string;
  }, searchType: SearchType): Promise<SearchResult> {
    console.log(`EnformionService: Starting ${searchType} search for:`, contactData.firstName, contactData.lastName);

    if (searchType === 'contact') {
      const result = await this.enrichContact(contactData);
      return {
        data: result,
        searchType: 'contact',
        cost: 0.10,
        usedCombination: false,
        allApiResponses: [{
          response: result,
          searchType: 'contact',
          timestamp: new Date().toISOString(),
          cost: 0.10
        }]
      };
    }

    if (searchType === 'person') {
      const result = await this.searchPerson(contactData);
      return {
        data: result,
        searchType: 'person',
        cost: 0.25,
        usedCombination: false,
        allApiResponses: [{
          response: result,
          searchType: 'person',
          timestamp: new Date().toISOString(),
          cost: 0.25
        }]
      };
    }

    if (searchType === 'combination') {
      // First try Contact Enrichment
      const contactResult = await this.enrichContact(contactData);
      const allApiResponses: Array<{
        response: ContactEnrichmentResponse | PersonSearchResponse;
        searchType: 'contact' | 'person';
        timestamp: string;
        cost: number;
      }> = [{
        response: contactResult,
        searchType: 'contact' as const,
        timestamp: new Date().toISOString(),
        cost: 0.10
      }];

      // Check if identityScore is below threshold OR if no email data was found
      const hasEmailData = contactResult.person?.emails && contactResult.person.emails.length > 0;
      if (contactResult.identityScore < this.identityScoreThreshold || !hasEmailData) {
        console.log(`Identity score ${contactResult.identityScore} is below ${this.identityScoreThreshold} or no email data found, trying Person Search...`);
        try {
          const personResult = await this.searchPerson(contactData);

          // Add Person Search response to the array
          allApiResponses.push({
            response: personResult,
            searchType: 'person' as const,
            timestamp: new Date().toISOString(),
            cost: 0.25
          });

          return {
            data: personResult,
            searchType: 'combination',
            cost: 0.35, // $0.10 + $0.25
            usedCombination: true,
            allApiResponses
          };
        } catch (personSearchError) {
          console.warn('Person Search failed, falling back to Contact Enrichment result:', personSearchError);
          // If Person Search fails (e.g., CORS, 400 error), fall back to Contact Enrichment
          return {
            data: contactResult,
            searchType: 'combination',
            cost: 0.10,
            usedCombination: false,
            allApiResponses
          };
        }
      } else {
        // Even if identity score is high, if we don't have email data, try Person Search
        if (!hasEmailData) {
          console.log(`Identity score ${contactResult.identityScore} is 95 or above but no email data found, trying Person Search for email...`);
          try {
            const personResult = await this.searchPerson(contactData);

            // Add Person Search response to the array
            allApiResponses.push({
              response: personResult,
              searchType: 'person' as const,
              timestamp: new Date().toISOString(),
              cost: 0.25
            });

            return {
              data: personResult,
              searchType: 'combination',
              cost: 0.35, // $0.10 + $0.25
              usedCombination: true,
              allApiResponses
            };
          } catch (personSearchError) {
            console.warn('Person Search failed for email data, falling back to Contact Enrichment result:', personSearchError);
          }
        }

        console.log(`Identity score ${contactResult.identityScore} is ${this.identityScoreThreshold} or above and has email data, using Contact Enrichment result`);
        return {
          data: contactResult,
          searchType: 'combination',
          cost: 0.10,
          usedCombination: false,
          allApiResponses
        };
      }
    }

    throw new Error(`Invalid search type: ${searchType}`);
  }

}
