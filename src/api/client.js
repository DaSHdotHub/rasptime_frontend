import axios from 'axios';

const API_BASE_URL = '/api';

const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application.json',
    },
});

export const api = {
    //Users
    getUsers: (includeInactive = false) =>
        client.get(`/admin/users?includeInactive=${includeInactive}`).then(res => res.data),
    
    getUser: (id) =>
        client.get(`/admin/users/${id}`).then(res => res.data),

    createUser: (data) =>
        client.post(`/admin/users`, data).then(res => res.data),

    updateUser: (id, data) =>
        client.put(`/admin/users/${id}`, data).then(res => res.data),

    deleteUser: (id) => 
        client.delete(`/admin/users/${id}`),

    //Time Entries
    getTimeEntries: (userId, from, to) =>
        client.get(`/admin/time-entries?userId=${userId}&from=${from}&to=${to}`).then(res => res.data),

    //Health
    health: () =>
        client.get(`/health`).then(res => res.data),
};

export default api;