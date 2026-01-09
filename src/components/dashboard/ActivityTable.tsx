import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Activity {
  id: string;
  action: string;
  description: string;
  timestamp: Date;
  status?: string;
}

interface ActivityTableProps {
  activities: Activity[];
}

export function ActivityTable({ activities }: ActivityTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                No recent activities.
              </TableCell>
            </TableRow>
          ) : (
            activities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell className="font-medium">{activity.action}</TableCell>
                <TableCell>{activity.description}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>
                  {activity.status && (
                    <Badge 
                      variant={
                        activity.status === "COMPLETED" || activity.status === "PAID" || activity.status === "ACTIVE" ? "default" : 
                        activity.status === "APPROVED" ? "secondary" : 
                        activity.status === "PENDING" ? "outline" : 
                        "secondary"
                      }
                    >
                      {activity.status}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
