# Ngamia Ordering & Queue Management System

A simple, user-friendly ordering system designed for chaotic marketplace environments.

## Features
- **Customer App:** Multi-language (EN, RW, FR), No-password login (Name/Phone), Large UI buttons.
- **Admin Dashboard:** Real-time order tracking, Inventory management, Queue control.
- **Queue System:** Automatic sequential numbers and pickup time slots.
- **SMS Notifications:** Confirmation and status alerts (Mocked).

## Tech Stack
- **Backend:** Node.js, Express, MariaDB (Sequelize)
- **Frontend:** React, Tailwind CSS, Lucide Icons, i18next

## Setup Instructions

### 1. Database Setup
1. Install MariaDB/MySQL.
2. Create a database named `ngamia_db`.
3. Update `backend/.env` with your DB credentials (see `.env.example`).

### 2. Backend Installation
```bash
cd backend
npm install
npm run dev # Starts server on http://localhost:5000
```

### 3. Frontend Installation
```bash
cd frontend
npm install
npm run dev # Starts app on http://localhost:5173
```

## Initial Data
You can use a tool like DBeaver or HeidiSQL to add products to the `products` table once the backend has synced the models on the first run.
Alternatively, use the Admin Dashboard at `/admin` (Product management included).

## SMS Service
The SMS service currently logs messages to the backend console. To integrate a real provider, update `backend/src/services/SMSService.js`.
