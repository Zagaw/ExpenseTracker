import SelectField from '../common/SelectField';
import TextField from '../common/TextField';

export default function IncomeFilters({
  search,
  from,
  to,
  sort,
  onSearchChange,
  onFromChange,
  onToChange,
  onSortChange,
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <TextField
        id="income-search"
        label="Search"
        placeholder="Source or description"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <TextField
        id="income-filter-from"
        label="From"
        type="date"
        value={from}
        onChange={(event) => onFromChange(event.target.value)}
      />
      <TextField
        id="income-filter-to"
        label="To"
        type="date"
        value={to}
        onChange={(event) => onToChange(event.target.value)}
      />
      <SelectField
        id="income-sort"
        label="Sort"
        value={sort}
        onChange={(event) => onSortChange(event.target.value)}
      >
        <option value="date_desc">Newest first</option>
        <option value="date_asc">Oldest first</option>
        <option value="amount_desc">Highest amount</option>
        <option value="amount_asc">Lowest amount</option>
      </SelectField>
    </div>
  );
}
