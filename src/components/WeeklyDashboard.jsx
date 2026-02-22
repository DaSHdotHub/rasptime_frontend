import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, addWeeks, subWeeks, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '../api/client';

function WeeklyDashboard() {
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekEnd = addDays(weekStart, 4);
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  const { data: users, isLoading } = useQuery({
    queryKey: ['weekly-overview', format(weekStart, 'yyyy-MM-dd')],
    queryFn: () => api.getWeeklyOverview(format(weekStart, 'yyyy-MM-dd')),
  });

  const formatHours = (minutes) => {
    if (!minutes || minutes === 0) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDayHeader = (date) => {
    const dayName = format(date, 'EEEEEE', { locale: de });
    const dayNum = format(date, 'd');
    return `${dayName} ${dayNum}`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setWeekStart(subWeeks(weekStart, 1))}
            className="p-2 hover:bg-gray-200 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
            className="p-2 hover:bg-gray-200 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="flex items-center gap-2 text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">
              {format(weekStart, 'd', { locale: de })} - {format(weekEnd, 'd MMM', { locale: de })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Mitarbeiter: {users?.length || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Aktualisiert {format(new Date(), 'HH:mm')}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Laden...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                  Mitarbeiter
                </th>
                {weekDays.map((day) => (
                  <th key={day.toISOString()} className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {formatDayHeader(day)}
                  </th>
                ))}
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">
                  Gesamt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users?.map((user, index) => (
                <tr 
                  key={user.userId} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/user/${user.userId}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-sm w-4">{index + 1}</span>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                        {getInitials(user.displayName)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.displayName}</div>
                        {user.clockedIn && (
                          <span className="text-xs text-green-600">● Eingestempelt</span>
                        )}
                      </div>
                    </div>
                  </td>
                  {weekDays.map((day) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const minutes = user.dailyMinutes?.[dateKey] || 0;
                    return (
                      <td key={dateKey} className="px-4 py-4 text-center text-gray-700">
                        {formatHours(minutes)}
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 text-center font-semibold text-gray-900 bg-gray-50">
                    {formatHours(user.totalMinutes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default WeeklyDashboard;