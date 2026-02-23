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

  const goToToday = () => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const isCurrentWeek = format(weekStart, 'yyyy-MM-dd') === format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 md:gap-4">
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
          {!isCurrentWeek && (
            <button
              onClick={goToToday}
              className="ml-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
            >
              Heute
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 md:gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Mitarbeiter: {users?.length || 0}</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Aktualisiert {format(new Date(), 'HH:mm')}</span>
          </div>
          <button
            onClick={() => navigate('/user/new')}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
            title="Neuer Mitarbeiter"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Table with horizontal scroll on mobile */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Laden...</div>
        ) : (
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 md:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48 md:w-64">
                  Mitarbeiter
                </th>
                {weekDays.map((day) => (
                  <th key={day.toISOString()} className="px-2 md:px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {formatDayHeader(day)}
                  </th>
                ))}
                <th className="px-4 md:px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">
                  Gesamt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users?.map((user, index) => {
                const isOvertime = user.totalMinutes > (user.contractedMinutesPerWeek || 2400);
                const isUndertime = user.totalMinutes < (user.contractedMinutesPerWeek || 2400) && user.totalMinutes > 0;
                
                return (
                  <tr 
                    key={user.userId} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/user/${user.userId}`)}
                  >
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-gray-400 text-sm w-4">{index + 1}</span>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium text-xs md:text-sm flex-shrink-0">
                          {getInitials(user.displayName)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">{user.displayName}</div>
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
                        <td key={dateKey} className="px-2 md:px-4 py-4 text-center text-gray-700 text-sm">
                          {formatHours(minutes)}
                        </td>
                      );
                    })}
                    <td className={`px-4 md:px-6 py-4 text-center font-semibold bg-gray-50 ${
                      isOvertime ? 'text-green-600' : isUndertime ? 'text-orange-600' : 'text-gray-900'
                    }`}>
                      {formatHours(user.totalMinutes)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default WeeklyDashboard;