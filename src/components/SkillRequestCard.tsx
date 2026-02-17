import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, Clock, User, AlertCircle } from "lucide-react";
import { SkillRequest } from "@/lib/types";
import { Link } from "react-router-dom";

interface SkillRequestCardProps {
  request: SkillRequest;
}

const urgencyColors = {
  low: 'bg-green-500/20 text-green-500 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  high: 'bg-red-500/20 text-red-500 border-red-500/30',
};

export function SkillRequestCard({ request }: SkillRequestCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{request.title}</CardTitle>
          <Badge className={urgencyColors[request.urgency]}>
            {request.urgency}
          </Badge>
        </div>
        {request.category && (
          <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
            {request.category}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {request.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {request.description}
          </p>
        )}
        <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>{request.userName || request.userEmail?.split('@')[0] || 'User'}</span>
          </div>
          {request.preferredRateMax && (
            <div className="flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" />
              <span>Max {request.preferredRateMax}/hr</span>
            </div>
          )}
          {request.budget && (
            <div className="flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" />
              <span>Budget: {request.budget}</span>
            </div>
          )}
        </div>
        <Link to={`/profile/${request.userId}`}>
          <Button variant="outline" className="w-full">
            View Profile & Propose
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
