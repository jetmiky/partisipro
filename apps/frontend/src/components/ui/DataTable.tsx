'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
} from 'lucide-react';

export interface Column<T = Record<string, unknown>> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface DataTableProps<T = Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  filterable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  className?: string;
}

const DataTable = <T extends Record<string, unknown>>({
  columns,
  data,
  searchable = true,
  filterable = false,
  pagination = true,
  pageSize = 10,
  className = '',
}: DataTableProps<T>) => {
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;

    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
    if (bValue == null) return sortDirection === 'asc' ? 1 : -1;

    // Convert to strings for comparison if needed
    const aStr = String(aValue);
    const bStr = String(bValue);

    if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
    if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Filter data
  const filteredData = sortedData.filter(row =>
    Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Paginate data
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = pagination
    ? filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredData;

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div
      className={`glass-table rounded-xl border border-primary-200/30 ${className}`}
    >
      {/* Header with Search and Filter */}
      {(searchable || filterable) && (
        <div className="p-4 border-b border-primary-200/30 flex items-center justify-between">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          )}

          {filterable && (
            <button className="flex items-center gap-2 px-4 py-2 glass-button rounded-lg hover:bg-primary-50/50 transition-colors">
              <Filter className="w-4 h-4 text-primary-600" />
              <span className="text-primary-700">Filter</span>
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary-200/30">
              {columns.map(column => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-primary-600 uppercase tracking-wider ${
                    column.sortable
                      ? 'cursor-pointer hover:bg-primary-50/30'
                      : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-200/30">
            {paginatedData.map((row, index) => (
              <tr
                key={index}
                className="hover:bg-primary-50/30 transition-colors"
              >
                {columns.map(column => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-primary-900"
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : String(row[column.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {paginatedData.length === 0 && (
        <div className="text-center py-12">
          <p className="text-primary-500">No data found</p>
        </div>
      )}

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-primary-200/30 flex items-center justify-between">
          <div className="text-sm text-primary-500">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredData.length)} of{' '}
            {filteredData.length} results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg glass-button hover:bg-primary-50/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 text-primary-600" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  currentPage === page
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                    : 'text-primary-500 hover:bg-primary-50/50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg glass-button hover:bg-primary-50/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 text-primary-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
