import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Download, Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';

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

interface EnrichmentControlsProps {
  data: DataRecord[];
  enrichedData: DataRecord[];
  onEnrichmentStart: (apiKey: string) => void;
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

    onEnrichmentStart(apiKey);
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

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Enrichment Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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