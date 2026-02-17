import { Skill } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Coins, Clock, User } from "lucide-react";

const complexityColors: Record<string, string> = {
  simple: "bg-success/15 text-success border-success/30",
  moderate: "bg-warning/15 text-warning border-warning/30",
  complex: "bg-destructive/15 text-destructive border-destructive/30",
};

interface SkillCardProps {
  skill: Skill;
  onRequestLearn?: (skill: Skill) => void;
  onViewDetails?: (skill: Skill) => void;
}

export function SkillCard({ skill, onRequestLearn, onViewDetails }: SkillCardProps) {
  return (
    <Card className="card-hover flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="label-uppercase mb-1">{skill.category}</p>
            <h3 className="truncate text-lg font-semibold leading-tight">{skill.title}</h3>
          </div>
          <Badge variant="outline" className={complexityColors[skill.complexity]}>
            {skill.complexity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{skill.description}</p>
        <div className="flex items-center gap-4 text-sm">
          <Link to={`/profile/${skill.userId}`} className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <User className="h-3.5 w-3.5" />
            {skill.teacherName}
          </Link>
          <Badge variant="secondary" className="text-xs">
            {skill.teacherType}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-1.5 font-semibold">
          <Coins className="h-4 w-4 text-primary" />
          <span>{skill.ratePerHour}</span>
          <span className="text-xs text-muted-foreground font-normal">/hr</span>
        </div>
        <div className="flex gap-2">
          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={() => onViewDetails(skill)}>
              Details
            </Button>
          )}
          {onRequestLearn && (
            <Button size="sm" onClick={() => onRequestLearn(skill)}>
              Request
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
