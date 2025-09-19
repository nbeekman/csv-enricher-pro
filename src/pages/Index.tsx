import { useState } from 'react';
import { CSVUploader } from '@/components/CSVUploader';
import { DataTable } from '@/components/DataTable';
import { EnrichmentControls } from '@/components/EnrichmentControls';
import { useToast } from '@/hooks/use-toast';

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

  const mockEnrichContact = async (contact: DataRecord): Promise<DataRecord> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Mock enriched data - in real implementation, this would call Endato/Enformion API
    const enriched: DataRecord = {
      ...contact,
      email: `${contact.firstName.toLowerCase()}.${contact.lastName.toLowerCase()}@example.com`,
      phone: `(555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      address: `${Math.floor(Math.random() * 9999) + 1} Main St, ${contact.city}, ${contact.state}`,
      enriched: true,
    };
    
    return enriched;
  };

  const handleEnrichmentStart = async (apiKey: string) => {
    setIsEnriching(true);
    setProgress(0);
    setEnrichedData([]);

    toast({
      title: "Enrichment started",
      description: `Processing ${originalData.length} contacts...`,
    });

    try {
      const enriched: DataRecord[] = [];
      
      for (let i = 0; i < originalData.length; i++) {
        if (!isEnriching) break; // Check if user stopped the process
        
        try {
          // In real implementation, replace mockEnrichContact with actual API call
          const enrichedContact = await mockEnrichContact(originalData[i]);
          enriched.push(enrichedContact);
          setEnrichedData([...enriched]);
          
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
        }
      }

      toast({
        title: "Enrichment completed",
        description: `Successfully enriched ${enriched.filter(c => c.enriched).length} of ${originalData.length} contacts`,
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