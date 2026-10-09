import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { ChainStatus } from '@/types';

const styles: Record<ChainStatus, string> = {
  CONFIRMED: 'bg-healthcare-green/10 text-healthcare-green border-healthcare-green/20',
  PENDING: 'bg-healthcare-orange/10 text-healthcare-orange border-healthcare-orange/20',
  FAILED: 'bg-destructive/10 text-destructive border-destructive/20',
};
const labels: Record<ChainStatus, string> = { CONFIRMED: 'Confirmed', PENDING: 'Pending', FAILED: 'Not anchored' };
const icons = { CONFIRMED: CheckCircle, PENDING: Clock, FAILED: XCircle };

export const ChainBadge = ({ status }: { status: ChainStatus }) => {
  const Icon = icons[status];
  return (
    <Badge variant="outline" className={`gap-1 ${styles[status]}`}>
      <Icon className="w-3 h-3" />
      {labels[status]}
    </Badge>
  );
};
