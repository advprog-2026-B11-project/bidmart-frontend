import { cn, formatDateTime } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import type { UserProfile } from "@/types/api";

interface SellerInfoCardProps {
  seller: UserProfile;
  className?: string;
}

export function SellerInfoCard({ seller, className }: SellerInfoCardProps) {
  const joinedDate = formatDateTime(seller.createdAt).split(",")[0];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Avatar src={seller.avatarUrl} name={seller.name} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{seller.name}</p>
        <p className="text-xs text-slate-400">Bergabung {joinedDate}</p>
      </div>
    </div>
  );
}
