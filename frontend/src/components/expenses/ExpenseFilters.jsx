import SelectField from '../common/SelectField';
import TextField from '../common/TextField';
import { PAYMENT_METHODS } from './paymentMethods';

export default function ExpenseFilters({
  search,
  category,
  from,
  to,
  paymentMethod,
  sort,
  categories,
  onSearchChange,
  onCategoryChange,
  onFromChange,
  onToChange,
  onPaymentMethodChange,
  onSortChange,
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <TextField
        id="expense-search"
        label="Search"
        placeholder="Description or notes"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <SelectField
        id="expense-filter-category"
        label="Category"
        value={category}
        onChange={(event) => onCategoryChange(event.target.value)}
      >
        <option value="">All categories</option>
        {categories.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </SelectField>
      <SelectField
        id="expense-filter-payment"
        label="Payment method"
        value={paymentMethod}
        onChange={(event) => onPaymentMethodChange(event.target.value)}
      >
        <option value="">All methods</option>
        {PAYMENT_METHODS.map((method) => (
          <option key={method.value} value={method.value}>
            {method.label}
          </option>
        ))}
      </SelectField>
      <TextField
        id="expense-filter-from"
        label="From"
        type="date"
        value={from}
        onChange={(event) => onFromChange(event.target.value)}
      />
      <TextField
        id="expense-filter-to"
        label="To"
        type="date"
        value={to}
        onChange={(event) => onToChange(event.target.value)}
      />
      <SelectField
        id="expense-sort"
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
