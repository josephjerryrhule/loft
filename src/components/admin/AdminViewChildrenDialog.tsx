"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAdminUserChildren } from "@/app/actions/admin";
import { formatDistanceToNow } from "date-fns";
import { getAgeGroupLabel } from "@/lib/utils";

interface AdminViewChildrenDialogProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminViewChildrenDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: AdminViewChildrenDialogProps) {
  const [children, setChildren] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchChildren = async () => {
      try {
        setIsLoading(true);
        const data = await getAdminUserChildren(userId);
        if (mounted) {
          setChildren(data);
        }
      } catch (error) {
        console.error("Failed to fetch children:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    if (open) {
      fetchChildren();
    }

    return () => {
      mounted = false;
    };
  }, [open, userId]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white text-zinc-900 border-zinc-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-zinc-900">
            Children of {userName}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : children.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <User className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No children found for this user.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-start space-x-4 p-4 rounded-xl border border-zinc-200 bg-zinc-50/50"
                >
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                    <AvatarImage src={child.avatarUrl || ""} />
                    <AvatarFallback className="bg-purple-100 text-purple-700 font-medium">
                      {getInitials(child.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-zinc-900 truncate">
                        {child.name}
                      </h4>
                      <Badge variant="outline" className="bg-white">
                        {getAgeGroupLabel(child.ageGroup)}
                      </Badge>
                    </div>
                    <div className="mt-1 text-sm text-zinc-500 space-y-1">
                      {child.username && (
                        <p>
                          <span className="font-medium">Username:</span>{" "}
                          {child.username}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Added:</span>{" "}
                        {formatDistanceToNow(new Date(child.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                      
                      {/* Subscription Info */}
                      <div className="mt-2 pt-2 border-t border-zinc-200">
                        <p className="font-medium text-xs text-zinc-700 mb-1">Subscriptions</p>
                        {child.subscriptions && child.subscriptions.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {child.subscriptions.map((sub: any) => (
                              <Badge 
                                key={sub.id} 
                                variant={sub.status === "ACTIVE" ? "default" : "secondary"}
                                className={sub.status === "ACTIVE" ? "bg-green-100 text-green-800 hover:bg-green-100 border-none" : ""}
                              >
                                {sub.plan?.name || "Unknown Plan"} - {sub.status}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400">No active subscriptions</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end mt-4 pt-4 border-t border-zinc-100">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
