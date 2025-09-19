import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, Play, Pause, RotateCcw, Settings, DollarSign, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { SearchType } from '@/services/enformionService';

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
  allApiResponses?: Array<{
    response: any;
    searchType: 'contact' | 'person';
    timestamp: string;
    cost: number;
  }>; // Store all API responses made during the search
}

interface EnrichmentControlsProps {
  data: DataRecord[];
  enrichedData: DataRecord[];
  onEnrichmentStart: (apiKey: string, searchType: SearchType) => void;
  onEnrichmentStop: () => void;
  isEnriching: boolean;
  progress: number;
}

export const EnrichmentControls = ({
  data,
  enrichedData,
  onEnrichmentStart,
  onEnrichmentStop,
  isEnriching,
  progress,
}: EnrichmentControlsProps) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [searchType, setSearchType] = useState<SearchType>('contact');
  const { toast } = useToast();

  const handleStartEnrichment = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key required",
        description: "Please enter your Endato/Enformion API key to start enrichment.",
        variant: "destructive",
      });
      return;
    }

    if (data.length === 0) {
      toast({
        title: "No data to enrich",
        description: "Please upload a CSV file first.",
        variant: "destructive",
      });
      return;
    }

    onEnrichmentStart(apiKey, searchType);
  };

  const getSearchTypeInfo = (type: SearchType) => {
    switch (type) {
      case 'contact':
        return {
          name: 'Contact Enrichment',
          description: 'Basic contact enrichment with email, phone, and address data',
          cost: '$0.10 per match',
          icon: '📧'
        };
      case 'person':
        return {
          name: 'Person Search',
          description: 'Comprehensive person search with detailed information',
          cost: '$0.25 per match',
          icon: '👤'
        };
      case 'combination':
        return {
          name: 'Smart Combination',
          description: 'Tries Contact Enrichment first, then Person Search if identity score < 100',
          cost: '$0.10-$0.35 per match',
          icon: '🧠'
        };
      default:
        return {
          name: 'Unknown',
          description: '',
          cost: '',
          icon: '❓'
        };
    }
  };

  const calculateEstimatedCost = () => {
    const baseCost = searchType === 'contact' ? 0.10 : searchType === 'person' ? 0.25 : 0.10;
    const maxCost = searchType === 'combination' ? 0.35 : baseCost;
    const totalRecords = data.length;
    
    return {
      min: (baseCost * totalRecords).toFixed(2),
      max: (maxCost * totalRecords).toFixed(2),
      isRange: searchType === 'combination'
    };
  };

  const downloadCSV = () => {
    if (enrichedData.length === 0) {
      toast({
        title: "No data to download",
        description: "Please complete the enrichment process first.",
        variant: "destructive",
      });
      return;
    }

    const csv = Papa.unparse(enrichedData, {
      header: true,
      columns: [
        'firstName',
        'middleName', 
        'lastName',
        'city',
        'state',
        'trade',
        'licenseNumber',
        'status',
        'email',
        'phone',
        'address'
      ]
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `enriched_contacts_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "CSV downloaded",
      description: "Your enriched contact data has been downloaded successfully.",
    });
  };

  const downloadJSON = () => {
    if (enrichedData.length === 0) {
      toast({
        title: "No data to download",
        description: "Please complete the enrichment process first.",
        variant: "destructive",
      });
      return;
    }

    // Filter only enriched records that have API responses
    const recordsWithJson = enrichedData.filter(record => record.enriched && record.allApiResponses && record.allApiResponses.length > 0);
    
    if (recordsWithJson.length === 0) {
      toast({
        title: "No JSON data available",
        description: "No enriched records with API responses found.",
        variant: "destructive",
      });
      return;
    }

    // Create a combined JSON structure with metadata
    const combinedJson = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        totalRecords: enrichedData.length,
        enrichedRecords: recordsWithJson.length,
        searchType: enrichedData[0]?.searchType || 'unknown',
        totalCost: enrichedData.reduce((sum, record) => sum + (record.cost || 0), 0).toFixed(2)
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
          searchType: record.searchType,
          cost: record.cost,
          identityScore: record.identityScore,
          usedCombination: record.usedCombination
        },
        allApiResponses: record.allApiResponses
      }))
    };

    const jsonString = JSON.stringify(combinedJson, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `enriched_contacts_raw_data_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const totalApiCalls = recordsWithJson.reduce((sum, record) => sum + (record.allApiResponses?.length || 0), 0);
    toast({
      title: "JSON downloaded",
      description: `Complete API response data for ${recordsWithJson.length} contacts (${totalApiCalls} total API calls) has been downloaded successfully.`,
    });
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Enrichment Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Type Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Search Type</Label>
          <RadioGroup
            value={searchType}
            onValueChange={(value) => setSearchType(value as SearchType)}
            disabled={isEnriching}
            className="space-y-3"
          >
            {(['contact', 'person', 'combination'] as SearchType[]).map((type) => {
              const info = getSearchTypeInfo(type);
              return (
                <div key={type} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={type} id={type} className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor={type} className="flex items-center gap-2 cursor-pointer">
                      <span className="text-lg">{info.icon}</span>
                      <span className="font-medium">{info.name}</span>
                      <Badge variant="outline" className="ml-auto">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {info.cost}
                      </Badge>
                    </Label>
                    <p className="text-sm text-muted-foreground">{info.description}</p>
                    {type === 'combination' && (
                      <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        <Info className="w-3 h-3" />
                        <span>May cost more if Person Search is needed</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        {/* API Key Input */}
        <div className="space-y-2">
          <Label htmlFor="api-key">Endato/Enformion API Key</Label>
          <p className="text-sm text-muted-foreground">
            Format: profileName:password (e.g., "myProfile:myPassword")
          </p>
          <p className="text-xs text-muted-foreground">
            If you're getting authentication errors, please verify your credentials are correct and have the proper permissions for the Contact Enrich API.
          </p>
          <p className="text-xs text-muted-foreground">
            Note: The API requires both first and last names to be present for each contact. Contacts missing either name will be skipped.
          </p>
          <div className="flex gap-2">
            <Input
              id="api-key"
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="profileName:password"
              disabled={isEnriching}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApiKey(!showApiKey)}
              disabled={isEnriching}
            >
              {showApiKey ? "Hide" : "Show"}
            </Button>
          </div>
        </div>

        {/* Status and Progress */}
        {data.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{data.length} records loaded</Badge>
                {enrichedData.length > 0 && (
                  <Badge variant="default">{enrichedData.length} enriched</Badge>
                )}
              </div>
            </div>

            {/* Estimated Cost */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Estimated Cost:</span>
                </div>
                <div className="text-right">
                  {(() => {
                    const cost = calculateEstimatedCost();
                    return (
                      <span className="font-semibold text-green-600">
                        ${cost.isRange ? `${cost.min} - ${cost.max}` : cost.min}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on {data.length} records × {getSearchTypeInfo(searchType).cost}
              </p>
            </div>

            {isEnriching && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Enriching contacts...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isEnriching ? (
            <Button 
              onClick={handleStartEnrichment}
              disabled={data.length === 0 || !apiKey.trim()}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start Enrichment
            </Button>
          ) : (
            <Button 
              onClick={onEnrichmentStop}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Pause className="w-4 h-4" />
              Stop
            </Button>
          )}

          <Button
            onClick={downloadCSV}
            variant="outline"
            disabled={enrichedData.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </Button>

          <Button
            onClick={downloadJSON}
            variant="outline"
            disabled={enrichedData.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download JSON
          </Button>

          {enrichedData.length > 0 && !isEnriching && (
            <Button
              onClick={() => window.location.reload()}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};