/**
 * Failure Reason Select Component
 * Sprint: Data Input Refactor
 * 
 * Dropdown for selecting why critical action was not completed
 * Required when critical_action_completed is FALSE
 */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Clock, Brain, Calendar, HelpCircle } from 'lucide-react';

export type FailureReason = 'Procrastination' | 'Fatigue' | 'Planning' | 'External' | 'Forgot';

interface FailureReasonSelectProps {
  value: FailureReason | null;
  onChange: (value: FailureReason) => void;
  disabled?: boolean;
}

const reasons: { value: FailureReason; label: string; icon: React.ReactNode }[] = [
  { value: 'Procrastination', label: 'Procrastinação', icon: <Clock className="h-4 w-4" /> },
  { value: 'Fatigue', label: 'Fadiga / Cansaço', icon: <AlertTriangle className="h-4 w-4" /> },
  { value: 'Planning', label: 'Falha no planejamento', icon: <Calendar className="h-4 w-4" /> },
  { value: 'External', label: 'Fator externo', icon: <HelpCircle className="h-4 w-4" /> },
  { value: 'Forgot', label: 'Esqueci', icon: <Brain className="h-4 w-4" /> },
];

export function FailureReasonSelect({ value, onChange, disabled }: FailureReasonSelectProps) {
  return (
    <Select 
      value={value || undefined} 
      onValueChange={(v) => onChange(v as FailureReason)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Qual foi o sabotador real?" />
      </SelectTrigger>
      <SelectContent>
        {reasons.map((reason) => (
          <SelectItem key={reason.value} value={reason.value}>
            <div className="flex items-center gap-2">
              {reason.icon}
              {reason.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
