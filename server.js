const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
app.use(cors());

// Feature 1: Code Size Limit (कोई 50KB से बड़ा कोड नहीं भेज सकता)
app.use(express.json({ limit: '50kb' }));

// Feature 2: Spam Protection (Simple Rate Limiting)
const userRequests = new Map();
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    if (userRequests.has(ip) && (now - userRequests.get(ip) < 2000)) {
        return res.json({ output: "System: Please wait 2 seconds before running code again. 🚦" });
    }
    userRequests.set(ip, now);
    next();
});

// Home Route for Cron-Job (To prevent 404 Error)
app.get('/', (req, res) => {
    res.send('🚀 Java Studio Backend is Alive, Secure & Running 24/7!');
});

app.post('/compile', (req, res) => {
    const code = req.body.code || '';
    if (!code.trim()) return res.json({ output: "Error: No code provided!" });

    const uniqueId = 'student_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    const tempDir = path.join(os.tmpdir(), uniqueId);

    try {
        fs.mkdirSync(tempDir);
        const filePath = path.join(tempDir, 'Main.java');
        fs.writeFileSync(filePath, code);

        // Feature 3 & 4: Java Memory Limit (-Xmx256m) and 30s Timeout
        exec('javac Main.java && java -Xmx256m Main', { cwd: tempDir, timeout: 30000 }, (error, stdout, stderr) => {
            
            // Auto-Clean
            fs.rmSync(tempDir, { recursive: true, force: true });

            if (error) {
                if (error.killed) {
                    return res.json({ output: "Error: Timeout or Memory Limit Exceeded ⏳\n(30 सेकंड या 256MB RAM की लिमिट पार हो गई।)" });
                }
                return res.json({ output: stderr || error.message });
            }
            res.json({ output: stdout });
        });
    } catch (err) {
        // Fallback cleanup if something goes wrong
        if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
        res.json({ output: "Server Error: " + err.message });
    }
});

// Feature 5: Crash Protection (सर्वर कभी बंद नहीं होगा)
process.on('uncaughtException', (err) => {
    console.log("Caught exception: " + err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Khatarnak & Secure Server is running smoothly on port ${PORT}`));
