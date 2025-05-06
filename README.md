## Hunger ARC – CSE 416 Financial Planner

### Prerequisites

* **Node.js**: v22.12.0 or higher
* **MongoDB**: Ensure `mongod` is running in the background

### Setup Instructions

1. **Install all dependencies**
   From the project root directory, run:

   ```bash
   npm run install-all
   ```

   This will install packages for:

   * The root project
   * The frontend (`/client`)
   * The backend (`/server`)

2. **Start the client**
   In a new terminal, navigate to the `client` folder and start the React app:

   ```bash
   cd client
   npm start
   ```

3. **Start the backend server**
   In another terminal, navigate to the `server` folder and run:

   ```bash
   cd server
   nodemon server.js
   ```
