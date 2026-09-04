const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// התחברות ל-MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nyc_trip')
    .then(() => console.log('🗽 Connected to MongoDB Successfully (NYC)'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// הגדרת המודל (סכמה) עבור אירועים דינמיים
const eventSchema = new mongoose.Schema({
    date: { type: String, required: true },       // פורמט YYYY-MM-DD
    time: { type: String, default: "גמיש" },       // פורמט HH:MM או גמיש
    nameHe: { type: String, required: true },     // שם בעברית
    nameEn: { type: String, required: true },     // שם באנגלית
    type: { type: String, default: "custom" },    // סוג האירוע (custom, flight וכו')
    createdBy: { type: String, required: true },  // מי הוסיף את הפעילות
    isStatic: { type: Boolean, default: false }   // תמיד false עבור אירועים מהשרת
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

// ==================== נתיבים (Routes) ====================

// 1. שליפת כל האירועים הדינמיים מהמסד
app.get('/api/events', async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1, time: 1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: 'שגיאה בשליפת הנתונים מהשרת' });
    }
});

// 2. הוספת אירוע דינמי חדש ללוז המשותף
app.post('/api/events', async (req, res) => {
    try {
        const { date, time, nameHe, nameEn, type, createdBy } = req.body;
        
        if (!date || !nameHe || !nameEn || !createdBy) {
            return res.status(400).json({ error: 'נא למלא את כל שדות החובה' });
        }

        const newEvent = new Event({
            date,
            time: time || "גמיש",
            nameHe,
            nameEn,
            type: type || "custom",
            createdBy,
            isStatic: false
        });

        const savedEvent = await newEvent.save();
        res.status(201).json(savedEvent);
    } catch (err) {
        res.status(500).json({ error: 'שגיאה בשמירת האירוע החדש' });
    }
});

// 3. מחיקת אירוע דינמי מהלוז המשותף
app.delete('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedEvent = await Event.findByIdAndDelete(id);
        
        if (!deletedEvent) {
            return res.status(404).json({ error: 'האירוע לא נמצא או שכבר נמחק' });
        }
        
        res.json({ message: 'האירוע נמחק בהצלחה מהלוז המשותף!', deletedEvent });
    } catch (err) {
        res.status(500).json({ error: 'שגיאה במחיקת האירוע מהשרת' });
    }
});

// הפעלת השרת
app.listen(PORT, () => {
    console.log(`🚀 NYC Server is running on port ${PORT}`);
});