import { cn } from "@/lib/utils";
import {
  Coins,
  Users,
  Wallet,
  BookOpen,
  Zap,
  Star,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    title: "Credit System",
    description:
      "Earn credits by teaching, spend them to learn. Students get bonus rates.",
    icon: <Coins className="h-6 w-6" />,
  },
  {
    title: "Peer Matching",
    description:
      "Find the perfect teacher or student based on skills, rates, and availability.",
    icon: <Users className="h-6 w-6" />,
  },
  {
    title: "Skill Wallet",
    description:
      "Track your credits, transactions, and badges all in one place.",
    icon: <Wallet className="h-6 w-6" />,
  },
  {
    title: "Teach & Learn",
    description:
      "List your skills and set your rate. Spend credits to learn from peers.",
    icon: <BookOpen className="h-6 w-6" />,
  },
  {
    title: "Earn as you teach",
    description:
      "Get credits for every hour you teach. Use them to learn new skills.",
    icon: <Zap className="h-6 w-6" />,
  },
  {
    title: "Reviews & trust",
    description:
      "Build your reputation with reviews. Find trusted teachers and students.",
    icon: <Star className="h-6 w-6" />,
  },
  {
    title: "Direct messaging",
    description:
      "Coordinate sessions and swap skills through in-app messaging.",
    icon: <MessageCircle className="h-6 w-6" />,
  },
  {
    title: "Secure & simple",
    description:
      "Safe credit-based exchange. No cash needed—just skills and time.",
    icon: <ShieldCheck className="h-6 w-6" />,
  },
];

export function FeaturesSectionWithHoverEffects() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-10 max-w-6xl mx-auto">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature border-border",
        (index === 0 || index === 4) && "lg:border-l border-border",
        index < 4 && "lg:border-b border-border"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-muted to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-muted to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-muted-foreground">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-muted-foreground/30 group-hover/feature:bg-primary transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block">
          {title}
        </span>
      </div>
      <p className="text-sm text-muted-foreground max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};
