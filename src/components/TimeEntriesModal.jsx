import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import api from '../api/client';

function TimeEntriesModal({ user, onClose }) {
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  const { data: report, isLoading } = useQuery({
    queryKey: ['time-entries', user.id, dateRange.from, dateRange.to],
    queryFn: () => api.getTimeEntries(user.id, dateRange.from, dateRange.to),
  });

  const formatTime = (dateTime) => {
    if (!dateTime) return '-';
    return format(new Date(dateTime), 'HH:mm');
  };

  const formatMinutes = (minutes) => {
    if (!minutes) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Zeiten: {user.displayName}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>

          <div className="mt-4 flex gap-4">
            <div>
              <label className="block text-sm text-gray-600">Von</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="border rounded px-3 py-1"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Bis</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="border rounded px-3 py-1"
              />
            </div>
          </div>
        </div>

        <div className="p-6 overflow-auto max-h-[50vh]">
          {isLoading ? (
            <div className="text-center py-4">Laden...</div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kommt</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Geht</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pause</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Netto</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Auto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {report?.entries?.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-2 text-sm">{entry.workDate}</td>
                      <td className="px-4 py-2 text-sm">{formatTime(entry.punchIn)}</td>
                      <td className="px-4 py-2 text-sm">{formatTime(entry.punchOut)}</td>
                      <td className="px-4 py-2 text-sm">{entry.breakMinutes}m</td>
                      <td className="px-4 py-2 text-sm">{formatMinutes(entry.netMinutes)}</td>
                      <td className="px-4 py-2 text-sm">
                        {entry.autoClosedOut && <span className="text-orange-500">⚠</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 p-4 bg-gray-50 rounded flex gap-8">
                <div>
                  <span className="text-sm text-gray-600">Gesamt:</span>
                  <span className="ml-2 font-semibold">{formatMinutes(report?.totalNetMinutes)}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Tage:</span>
                  <span className="ml-2 font-semibold">{report?.totalDays}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TimeEntriesModal;