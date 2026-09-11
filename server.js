const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/compile', (req, res) => {
    const code = req.body.code;
    
    // 1. यूज़र के कोड को Main.java नाम की फाइल में सेव करें
    fs.writeFileSync('Main.java', code);

    // 2. Java कोड को compile और run करें (15 सेकंड की लिमिट के साथ)
    exec('javac Main.java && java Main', { timeout: 15000 }, (error, stdout, stderr) => {
        if (error) {
            // अगर 15 सेकंड से ज्यादा टाइम लगा (Infinite loop या Server slow होने पर)
            if (error.killed) {
                return res.json({ output: "Error: Timeout ⏳\n(प्रोग्राम को चलने में 15 सेकंड से ज्यादा लगे।)" });
            }
            // अगर कोड में कोई सिंटैक्स एरर है (जैसे सेमीकोलन भूलना या गलत स्पेलिंग)
            // यह आपको बताएगा कि एरर किस लाइन नंबर पर है!
            return res.json({ output: stderr || error.message });
        }
        // अगर कोड बिल्कुल सही चला, तो आउटपुट भेजें
        res.json({ output: stdout });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
