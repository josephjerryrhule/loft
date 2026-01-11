import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  className?: string;
}

export function LoadingSpinner({ fullScreen = false, className }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'min-h-[400px]'} ${className || ''}`}>
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
