import { useState } from 'react';

function UserDetailsModal({ user, onClose, onViewTimeEntries }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Benutzer Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm text-gray-500">Name</label>
            <p className="font-medium">{user.displayName}</p>
          </div>

          <div>
            <label className="text-sm text-gray-500">RFID Tag</label>
            <p className="font-mono bg-gray-100 px-2 py-1 rounded">{user.rfidTag}</p>
          </div>

          <div>
            <label className="text-sm text-gray-500">Rolle</label>
            <p>
              <span className={`px-2 py-1 text-xs rounded-full ${
                user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {user.role}
              </span>
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-500">Status</label>
            <p>
              <span className={`px-2 py-1 text-xs rounded-full ${
                user.clockedIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {user.clockedIn ? 'Eingestempelt' : 'Ausgestempelt'}
              </span>
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-500">Aktiv</label>
            <p>
              <span className={`px-2 py-1 text-xs rounded-full ${
                user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user.active ? 'Ja' : 'Nein'}
              </span>
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-500">Erstellt am</label>
            <p className="text-sm">{new Date(user.createdAt).toLocaleString('de-DE')}</p>
          </div>
        </div>

        <div className="p-6 border-t flex gap-3">
          <button
            onClick={() => onViewTimeEntries(user)}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Zeiten anzeigen
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserDetailsModal;