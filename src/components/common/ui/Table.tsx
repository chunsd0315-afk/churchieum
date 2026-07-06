import React from 'react';
import { Loading } from './Loading';
import { EmptyState } from './EmptyState';
import { Inbox } from 'lucide-react';

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T, index: number) => void;
  keyExtractor?: (row: T, index: number) => string;
  className?: string;
}

export function Table<T extends object>({
  columns,
  data,
  loading = false,
  emptyTitle = '데이터가 없습니다',
  emptyDescription,
  onRowClick,
  keyExtractor,
  className = '',
}: TableProps<T>) {
  const alignClass = (align?: 'left' | 'center' | 'right') =>
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

  return (
    <div className={`w-full overflow-auto rounded-card border border-gray-200 bg-white shadow-card-md ${className}`}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {columns.map(col => (
              <th
                key={String(col.key)}
                style={col.width ? { width: col.width } : undefined}
                className={`px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap ${alignClass(col.align)}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-16">
                <Loading size="md" />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState
                  icon={<Inbox size={28} />}
                  title={emptyTitle}
                  description={emptyDescription}
                />
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => {
              const key = keyExtractor ? keyExtractor(row, rowIdx) : String(rowIdx);
              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row, rowIdx) : undefined}
                  className={[
                    'border-b border-gray-50 last:border-0',
                    onRowClick
                      ? 'cursor-pointer hover:bg-gray-50 transition-colors duration-[var(--duration-fast)]'
                      : '',
                  ].join(' ')}
                >
                  {columns.map(col => {
                    const rawVal = row[col.key as keyof T];
                    const cell = col.render ? col.render(rawVal, row, rowIdx) : String(rawVal ?? '');
                    return (
                      <td
                        key={String(col.key)}
                        className={`px-4 py-3.5 text-gray-700 ${alignClass(col.align)}`}
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
