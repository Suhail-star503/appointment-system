# Appointment Management System

A full-stack appointment management application with a separate frontend
and backend.

## Project structure

``` text
project-root/
├── frontend/   # Next.js frontend
├── backend/    # Express.js + MongoDB API
└── README.md
```

## 1. Prerequisites

Install:

-   Node.js (LTS recommended)
-   npm
-   MongoDB (local installation or MongoDB Atlas)
-   Git (optional)

Verify Node.js and npm:

``` bash
node --version
npm --version
```

## 2. Configure and run the backend

Open a terminal at the project root:

``` bash
cd backend
npm install
```

Create `backend/.env`:

``` env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/appointment-system
```

**Important:** `MONGODB_URI` is an example variable name. Open
`backend/config/mongooseConfig.js` and use the exact environment
variable name that file reads. For MongoDB Atlas, use your Atlas
connection string instead. Do not commit credentials.

Check `backend/package.json` for available scripts. If it defines `dev`,
run:

``` bash
npm run dev
```

If it only defines `start`, run:

``` bash
npm start
```

If neither script exists, add scripts that match your actual server
entry filename. For example, if the entry file is `server.js` and
Nodemon is installed:

``` json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

Change `server.js` to the real entry filename in your project. The
backend connects to MongoDB before listening for requests.

When it starts, the terminal should show a message similar to:

``` text
Server is running on http://localhost:5000
```

Test the health route:

``` text
http://localhost:5000/
```

Expected response:

``` json
{
  "success": true,
  "message": "Welcome to Appointment System API"
}
```

## 3. Configure and run the frontend

Open a **second terminal**. Leave the backend running.

``` bash
cd frontend
npm install
```

Check the frontend code to identify the environment variable used for
the API base URL. If the frontend expects `NEXT_PUBLIC_API_URL`, create
`frontend/.env.local`:

``` env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Use the exact variable name expected by your frontend code. The base URL
should include `/api` if the frontend appends paths such as
`/appointmentsystem`.

For a typical Next.js project, start the frontend with:

``` bash
npm run dev
```

Open the local URL printed in the terminal. It is usually:

``` text
http://localhost:3000
```

If you change `.env.local`, restart the frontend development server.

## 4. Run both applications

Keep two terminals open.

**Terminal 1 --- Backend**

``` bash
cd backend
npm install
npm run dev
```

**Terminal 2 --- Frontend**

``` bash
cd frontend
npm install
npm run dev
```

Then:

1.  Make sure MongoDB is running or your Atlas database is reachable.
2.  Confirm the backend has started successfully.
3.  Open the frontend URL printed by Next.js.
4.  Create an appointment.
5.  Confirm it appears in the appointment list.
6.  Change its status and verify the updated status.

If your backend uses `npm start` instead of `npm run dev`, use the
script available in `backend/package.json`.

## 5. Backend API endpoints

The Express app mounts the appointment router at `/api`.

  ------------------------------------------------------------------------------------------------
  Method                  Endpoint                                         Purpose
  ----------------------- ------------------------------------------------ -----------------------
  `GET`                   `/`                                              Backend health check

  `POST`                  `/api/appointmentsystem`                         Create an appointment

  `GET`                   `/api/appointmentsystem`                         Retrieve appointments

  `PATCH`                 `/api/appointmentsystem/:appointmentId/status`   Update appointment
                                                                           status
  ------------------------------------------------------------------------------------------------

### Create an appointment

Request:

``` http
POST http://localhost:5000/api/appointmentsystem
Content-Type: application/json
```

Body:

``` json
{
  "customerName": "John Doe",
  "service": "Haircut",
  "dateTime": "2026-11-05T10:30:00.000Z"
}
```

The `status` field is optional. If omitted, the schema default is
`Pending`.

### Get appointments

``` http
GET http://localhost:5000/api/appointmentsystem
```

