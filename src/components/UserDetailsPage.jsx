import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '../api/client';

function UserDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new';
  
  const [isEditing, setIsEditing] = useState(isNew);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    rfidTag: '',
    role: 'USER',
    contractedMinutesPerWeek: 2400,
  });
  const [error, setError] = useState(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.getUser(id),
    enabled: !isNew,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        rfidTag: user.rfidTag || '',
        role: user.role || 'USER',
        contractedMinutesPerWeek: user.contractedMinutesPerWeek || 2400,
      });
    }
  }, [user]);

  const createMutation = useMutation({
    mutationFn: (data) => api.createUser(data),
    onSuccess: (newUser) => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['weekly-overview']);
      navigate(`/user/${newUser.id}`);
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Fehler beim Erstellen');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user', id]);
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['weekly-overview']);
      setIsEditing(false);
      setError(null);
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Fehler beim Speichern');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['weekly-overview']);
      navigate('/');
    },
  });

  const handleSave = () => {
    setError(null);
    if (!formData.displayName.trim()) {
      setError('Name ist erforderlich');
      return;
    }
    if (!formData.rfidTag.trim()) {
      setError('RFID Tag ist erforderlich');
      return;
    }

    if (isNew) {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const formatHours = (minutes) => {
    if (!minutes) return '0h';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const hoursToMinutes = (hours) => Math.round(hours * 60);
  const minutesToHours = (minutes) => minutes / 60;

  if (isLoading && !isNew) return <div className="p-8 text-center">Laden...</div>;
  if (!user && !isNew) return <div className="p-8 text-center">Benutzer nicht gefunden</div>;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Zurück zur Übersicht
        </button>

        {!isNew && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Bearbeiten
          </button>
        )}

        {isEditing && !isNew && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 hover:bg-red-50 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Deaktivieren
          </button>
        )}
      </div>

      {/* User Card */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* Avatar & Name Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
            {(formData.displayName || 'NN').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            {isEditing ? (
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none bg-transparent"
                placeholder="Name eingeben"
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">{user?.displayName}</h1>
            )}
            {!isNew && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {user?.role}
              </span>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-500">RFID Tag</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.rfidTag}
                onChange={(e) => setFormData(prev => ({ ...prev, rfidTag: e.target.value }))}
                className="w-full font-mono bg-gray-100 px-3 py-2 rounded mt-1 border focus:border-blue-500 focus:outline-none"
                placeholder="RFID eingeben"
              />
            ) : (
              <p className="font-mono bg-gray-100 px-3 py-2 rounded mt-1">{user?.rfidTag}</p>
            )}
          </div>

          <div>
            <label className="text-sm text-gray-500">Rolle</label>
            {isEditing ? (
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full bg-gray-100 px-3 py-2 rounded mt-1 border focus:border-blue-500 focus:outline-none"
              >
                <option value="USER">Benutzer</option>
                <option value="ADMIN">Admin</option>
              </select>
            ) : (
              <p className="mt-1">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {user?.role === 'ADMIN' ? 'Admin' : 'Benutzer'}
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="text-sm text-gray-500">Vertragszeit pro Woche</label>
            {isEditing ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  value={minutesToHours(formData.contractedMinutesPerWeek)}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    contractedMinutesPerWeek: hoursToMinutes(parseFloat(e.target.value) || 0)
                  }))}
                  className="w-24 bg-gray-100 px-3 py-2 rounded border focus:border-blue-500 focus:outline-none"
                  min="0"
                  max="60"
                  step="0.5"
                />
                <span className="text-gray-600">Stunden</span>
              </div>
            ) : (
              <p className="mt-1 text-gray-900 font-medium">
                {formatHours(user?.contractedMinutesPerWeek || 2400)}
              </p>
            )}
          </div>

          {!isNew && (
            <>
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <p className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    user?.clockedIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user?.clockedIn ? 'Eingestempelt' : 'Ausgestempelt'}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Aktiv</label>
                <p className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    user?.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user?.active ? 'Ja' : 'Nein'}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Erstellt am</label>
                <p className="mt-1 text-gray-900">
                  {format(new Date(user?.createdAt), 'dd.MM.yyyy HH:mm')}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-3">
          {isEditing ? (
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={createMutation.isLoading || updateMutation.isLoading}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
              >
                {createMutation.isLoading || updateMutation.isLoading ? 'Speichern...' : 'Speichern'}
              </button>
              {!isNew && (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      displayName: user.displayName,
                      rfidTag: user.rfidTag,
                      role: user.role,
                      contractedMinutesPerWeek: user.contractedMinutesPerWeek || 2400,
                    });
                    setError(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Abbrechen
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate(`/user/${id}/timesheet`)}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium"
            >
              Arbeitszeiten anzeigen
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Benutzer deaktivieren?</h3>
            <p className="text-gray-600 mb-6">
              Der Benutzer <strong>{user?.displayName}</strong> wird deaktiviert. 
              Die Zeiterfassungsdaten bleiben erhalten.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isLoading}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isLoading ? 'Wird deaktiviert...' : 'Deaktivieren'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDetailsPage;