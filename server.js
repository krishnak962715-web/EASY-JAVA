const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/compile', (req, res) => {
    const code = req.body.code || '';

    // 1. हर यूज़र के लिए एक अलग 'Secret Folder' बनाना (ताकि कोड आपस में ना टकराएं)
    const uniqueId = 'student_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    const tempDir = path.join(os.tmpdir(), uniqueId);

    try {
        // फोल्डर और फाइल क्रिएट करना
        fs.mkdirSync(tempDir);
        const filePath = path.join(tempDir, 'Main.java');
        fs.writeFileSync(filePath, code);

        // 2. कोड रन करना (30 सेकंड की लिमिट और सीक्रेट फोल्डर के अंदर)
        exec('javac Main.java && java Main', { cwd: tempDir, timeout: 30000 }, (error, stdout, stderr) => {
            
            // 3. Auto-Clean: आउटपुट आते ही उस यूज़र की फाइलें डिलीट कर देना ताकि सर्वर फास्ट रहे
            fs.rmSync(tempDir, { recursive: true, force: true });

            if (error) {
                // अगर 30 सेकंड से ज़्यादा टाइम लिया (Infinite Loop)
                if (error.killed) {
                    return res.json({ output: "Error: Timeout ⏳\n(30 सेकंड की लिमिट पार हो गई। या तो कोड में Infinite Loop है, या आपने User Input मांगा है।)" });
                }
                // अगर कोड में कोई सिंटैक्स एरर है
                return res.json({ output: stderr || error.message });
            }
            // अगर सब सही रहा तो असली आउटपुट भेजें
            res.json({ output: stdout });
        });
    } catch (err) {
        res.json({ output: "Server Error: " + err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Khatarnak Server is running smoothly on port ${PORT}`));
