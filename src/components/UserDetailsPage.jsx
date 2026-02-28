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
  
  // RFID Registration state
  const [isWaitingForRfid, setIsWaitingForRfid] = useState(false);
  const [registrationSessionId, setRegistrationSessionId] = useState(null);
  const [countdown, setCountdown] = useState(30);

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

  // RFID Registration polling
  useEffect(() => {
    if (!isWaitingForRfid || !registrationSessionId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/admin/registration/status/${registrationSessionId}`);
        const data = await response.json();
        
        if (data.status === 'completed') {
          setFormData(prev => ({ ...prev, rfidTag: data.rfidTag }));
          setIsWaitingForRfid(false);
          setRegistrationSessionId(null);
          setCountdown(30);
        } else if (data.status === 'expired') {
          setIsWaitingForRfid(false);
          setRegistrationSessionId(null);
          setCountdown(30);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 1000);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setIsWaitingForRfid(false);
          setRegistrationSessionId(null);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(countdownInterval);
    };
  }, [isWaitingForRfid, registrationSessionId]);

  const startRfidRegistration = async () => {
    try {
      const response = await fetch('/api/admin/registration/start', {
        method: 'POST',
      });
      const data = await response.json();
      setRegistrationSessionId(data.sessionId);
      setIsWaitingForRfid(true);
      setCountdown(30);
      setError(null);
    } catch (err) {
      setError('Fehler beim Starten der RFID-Registrierung');
    }
  };

  const cancelRfidRegistration = () => {
    setIsWaitingForRfid(false);
    setRegistrationSessionId(null);
    setCountdown(30);
  };

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

  const handleCancel = () => {
    if (isNew) {
      navigate('/');
    } else {
      setIsEditing(false);
      setFormData({
        displayName: user.displayName || '',
        rfidTag: user.rfidTag || '',
        role: user.role || 'USER',
        contractedMinutesPerWeek: user.contractedMinutesPerWeek || 2400,
      });
      setError(null);
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

  if (isLoading && !isNew) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Laden...</p>
      </div>
    );
  }
  
  if (!user && !isNew) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Benutzer nicht gefunden</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Zurück zur Übersicht
        </button>
      </div>
    );
  }

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
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none bg-transparent w-full"
                placeholder="Name eingeben"
                autoFocus={isNew}
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">{user?.displayName}</h1>
            )}
            {!isNew && !isEditing && (
              <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
                user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {user?.role === 'ADMIN' ? 'Administrator' : 'Benutzer'}
              </span>
            )}
            {isNew && (
              <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                Neuer Benutzer
              </span>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* RFID Tag */}
          <div className="md:col-span-2">
            <label className="text-sm text-gray-500 block mb-1">RFID Tag</label>
            {isEditing ? (
              isWaitingForRfid ? (
                <div className="p-4 bg-blue-50 border-2 border-blue-300 border-dashed rounded-lg text-center">
                  <div className="animate-pulse text-blue-600 font-medium text-lg">
                    Warte auf RFID-Tag... ({countdown}s)
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Halten Sie den RFID-Chip an das Terminal
                  </div>
                  <button
                    type="button"
                    onClick={cancelRfidRegistration}
                    className="mt-3 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                  >
                    Abbrechen
                  </button>
                </div>
              ) : formData.rfidTag ? (
                <div className="flex items-center gap-2">
                  <span className="flex-1 font-mono bg-green-50 text-green-800 px-3 py-2 rounded border border-green-200">
                    {formData.rfidTag}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, rfidTag: '' }))}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="RFID entfernen"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.rfidTag}
                    onChange={(e) => setFormData(prev => ({ ...prev, rfidTag: e.target.value }))}
                    className="flex-1 font-mono bg-gray-100 px-3 py-2 rounded border focus:border-blue-500 focus:outline-none"
                    placeholder="RFID manuell eingeben"
                  />
                  <button
                    type="button"
                    onClick={startRfidRegistration}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                    Scannen
                  </button>
                </div>
              )
            ) : (
              <p className="font-mono bg-gray-100 px-3 py-2 rounded">{user?.rfidTag}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="text-sm text-gray-500 block mb-1">Rolle</label>
            {isEditing ? (
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full bg-gray-100 px-3 py-2 rounded border focus:border-blue-500 focus:outline-none"
              >
                <option value="USER">Benutzer</option>
                <option value="ADMIN">Administrator</option>
              </select>
            ) : (
              <p className="mt-1">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {user?.role === 'ADMIN' ? 'Administrator' : 'Benutzer'}
                </span>
              </p>
            )}
          </div>

          {/* Contracted Hours */}
          <div>
            <label className="text-sm text-gray-500 block mb-1">Vertragszeit pro Woche</label>
            {isEditing ? (
              <div className="flex items-center gap-2">
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
              <p className="text-gray-900 font-medium">
                {formatHours(user?.contractedMinutesPerWeek || 2400)}
              </p>
            )}
          </div>

          {/* Status (only for existing users) */}
          {!isNew && (
            <>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Status</label>
                <p className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    user?.clockedIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user?.clockedIn ? '● Eingestempelt' : 'Ausgestempelt'}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500 block mb-1">Aktiv</label>
                <p className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    user?.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user?.active ? 'Ja' : 'Deaktiviert'}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500 block mb-1">Erstellt am</label>
                <p className="text-gray-900">
                  {user?.createdAt ? format(new Date(user.createdAt), 'dd.MM.yyyy HH:mm') : '-'}
                </p>
              </div>

              {user?.updatedAt && (
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Zuletzt geändert</label>
                  <p className="text-gray-900">
                    {format(new Date(user.updatedAt), 'dd.MM.yyyy HH:mm')}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-3">
          {isEditing ? (
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={createMutation.isLoading || updateMutation.isLoading || isWaitingForRfid}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {(createMutation.isLoading || updateMutation.isLoading) ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Speichern...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Speichern
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={createMutation.isLoading || updateMutation.isLoading}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50"
              >
                Abbrechen
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate(`/user/${id}/timesheet`)}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Arbeitszeiten anzeigen
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Benutzer deaktivieren?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Der Benutzer <strong>{user?.displayName}</strong> wird deaktiviert und kann sich nicht mehr einstempeln. 
              Die Zeiterfassungsdaten bleiben erhalten.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isLoading}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteMutation.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Wird deaktiviert...
                  </>
                ) : (
                  'Deaktivieren'
                )}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteMutation.isLoading}
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