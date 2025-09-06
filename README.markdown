# Mini-Kanban

Mini-Kanban is a lightweight, visually appealing Kanban board application inspired by Trello, designed for efficient project management. Built with a modern tech stack, it features a responsive React frontend with Material-UI components and a Node.js/Express backend, deployed serverlessly on Vercel. The application showcases a peach and tea-inspired theme with glowing circles and interactive charts, delivering a better user experience.

[Repository Link](https://github.com/AbdulAHAD968/Mini-Kanban)

![Login Page](./github-readme-images/login-page.png)

---

## Features

- **User Authentication**: Secure login with username/password and a "Forgot Password" modal directing users to contact the admin (`zarin.helpdesk@gmail.com`).
- **Board Management**: Create, edit, and delete Kanban boards with titles and descriptions.
- **Visualizations**: Doughnut charts powered by Chart.js, displaying task statuses (To Do, In Progress, Done) with a peach/tea color palette.
- **Dynamic UI**: Glowing circles background animation on the login page for an engaging experience.
- **Responsive Design**: Optimized for desktop and mobile devices using Material-UI’s responsive grid and components.
- **Serverless Architecture**: Backend deployed as Vercel serverless functions for scalability and ease of maintenance.
- **Toast Notifications**: Real-time feedback for user actions using `react-toastify`.

---

## Tech Stack

- **Frontend**:
  - React (`create-react-app`)
  - Material-UI (`@mui/material`) for UI components
  - Chart.js for task visualizations
  - React Router (`react-router-dom`) for navigation
  - React Toastify for notifications
- **Backend**:
  - Node.js with Express.js
  - CORS for cross-origin requests
  - (Optional) MongoDB Atlas or Vercel Postgres for data storage
- **Deployment**: Vercel for serverless functions (backend) and static hosting (frontend)
- **Testing**: Jest and React Testing Library for unit, integration, and system tests

---

## Project Structure

```plaintext
Mini-Kanban/
├── backend/                # Node.js/Express backend
│   ├── api/
│   │   └── index.js       # Serverless function entry point
│   ├── routes/            # API routes (e.g., boards.js)
│   ├── package.json       # Backend dependencies
│   └── vercel.json        # Vercel configuration for backend
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx  # Dashboard with board management and charts
│   │   │   └── Login.jsx      # Login page with glowing circles and forgot password modal
│   │   ├── contexts/
│   │   │   └── AuthContext.js # Authentication context
│   │   └── dashboard.css      # Custom styles
│   ├── package.json           # Frontend dependencies
│   └── .env                   # Environment variables (e.g., REACT_APP_API_URL)
└── README.md                  # Project documentation
```

---

## Setup Instructions

### Prerequisites
- Node.js (v20.x or higher)
- Git
- Vercel CLI (`npm install -g vercel`)
- (Optional) MongoDB Atlas or Vercel Postgres account for database

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/AbdulAHAD968/Mini-Kanban.git
   cd Mini-Kanban
   ```

2. **Setup Frontend**:
   ```bash
   cd frontend
   npm install
   ```
   Create a `.env` file in `frontend/`:
   ```env
   REACT_APP_API_URL=https://your-backend-domain.vercel.app
   ```
   Build and test locally:
   ```bash
   npm run build
   npm start
   ```

3. **Setup Backend**:
   ```bash
   cd ../backend
   npm install
   ```
   Create a `.env` file in `backend/`:
   ```env
   DATABASE_URL=your-database-connection-string
   ```
   Test locally:
   ```bash
   npm start
   ```

4. **Run Locally**:
   - Start the backend (e.g., `http://localhost:5000`).
   - Start the frontend (e.g., `http://localhost:3000`).
   - Access the app at `http://localhost:3000`.

---

## Deployment on Vercel

### Frontend
1. Navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Deploy:
   ```bash
   vercel
   ```
   - Select `Create React App` as the framework.
   - Set `REACT_APP_API_URL` to the backend’s Vercel URL.
3. Redeploy with production flag:
   ```bash
   vercel --prod
   ```

### Backend
1. Navigate to `backend/`:
   ```bash
   cd ../backend
   ```
2. Ensure `vercel.json` is configured (see [Project Structure](#project-structure)).
3. Deploy:
   ```bash
   vercel
   ```
   - Add environment variables (e.g., `DATABASE_URL`).
4. Redeploy with production flag:
   ```bash
   vercel --prod
   ```

### Connect Frontend and Backend
- Update `REACT_APP_API_URL` in the frontend’s Vercel project settings to the backend’s URL (e.g., `https://mini-kanban-backend.vercel.app`).
- Ensure CORS is configured in `backend/api/index.js`:
  ```javascript
  app.use(cors({ origin: "https://mini-kanban-frontend.vercel.app" }));
  ```

---

## Testing

The project includes comprehensive testing to ensure reliability and functionality across unit, integration, and system levels.

| **Test Type**     | **Description**                                                                 | **Tools Used**                     | **Coverage**                     |
|--------------------|--------------------------------------------------------------------------------|------------------------------------|-----------------------------------|
| **Unit Testing**   | Tests individual components (e.g., `Login.jsx`, `Dashboard.jsx`) and utility functions for isolated behavior. | Jest, React Testing Library        | Components, hooks, and utilities  |
| **Integration Testing** | Verifies interactions between components and API calls (e.g., board creation, login flow). | Jest, React Testing Library, Mock Service Worker | Frontend-backend integration     |
| **System Testing** | Validates end-to-end functionality, including user flows (login, board management, chart rendering). | Cypress (or manual testing)       | Full application workflows       |

### Running Tests
1. **Frontend Tests**:
   ```bash
   cd frontend
   npm test
   ```
2. **Backend Tests**:
   ```bash
   cd backend
   npm test
   ```
   Note: Ensure test scripts are defined in `package.json` for both directories.

---

## Features Showcase

- **Login Page**: Features a glowing circles animation with a peach/tea theme, a "Forgot Password" modal, and toast notifications for user feedback.
- **Dashboard**: Displays boards as cards with uniform widths, interactive doughnut charts, and modals for creating/editing boards, styled in soft coral, muted tea green, and creamy peach.
- **Responsive Design**: Adapts seamlessly to mobile and desktop devices with Material-UI’s grid system.

![Dashboard View-1](./github-readme-images/dashboard-1.png)

---

![Dashboard View-2](./github-readme-images/dashboard-2.png)

---

![Detailed Board View](./github-readme-images/boardview.png)

---

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.


---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Contact

For support or inquiries, contact the admin at [ahad06074@gmail.com](mailto:ahad06074k@gmail.com).
