const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/compile', (req, res) => {
    const { code, expectedOutput } = req.body;
    
    // कोड को फाइल में सेव करना
    fs.writeFileSync('Main.java', code);

    // 5 सेकंड की लिमिट के साथ कोड रन करना
    exec('javac Main.java && java Main', { timeout: 5000 }, (error, stdout, stderr) => {
        if (error) {
            if (error.killed) return res.json({ success: false, output: "Error: Timeout ⏳", message: "❌ Infinite Loop या Timeout!" });
            return res.json({ success: false, output: stderr || error.message, message: "❌ Code में Error है! ध्यान से देखो।" });
        }

        const actualOutput = stdout.trim();
        const targetOutput = (expectedOutput || "").trim();

        if (targetOutput && actualOutput === targetOutput) {
            res.json({ success: true, output: actualOutput, message: "🎉 बेहतरीन! Level Cleared!" });
        } else {
            res.json({ success: false, output: actualOutput, message: `❌ गलत जवाब!\nचाहिए था: "${targetOutput}"\nआपका आया: "${actualOutput}"` });
        }
    });
});

app.listen(process.env.PORT || 3000, () => console.log(`Backend is ready!`));
