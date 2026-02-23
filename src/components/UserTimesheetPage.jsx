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
  isWeekend,
  differenceInWeeks
} from 'date-fns';
import { de } from 'date-fns/locale';
import api from '../api/client';

function UserTimesheetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: user } = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.getUser(id),
  });

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

  const navigateDate = (direction) => {
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

  // Calculate contracted time for period
  const getContractedMinutes = () => {
    const weeklyMinutes = user?.contractedMinutesPerWeek || 2400;
    switch (view) {
      case 'day':
        return weeklyMinutes / 5; // Daily average
      case 'week':
        return weeklyMinutes;
      case 'month':
        const weeks = differenceInWeeks(to, from) + 1;
        return weeklyMinutes * weeks;
      default:
        return weeklyMinutes;
    }
  };

  const contractedMinutes = getContractedMinutes();
  const actualMinutes = report?.totalNetMinutes || 0;
  const difference = actualMinutes - contractedMinutes;

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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
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
            </div>
            <div className="p-4 bg-gray-50 flex flex-wrap justify-between gap-2 text-sm">
              <span>Pause: <strong>{totalBreak}m</strong></span>
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[300px]">
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
          </table>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const days = eachDayOfInterval({ start: from, end: to });

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[300px]">
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
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => navigateDate('next')}
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
                className={`px-3 md:px-4 py-2 rounded-md text-sm font-medium transition ${
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

          {/* Summary Card */}
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-500">Soll</div>
                <div className="text-lg font-semibold">{formatHours(contractedMinutes)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Ist</div>
                <div className="text-lg font-semibold">{formatHours(actualMinutes)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Differenz</div>
                <div className={`text-lg font-semibold ${
                  difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {difference > 0 ? '+' : ''}{formatHours(Math.abs(difference))}
                  {difference < 0 && <span className="text-red-600"> fehlen</span>}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default UserTimesheetPage;