Supported query parameters:

  Parameter   Purpose
  ----------- --------------------------------------------------
  `page`      Page number; defaults to `1`
  `limit`     Page size; defaults to `10`, maximum `100`
  `status`    `Pending`, `Confirmed`, or `Cancelled`
  `search`    Search customer name or service
  `from`      Start date-time in ISO 8601 format with timezone
  `to`        End date-time in ISO 8601 format with timezone
  `sortBy`    `dateTime`, `createdAt`, or `customerName`
  `order`     `asc` or `desc`

Example:

``` http
GET http://localhost:5000/api/appointmentsystem?page=1&limit=10&status=Pending&sortBy=dateTime&order=desc
```

Date range example:

``` http
GET http://localhost:5000/api/appointmentsystem?from=2026-11-01T00:00:00.000Z&to=2026-11-30T23:59:59.000Z
```

### Update appointment status

Replace `APPOINTMENT_ID` with the `_id` returned by the create or list
endpoint.

Request:

``` http
PATCH http://localhost:5000/api/appointmentsystem/APPOINTMENT_ID/status
Content-Type: application/json
```

Body:

``` json
{
  "status": "Confirmed"
}
```

Allowed values:

-   `Pending`
-   `Confirmed`
-   `Cancelled`

The API validates the ID, body, and status. It returns `404` when the
appointment does not exist and `409` when the requested status is
already set or a concurrent update is detected.

## 6. Test the API with Postman

1.  Start MongoDB.
2.  Start the backend.
3.  Send `GET http://localhost:5000/` to check the server.
4.  Send a `POST` request to create an appointment.
5.  Copy the `_id` from the response.
6.  Send a `PATCH` request using that ID to update its status.
7.  Send another `GET` request to verify the change.

For JSON requests, set `Content-Type: application/json` and choose
**Body → raw → JSON** in Postman.

## 7. Troubleshooting

### MongoDB connection fails

-   Confirm the local MongoDB service is running, if applicable.
-   Check the connection string in `backend/.env`.
-   Confirm the variable name matches `config/mongooseConfig.js`.
-   For Atlas, check database credentials and network access settings.

### API returns `Oops! Something went wrong...`

-   Inspect the backend terminal; the error middleware logs the
    underlying error.
-   Verify the URL, HTTP method, JSON body, and appointment ID.
-   Confirm that every module used in a controller is imported. For
    example, code calling `mongoose.isObjectIdOrHexString()` must import
    `mongoose`.
-   Confirm the database connection succeeded.

### Frontend cannot connect to backend

-   Make sure both development servers are running.
-   Check that the frontend API base URL points to
    `http://localhost:5000/api` (or the actual backend port).
-   Confirm the environment variable name matches the frontend code.
-   Restart Next.js after changing `.env.local`.
-   Inspect the browser Network tab to see the exact request URL and
    response.

### API returns 404

Check that the URL includes `/api/appointmentsystem` and that you are
using the correct HTTP method.

### Port is already in use

Stop the process using the port or change `PORT` in `backend/.env`. If
you change the backend port, update the frontend API base URL too.

### Environment variables are not loading

-   Backend environment file: `backend/.env`
-   Frontend environment file: `frontend/.env.local`
-   Restart the corresponding server after changing either file.

## 8. Security notes

-   Never commit `.env` or `.env.local`.
-   Keep database credentials and secrets private.
-   Do not expose database credentials through frontend variables.
-   Only values intentionally exposed to browser code should use a
    Next.js `NEXT_PUBLIC_` variable.
-   Use test data during local development.

## 9. Stop the applications

In each terminal, press:

``` text
Ctrl + C
```

Stop the MongoDB service separately if you no longer need it.

## Notes about project-specific configuration

This guide reflects the shared project structure and API routes. A few
details must match the files in your local project:

-   The exact scripts in `backend/package.json` and
    `frontend/package.json`
-   The backend entry filename used by the start script
-   The MongoDB environment variable read by `config/mongooseConfig.js`
-   The frontend API environment variable read by the frontend code

Use those exact names rather than assuming the example names in this
README are already configured.
