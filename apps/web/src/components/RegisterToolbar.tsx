"use client";

type RegisterToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;

  status?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: string[];

  searchPlaceholder?: string;
  filterPlaceholder?: string;

  onExport: () => void;
};

export function RegisterToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  statusOptions = [],
  searchPlaceholder = "Search customer, mobile, GSTIN, category...",
  filterPlaceholder = "All statuses",
  onExport,
}: RegisterToolbarProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-3 md:flex-row">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="input-field md:max-w-md"
        />

        {onStatusChange && (
          <select
            value={status ?? ""}
            onChange={(event) => onStatusChange(event.target.value)}
            className="select-field md:max-w-xs"
          >
            <option value="">{filterPlaceholder}</option>

            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}
      </div>

      <button type="button" onClick={onExport} className="btn-secondary">
        Export CSV
      </button>
    </div>
  );
}