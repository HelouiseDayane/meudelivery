import { Checkbox } from '../ui/checkbox';

interface OrderActiveToggleProps {
  orderId: string;
  isActive: boolean;
  onToggle: (orderId: string, active: boolean) => void;
}

export const OrderActiveToggle = ({ orderId, isActive, onToggle }: OrderActiveToggleProps) => {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={`active-${orderId}`}
        checked={isActive}
        onCheckedChange={(checked) => onToggle(orderId, checked as boolean)}
        className="border-2 border-black !important"
      />
      <label
        htmlFor={`active-${orderId}`}
        className={`text-sm font-medium leading-none ${isActive ? 'text-green-500' : 'text-red-500'}`}
      >
        {isActive ? 'Ativo' : 'Inativo'}
      </label>
    </div>
  );
};