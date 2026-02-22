import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  format, 
  startOfWeek, 
  startOfMonth, 
  endOfMonth, 
  addWeeks, 
  subWeeks,
  addMonths,
  subMonths,
  addDays,
  subDays,
  eachDayOfInterval,
  isWeekend
} from 'date-fns';
import { de } from 'date-fns/locale';
import api from '../api/client';

function UserTimesheetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState('week'); // 'day', 'week', 'month'
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: user } = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.getUser(id),
  });

  // Calculate date range based on view
  const getDateRange = () => {
    switch (view) {
      case 'day':
        return { from: currentDate, to: currentDate };
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        return { from: weekStart, to: addDays(weekStart, 6) };
      case 'month':
        return { from: startOfMonth(currentDate), to: endOfMonth(currentDate) };
      default:
        return { from: currentDate, to: currentDate };
    }
  };

  const { from, to } = getDateRange();

  const { data: report, isLoading } = useQuery({
    queryKey: ['time-entries', id, format(from, 'yyyy-MM-dd'), format(to, 'yyyy-MM-dd')],
    queryFn: () => api.getTimeEntries(id, format(from, 'yyyy-MM-dd'), format(to, 'yyyy-MM-dd')),
  });

  const navigate_date = (direction) => {
    const modifier = direction === 'next' ? 1 : -1;
    switch (view) {
      case 'day':
        setCurrentDate(addDays(currentDate, modifier));
        break;
      case 'week':
        setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
        break;
    }
  };

  const formatHours = (minutes) => {
    if (!minutes || minutes === 0) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const getEntriesForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return report?.entries?.filter(e => e.workDate === dateStr) || [];
  };

  const getMinutesForDate = (date) => {
    const entries = getEntriesForDate(date);
    return entries.reduce((sum, e) => sum + (e.netMinutes || 0), 0);
  };

  const renderDayView = () => {
    const entries = getEntriesForDate(currentDate);
    const totalMinutes = entries.reduce((sum, e) => sum + (e.netMinutes || 0), 0);
    const totalBreak = entries.reduce((sum, e) => sum + (e.breakMinutes || 0), 0);

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="font-semibold text-lg">
            {format(currentDate, 'EEEE, d. MMMM yyyy', { locale: de })}
          </h3>
        </div>
        
        {entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Keine Einträge für diesen Tag
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kommt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Geht</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pause</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Netto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4">{entry.punchIn ? format(new Date(entry.punchIn), 'HH:mm') : '-'}</td>
                    <td className="px-6 py-4">{entry.punchOut ? format(new Date(entry.punchOut), 'HH:mm') : '-'}</td>
                    <td className="px-6 py-4">{entry.breakMinutes}m</td>
                    <td className="px-6 py-4">{formatHours(entry.netMinutes)}</td>
                    <td className="px-6 py-4">{entry.autoClosedOut && <span className="text-orange-500">⚠</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 bg-gray-50 flex justify-between text-sm">
              <span>Pause gesamt: <strong>{totalBreak}m</strong></span>
              <span>Arbeitszeit: <strong>{formatHours(totalMinutes)}</strong></span>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const days = eachDayOfInterval({ start: from, end: to });

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tag</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stunden</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {days.map((day) => {
              const minutes = getMinutesForDate(day);
              const weekend = isWeekend(day);
              return (
                <tr key={day.toISOString()} className={weekend ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4">
                    <span className={weekend ? 'text-gray-400' : ''}>
                      {format(day, 'EEEE, d. MMM', { locale: de })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-medium">
                    {formatHours(minutes)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-100">
            <tr>
              <td className="px-6 py-4 font-semibold">Gesamt</td>
              <td className="px-6 py-4 text-center font-bold">{formatHours(report?.totalNetMinutes)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  const renderMonthView = () => {
    const days = eachDayOfInterval({ start: from, end: to });

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stunden</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {days.map((day) => {
              const minutes = getMinutesForDate(day);
              const weekend = isWeekend(day);
              return (
                <tr key={day.toISOString()} className={weekend ? 'bg-gray-50' : ''}>
                  <td className="px-4 py-2">
                    <span className={weekend ? 'text-gray-400' : ''}>
                      {format(day, 'EEE d.', { locale: de })}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={weekend && minutes === 0 ? 'text-gray-300' : ''}>
                      {formatHours(minutes)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-100">
            <tr>
              <td className="px-4 py-4 font-semibold">Gesamt ({report?.totalDays} Tage)</td>
              <td className="px-4 py-4 text-center font-bold">{formatHours(report?.totalNetMinutes)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(`/user/${id}`)}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Zurück zu {user?.displayName}
      </button>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate_date('prev')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => navigate_date('next')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <span className="font-medium ml-2">
              {view === 'day' && format(currentDate, 'd. MMMM yyyy', { locale: de })}
              {view === 'week' && `${format(from, 'd.')} - ${format(to, 'd. MMM yyyy', { locale: de })}`}
              {view === 'month' && format(currentDate, 'MMMM yyyy', { locale: de })}
            </span>
          </div>

          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['day', 'week', 'month'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  view === v ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {v === 'day' && 'Tag'}
                {v === 'week' && 'Woche'}
                {v === 'month' && 'Monat'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Laden...</div>
      ) : (
        <>
          {view === 'day' && renderDayView()}
          {view === 'week' && renderWeekView()}
          {view === 'month' && renderMonthView()}
        </>
      )}
    </div>
  );
}

export default UserTimesheetPage;