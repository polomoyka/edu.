const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'student.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); 

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

app.post('/register', (req, res) => {
    const newUser = req.body;
    
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Помилка читання бази');
        
        let students = [];
        try { students = JSON.parse(data); } catch(e) {}

        if (students.some(s => s.email === newUser.email)) {
            return res.status(400).json({ message: "Цей email вже зареєстровано." });
        }

        students.push(newUser);

        fs.writeFile(DATA_FILE, JSON.stringify(students, null, 2), (err) => {
            if (err) return res.status(500).send('Помилка запису');
            res.json({ success: true });
        });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (email === 'admin@lpnu.ua' && password === 'admin123') {
        return res.json({ success: true, user: { name: "Адміністратор", role: 'admin' } });
    }
    if (email === 'teacher@lpnu.ua' && password === 'teacher123') {
        return res.json({ success: true, user: { name: "Викладач", role: 'teacher' } });
    }

    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Помилка бази даних');
        let students = JSON.parse(data);
        const user = students.find(s => s.email === email && s.password === password);
        
        if (user) res.json({ success: true, user });
        else res.status(401).json({ message: "Невірний email або пароль" });
    });
});

app.listen(PORT, () => console.log(`Сервер запущено: http://localhost:${PORT}`));