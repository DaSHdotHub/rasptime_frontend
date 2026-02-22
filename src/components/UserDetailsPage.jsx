import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '../api/client';

function UserDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.getUser(id),
  });

  if (isLoading) return <div className="p-8 text-center">Laden...</div>;
  if (!user) return <div className="p-8 text-center">Benutzer nicht gefunden</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Zurück zur Übersicht
      </button>

      {/* User Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
            {user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.displayName}</h1>
            <span className={`px-2 py-1 text-xs rounded-full ${
              user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {user.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-500">RFID Tag</label>
            <p className="font-mono bg-gray-100 px-3 py-2 rounded mt-1">{user.rfidTag}</p>
          </div>

          <div>
            <label className="text-sm text-gray-500">Status</label>
            <p className="mt-1">
              <span className={`px-3 py-1 rounded-full text-sm ${
                user.clockedIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {user.clockedIn ? 'Eingestempelt' : 'Ausgestempelt'}
              </span>
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-500">Aktiv</label>
            <p className="mt-1">
              <span className={`px-3 py-1 rounded-full text-sm ${
                user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user.active ? 'Ja' : 'Nein'}
              </span>
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-500">Erstellt am</label>
            <p className="mt-1 text-gray-900">
              {format(new Date(user.createdAt), 'dd.MM.yyyy HH:mm')}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8">
          <button
            onClick={() => navigate(`/user/${id}/timesheet`)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium"
          >
            Arbeitszeiten anzeigen
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserDetailsPage;