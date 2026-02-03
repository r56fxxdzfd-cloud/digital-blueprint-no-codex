/**
 * Action Category Select Component
 * Sprint: Data Input Refactor
 * 
 * Dropdown for selecting critical action category
 * Categories: Work, Health, Relationships, Spiritual
 */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Briefcase, Heart, Users, Sparkles } from 'lucide-react';

export type ActionCategory = 'Work' | 'Health' | 'Relationships' | 'Spiritual';

interface ActionCategorySelectProps {
  value: ActionCategory | null;
  onChange: (value: ActionCategory) => void;
  disabled?: boolean;
}

const categories: { value: ActionCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'Work', label: 'Trabalho', icon: <Briefcase className="h-4 w-4" /> },
  { value: 'Health', label: 'Saúde', icon: <Heart className="h-4 w-4" /> },
  { value: 'Relationships', label: 'Relações', icon: <Users className="h-4 w-4" /> },
  { value: 'Spiritual', label: 'Espiritual', icon: <Sparkles className="h-4 w-4" /> },
];

export function ActionCategorySelect({ value, onChange, disabled }: ActionCategorySelectProps) {
  return (
    <Select 
      value={value || undefined} 
      onValueChange={(v) => onChange(v as ActionCategory)}
      disabled={disabled}
    >
      <SelectTrigger className="w-36">
        <SelectValue placeholder="Categoria" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((cat) => (
          <SelectItem key={cat.value} value={cat.value}>
            <div className="flex items-center gap-2">
              {cat.icon}
              {cat.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
