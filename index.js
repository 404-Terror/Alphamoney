import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cookieSession from 'cookie-session';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { connectDB } from './config/db.js';
import { userRoutes } from './routes/userRoutes.js';
import isAuthenticated from './middleware/authMiddleware.js';

dotenv.config();
connectDB();

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

/* ----- session ----- */
app.use(cookieSession({
    name: 'session',
    keys: [crypto.randomBytes(32).toString('hex')],
    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(cookieParser());

// ...

const currentModuleUrl = new URL(import.meta.url);
const currentModulePath = dirname(fileURLToPath(currentModuleUrl));

const staticDirPath = join(currentModulePath, '.', 'static');
app.use(express.static(staticDirPath));



const publicDirPath = join(currentModulePath, '.', 'public');

app.get('/', function (req, res) {
    res.sendFile(join(publicDirPath, 'index.html'));
});

app.get('/auth', function (req, res) {
    res.sendFile(join(publicDirPath, 'auth.html'));
});

app.get('/user', isAuthenticated, function (req, res) {
    res.sendFile(join(publicDirPath, 'user.html'));
});

app.get('/app', isAuthenticated, function (req, res) {
    res.sendFile(join(publicDirPath, 'dataviz.html'));
});

app.get('/chat', isAuthenticated, function (req, res) {
    res.sendFile(join(publicDirPath, 'chat.html'));
});
// ...
app.get('/history', isAuthenticated, function (req, res) {
    res.sendFile(join(publicDirPath, 'history.html'));
});

app.use('/api', userRoutes);

app.listen(port);
console.log('Server started at http://localhost:' + port);
