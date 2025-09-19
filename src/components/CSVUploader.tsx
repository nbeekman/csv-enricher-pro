import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';

interface CSVRecord {
  firstName: string;
  middleName: string;
  lastName: string;
  city: string;
  state: string;
  trade: string;
  licenseNumber: string;
  status: string;
}

interface CSVUploaderProps {
  onDataParsed: (data: CSVRecord[]) => void;
}

export const CSVUploader = ({ onDataParsed }: CSVUploaderProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processCSV = useCallback((file: File) => {
    setIsProcessing(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data.map((row: any) => ({
            firstName: row['first name'] || row['firstName'] || row['First Name'] || '',
            middleName: row['middle name'] || row['middleName'] || row['Middle Name'] || '',
            lastName: row['last name'] || row['lastName'] || row['Last Name'] || '',
            city: row['city'] || row['City'] || '',
            state: row['state'] || row['State'] || '',
            trade: row['trade'] || row['Trade'] || '',
            licenseNumber: row['license #'] || row['licenseNumber'] || row['License #'] || row['License Number'] || '',
            status: row['status'] || row['Status'] || '',
          }));

          const validData = data.filter(record => 
            record.firstName || record.lastName || record.city
          );

          if (validData.length === 0) {
            toast({
              title: "No valid data found",
              description: "Please ensure your CSV has the required columns: first name, last name, city, etc.",
              variant: "destructive",
            });
            return;
          }

          setUploadedFile(file);
          onDataParsed(validData);
          
          toast({
            title: "CSV uploaded successfully",
            description: `Processed ${validData.length} records`,
          });
        } catch (error) {
          toast({
            title: "Error processing CSV",
            description: "Please check your file format and try again.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      },
      error: (error) => {
        toast({
          title: "Error reading file",
          description: error.message,
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    });
  }, [onDataParsed, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (!csvFile) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    processCSV(csvFile);
  }, [processCSV, toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processCSV(file);
    }
  }, [processCSV]);

  const removeFile = useCallback(() => {
    setUploadedFile(null);
    onDataParsed([]);
  }, [onDataParsed]);

  return (
    <Card className="shadow-soft">
      <CardContent className="p-6">
        {!uploadedFile ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
              isDragOver
                ? 'border-primary bg-primary/5 scale-[1.02]'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop your CSV file here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Expected columns: first name, middle name, last name, city, state, trade, license #, status
            </p>
            <div className="space-y-2">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
                disabled={isProcessing}
              />
              <Button asChild disabled={isProcessing}>
                <label htmlFor="csv-upload" className="cursor-pointer">
                  {isProcessing ? 'Processing...' : 'Choose File'}
                </label>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-primary" />
              <div>
                <p className="font-medium">{uploadedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={removeFile}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};