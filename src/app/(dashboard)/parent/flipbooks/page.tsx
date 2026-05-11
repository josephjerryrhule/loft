import Link from "next/link";
import { Baby, BookOpenCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ParentFlipbooksPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5 text-primary" />
            Child reading access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Parent accounts manage children and monitor progress. Flipbooks are opened from each
            child profile so subscriptions and reading progress stay tied to the child.
          </p>
          <Link href="/parent/children">
            <Button>
              <Baby className="mr-2 h-4 w-4" />
              Manage Children
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
