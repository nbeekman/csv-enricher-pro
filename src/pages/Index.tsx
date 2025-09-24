import { CSVUploader } from '@/components/CSVUploader';
import { DataTable } from '@/components/DataTable';
import { EnrichmentControls } from '@/components/EnrichmentControls';
import { useToast } from '@/hooks/use-toast';
import { EnformionService, SearchResult, SearchType } from '@/services/enformionService';
import { extractContactData, mergeContactData } from '@/utils/dataExtractor';
import { useState } from 'react';

interface DataRecord {
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
  searchType?: SearchType;
  cost?: number;
  identityScore?: number;
  usedCombination?: boolean;
  allApiResponses?: Array<{
    response: any;
    searchType: 'contact' | 'person';
    timestamp: string;
    cost: number;
  }>; // Store all API responses made during the search
}

const Index = () => {
  const [originalData, setOriginalData] = useState<DataRecord[]>([]);
  const [enrichedData, setEnrichedData] = useState<DataRecord[]>([]);
  const [isEnriching, setIsEnriching] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleDataParsed = (data: DataRecord[]) => {
    setOriginalData(data);
    setEnrichedData([]);
    setProgress(0);
  };

  const enrichContact = async (contact: DataRecord, apiKey: string, searchType: SearchType): Promise<DataRecord> => {
    console.log(`Starting ${searchType} enrichment for contact:`, contact.firstName, contact.lastName);

    try {
      // Extract API credentials from the API key
      // Expecting format: "profileName:password" (e.g., "myProfile:myPassword")
      const [profileName, password] = apiKey.includes(':') ? apiKey.split(':') : [apiKey, ''];

      if (!password) {
        console.error('API key format error: missing password');
        throw new Error('API key must be in format "profileName:password" (e.g., "myProfile:myPassword")');
      }

      console.log('Parsed credentials:');
      console.log('- Profile Name:', profileName);
      console.log('- Password length:', password.length);

      // Create Enformion service instance
      const enformionService = new EnformionService({
        accessProfile: profileName,
        password
      });

      console.log(`Using EnformionService with ${searchType} search method`);

      // Use the new search method that handles all search types
      const searchResult: SearchResult = await enformionService.searchContact({
        firstName: contact.firstName,
        middleName: contact.middleName,
        lastName: contact.lastName,
        city: contact.city,
        state: contact.state
      }, searchType);

      // Extract enriched data from API response using unified extraction
      let extractedData = extractContactData(searchResult.data, searchResult.searchType);

      // Debug logging for email data
      console.log(`Email extraction for ${contact.firstName} ${contact.lastName}:`, {
        searchType: searchResult.searchType,
        hasEmailData: !!extractedData.email,
        emailValue: extractedData.email,
        rawEmails: searchResult.data?.person?.emails,
        allApiResponses: searchResult.allApiResponses.length
      });

      // If using combination search and we have multiple API responses, merge the data
      if (searchResult.searchType === 'combination' && searchResult.allApiResponses.length > 1) {
        const contactData = extractContactData(searchResult.allApiResponses[0].response, 'contact');
        const personData = extractContactData(searchResult.allApiResponses[1].response, 'person');
        extractedData = mergeContactData(contactData, personData);

        console.log(`Merged data for ${contact.firstName} ${contact.lastName}:`, {
          contactEmail: contactData.email,
          personEmail: personData.email,
          finalEmail: extractedData.email
        });
      }

      const enriched: DataRecord = {
        ...contact,
        email: extractedData.email,
        phone: extractedData.phone,
        address: extractedData.address,
        enriched: true,
        searchType: searchResult.searchType,
        cost: searchResult.cost,
        identityScore: searchResult.data.identityScore,
        usedCombination: searchResult.usedCombination,
        allApiResponses: searchResult.allApiResponses, // Store all API responses made during the search
      };

      console.log('API Response Summary:');
      console.log('- Search Type:', searchResult.searchType);
      console.log('- Cost:', searchResult.cost);
      console.log('- Identity Score:', searchResult.data.identityScore);
      console.log('- Used Combination:', searchResult.usedCombination);
      console.log('- Total Execution Time:', searchResult.data.totalRequestExecutionTimeMs + 'ms');
      console.log('- Found Addresses:', searchResult.data.person?.addresses?.length || 0);
      console.log('- Found Phones:', searchResult.data.person?.phones?.length || searchResult.data.person?.phoneNumbers?.length || 0);
      console.log('- Found Emails:', searchResult.data.person?.emails?.length || 0);
      console.log('- Extracted Data:', extractedData);
      console.log('Enriched contact:', enriched);
      return enriched;
    } catch (error) {
      console.error('Error enriching contact:', error);
      return { ...contact, enriched: false };
    }
  };

  const handleEnrichmentStart = async (apiKey: string, searchType: SearchType) => {
    console.log(`Starting ${searchType} enrichment process with`, originalData.length, 'contacts');
    setIsEnriching(true);
    setProgress(0);
    setEnrichedData([]);

    toast({
      title: "Enrichment started",
      description: `Processing ${originalData.length} contacts using ${searchType} search...`,
    });

    try {
      const enriched: DataRecord[] = [];
      let totalCost = 0;
      let combinationUsed = 0;

      for (let i = 0; i < originalData.length; i++) {
        console.log(`Processing contact ${i + 1} of ${originalData.length}`);

        try {
          const enrichedContact = await enrichContact(originalData[i], apiKey, searchType);
          enriched.push(enrichedContact);
          setEnrichedData([...enriched]);

          // Track costs and combination usage
          if (enrichedContact.cost) {
            totalCost += enrichedContact.cost;
          }
          if (enrichedContact.usedCombination) {
            combinationUsed++;
          }

          const newProgress = ((i + 1) / originalData.length) * 100;
          setProgress(newProgress);

          // Show progress toast every 25%
          if (newProgress % 25 === 0) {
            toast({
              title: `${newProgress}% complete`,
              description: `Processed ${i + 1} of ${originalData.length} contacts`,
            });
          }
        } catch (error) {
          console.error('Error enriching contact:', error);
          // Continue with next contact even if one fails
          enriched.push({ ...originalData[i], enriched: false });
          setEnrichedData([...enriched]);

          // Show error toast for the first few failures to alert user
          if (i < 3) {
            toast({
              title: "Enrichment error",
              description: `Failed to enrich contact ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              variant: "destructive",
            });
          }
        }
      }

      const successfulEnrichments = enriched.filter(c => c.enriched).length;
      const costMessage = totalCost > 0 ? ` Total cost: $${totalCost.toFixed(2)}.` : '';
      const combinationMessage = combinationUsed > 0 ? ` ${combinationUsed} contacts used combination search.` : '';

      toast({
        title: "Enrichment completed",
        description: `Successfully enriched ${successfulEnrichments} of ${originalData.length} contacts.${costMessage}${combinationMessage}`,
      });
    } catch (error) {
      toast({
        title: "Enrichment failed",
        description: "An error occurred during the enrichment process.",
        variant: "destructive",
      });
    } finally {
      setIsEnriching(false);
    }
  };

  const handleEnrichmentStop = () => {
    setIsEnriching(false);
    toast({
      title: "Enrichment stopped",
      description: "The enrichment process has been stopped.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Contact Enrichment Tool
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your CSV file with contact information and enrich it with additional data using Endato/Enformion API
          </p>
        </div>

        {/* Upload Section */}
        <CSVUploader onDataParsed={handleDataParsed} />

        {/* Controls Section */}
        {originalData.length > 0 && (
          <EnrichmentControls
            data={originalData}
            enrichedData={enrichedData}
            onEnrichmentStart={handleEnrichmentStart}
            onEnrichmentStop={handleEnrichmentStop}
            isEnriching={isEnriching}
            progress={progress}
          />
        )}

        {/* Data Tables */}
        <div className="space-y-6">
          {originalData.length > 0 && (
            <DataTable
              data={originalData}
              title="Original Data"
            />
          )}

          {enrichedData.length > 0 && (
            <DataTable
              data={enrichedData}
              title="Enriched Data"
              isLoading={isEnriching}
            />
          )}
        </div>

        {/* Instructions */}
        {originalData.length === 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-card p-6 rounded-lg shadow-soft">
              <h3 className="text-lg font-semibold mb-3">How to use this tool:</h3>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">1</span>
                  Upload a CSV file with columns: first name, middle name, last name, city, state, trade, license #, status
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">2</span>
                  Enter your Endato/Enformion API key
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">3</span>
                  Click "Start Enrichment" to begin processing your contacts
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">4</span>
                  Download the enriched data as a new CSV file
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
