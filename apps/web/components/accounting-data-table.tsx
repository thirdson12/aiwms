'use client';

import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

export function AccountingDataTable({
  title,
  headers,
  rows,
  empty,
}: {
  title: string;
  headers: string[];
  rows: ReactNode[][];
  empty: string;
}) {
  return (
    <Card className="overflow-x-auto p-0">
      <div className="border-b border-border px-4 py-3 font-semibold">{title}</div>
      <table className="min-w-full text-sm">
        <thead className="border-b border-border bg-slate-50 text-left">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b border-border last:border-0">
              {row.map((cell, i) => (
                <td key={i} className="px-4 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="px-4 py-8 text-center text-muted">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}
