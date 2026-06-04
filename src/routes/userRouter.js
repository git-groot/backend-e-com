// import express from "express";
// import { UserFilter } from "../services/userServices.js";
// import { login, register } from "../services/auth.js";

// const Route = express.Router();

// Route.get('/users/get', UserFilter);
// Route.post('/user/register', register);
// Route.post('/user/login', login);

// export default Route;



import express from "express";

// Services
import { UserFilter, UserCreate, } from "../services/userServices.js";

// Auth
import { login, register, verify2FA, setup2FA } from "../services/auth.js";

// Middleware
import { authenticate, authorize } from "../services/auth.js";

const Route = express.Router();

// ✅ Public routes — no token needed
Route.post('/user/register', register);
Route.post('/user/login', login);
Route.post('/user/verify-2fa', verify2FA);

// ✅ Protected — SuperAdmin only
Route.get('/user/setup-2fa', authenticate, setup2FA);
Route.post('/user/create', authenticate, authorize('SuperAdmin', 'Admin'), register);

// ✅ Protected — SuperAdmin + Admin
Route.get('/users/get', authenticate, authorize('SuperAdmin', 'Admin'), UserFilter);
// Route.get('/users/get/:id', authenticate, authorize('SuperAdmin', 'Admin'), UserGetSingle);
// Route.put('/users/update/:id', authenticate, authorize('SuperAdmin', 'Admin'), UserUpdate);

// ✅ Protected — SuperAdmin only (delete)
// Route.delete('/users/delete/:id', authenticate, authorize('SuperAdmin'), UserDelete);

export default Route;