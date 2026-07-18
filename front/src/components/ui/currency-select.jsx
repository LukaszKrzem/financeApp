import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function CurrencySelect({
  value,
  onChange,
  currencies,
  disabled,
  id = 'currency',
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id}>
        <SelectValue placeholder="Currency" />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((cur) => (
          <SelectItem key={cur.id_currency} value={cur.id_currency.toString()}>
            {cur.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
