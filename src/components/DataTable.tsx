import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchType } from "@/services/enformionService";

interface DataRecord {
  firstName: string;
  middleName: string;
  lastName: string;
  city: string;
  state: string;
  trade: string;
  licenseNumber: string;
  status: string;
  // Enriched data fields
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

interface DataTableProps {
  data: DataRecord[];
  title: string;
  isLoading?: boolean;
}

export const DataTable = ({ data, title, isLoading }: DataTableProps) => {
  if (data.length === 0 && !isLoading) {
    return null;
  }

  return (
    <Card className="shadow-soft animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {data.some(record => record.enriched) && (
              <Badge variant="outline" className="text-xs">
                ← Scroll horizontally →
              </Badge>
            )}
            <Badge variant="secondary" className="text-sm">
              {data.length} records
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <div className="max-h-96 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="min-w-max">
              <Table className="w-full">
              <TableHeader className="sticky top-0 bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold min-w-[100px]">First Name</TableHead>
                  <TableHead className="font-semibold min-w-[100px]">Middle Name</TableHead>
                  <TableHead className="font-semibold min-w-[100px]">Last Name</TableHead>
                  <TableHead className="font-semibold min-w-[120px]">City</TableHead>
                  <TableHead className="font-semibold min-w-[80px]">State</TableHead>
                  <TableHead className="font-semibold min-w-[120px]">Trade</TableHead>
                  <TableHead className="font-semibold min-w-[100px]">License #</TableHead>
                  <TableHead className="font-semibold min-w-[80px]">Status</TableHead>
                  {/* Show enriched columns if any data is enriched */}
                  {data.some(record => record.enriched) && (
                    <>
                      <TableHead className="font-semibold text-primary min-w-[200px]">Email</TableHead>
                      <TableHead className="font-semibold text-primary min-w-[120px]">Phone</TableHead>
                      <TableHead className="font-semibold text-primary min-w-[250px]">Address</TableHead>
                      <TableHead className="font-semibold text-primary min-w-[120px]">Search Type</TableHead>
                      <TableHead className="font-semibold text-primary min-w-[80px]">Cost</TableHead>
                      <TableHead className="font-semibold text-primary min-w-[100px]">Identity Score</TableHead>
                      <TableHead className="font-semibold text-primary min-w-[80px]">API Calls</TableHead>
                      <TableHead className="font-semibold text-primary min-w-[100px]">Combination</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: data.some(record => record.enriched) ? 16 : 8 }).map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <div className="h-4 bg-muted animate-pulse rounded" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  data.map((record, index) => (
                    <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{record.firstName}</TableCell>
                      <TableCell>{record.middleName}</TableCell>
                      <TableCell className="font-medium">{record.lastName}</TableCell>
                      <TableCell>{record.city}</TableCell>
                      <TableCell>{record.state}</TableCell>
                      <TableCell>{record.trade}</TableCell>
                      <TableCell>{record.licenseNumber}</TableCell>
                      <TableCell>
                        {record.status && (
                          <Badge 
                            variant={record.status.toLowerCase() === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {record.status}
                          </Badge>
                        )}
                      </TableCell>
                      {data.some(r => r.enriched) && (
                        <>
                          <TableCell className="text-primary font-medium">
                            {record.email || '-'}
                          </TableCell>
                          <TableCell className="text-primary font-medium">
                            {record.phone || '-'}
                          </TableCell>
                          <TableCell className="text-primary font-medium">
                            {record.address || '-'}
                          </TableCell>
                          <TableCell>
                            {record.searchType && (
                              <Badge variant="outline" className="text-xs">
                                {record.searchType === 'contact' ? '📧 Contact' : 
                                 record.searchType === 'person' ? '👤 Person' : 
                                 '🧠 Combination'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-green-600 font-medium">
                            {record.cost ? `$${record.cost.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell>
                            {record.identityScore !== undefined ? (
                              <div className="flex items-center gap-1">
                                <span className={`font-medium ${
                                  record.identityScore >= 100 ? 'text-green-600' : 
                                  record.identityScore >= 80 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {record.identityScore}
                                </span>
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {record.allApiResponses ? (
                              <Badge variant="outline" className="text-xs">
                                {record.allApiResponses.length}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {record.usedCombination ? (
                              <Badge variant="default" className="text-xs bg-blue-600">
                                Yes
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                No
                              </Badge>
                            )}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};