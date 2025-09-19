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
          <Badge variant="secondary" className="text-sm">
            {data.length} records
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold">First Name</TableHead>
                  <TableHead className="font-semibold">Middle Name</TableHead>
                  <TableHead className="font-semibold">Last Name</TableHead>
                  <TableHead className="font-semibold">City</TableHead>
                  <TableHead className="font-semibold">State</TableHead>
                  <TableHead className="font-semibold">Trade</TableHead>
                  <TableHead className="font-semibold">License #</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  {/* Show enriched columns if any data is enriched */}
                  {data.some(record => record.enriched) && (
                    <>
                      <TableHead className="font-semibold text-primary">Email</TableHead>
                      <TableHead className="font-semibold text-primary">Phone</TableHead>
                      <TableHead className="font-semibold text-primary">Address</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 8 }).map((_, cellIndex) => (
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
                        </>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};