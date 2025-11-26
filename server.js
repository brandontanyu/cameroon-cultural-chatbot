// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// add simple request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url} body=${JSON.stringify(req.body)}`);
    next();
});

// Import cultural data (support different export styles)
const culturesModule = require('./cultures-data');
const cameroonianCultures = culturesModule.cameroonianCultures || culturesModule.default || culturesModule;

if (!cameroonianCultures || Object.keys(cameroonianCultures).length === 0) {
    console.error('Warning: cameroonianCultures is empty or missing from cultures-data.js');
}

// helper: case-insensitive/key-or-name lookup
function findCultureKey(identifier) {
    if (!identifier || !cameroonianCultures) return null;
    const target = String(identifier).toLowerCase();
    for (const key of Object.keys(cameroonianCultures)) {
        if (key.toLowerCase() === target) return key;
        const name = (cameroonianCultures[key].name || '').toLowerCase();
        if (name === target || name.includes(target)) return key;
    }
    return null;
}

// Cultural detection function
function detectCulture(userMessage) {
    if (!cameroonianCultures) return null;
    const message = String(userMessage || '').toLowerCase();
    const cultures = Object.keys(cameroonianCultures);

    for (let culture of cultures) {
        const keyLower = culture.toLowerCase();
        const nameLower = (cameroonianCultures[culture].name || '').toLowerCase();
        if (message.includes(keyLower) || message.includes(nameLower)) {
            return culture;
        }
    }
    return null; // No specific culture detected
}

// Translation function (using free API)
async function translateToLocalDialect(text, targetLanguage) {
    try {
        // set a short timeout to avoid hanging the request if the external API is slow
        const response = await axios.post('https://libretranslate.com/translate', {
            q: text,
            source: 'en',
            target: getLanguageCode(targetLanguage),
            format: 'text'
        }, { timeout: 4000 }); // 4s timeout

        return response.data.translatedText;
    } catch (error) {
        console.error('Translation error (fallback):', error?.message || error);
        // return a fallback quickly so the client still gets the main response
        return `[Translation unavailable for ${targetLanguage}] ${text}`;
    }
}

function getLanguageCode(language) {
    const languageMap = {
        'Medumba': 'fr', // Note: Using French as placeholder
        'Bassa': 'fr', 
        'Mokpwe': 'fr',
        'Fulfulde': 'fr'
        // Add actual language codes when available
    };
    return languageMap[language] || 'fr';
}

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message: rawMessage, selectedCulture } = req.body || {};
        const message = (typeof rawMessage === 'string' ? rawMessage.trim() : '');

        if (!message) return res.status(400).json({ error: 'Missing message in request body' });

        let detectedCulture = null;
        if (selectedCulture) {
            const found = findCultureKey(selectedCulture);
            if (found) detectedCulture = found;
        }
        if (!detectedCulture) detectedCulture = detectCulture(message);

        const ai = await generateCulturalResponse(message, detectedCulture);
        const aiText = (typeof ai === 'object' && ai.text) ? ai.text : String(ai);
        const aiHtml = (typeof ai === 'object' && ai.html) ? ai.html : aiText.replace(/\n/g, '<br>');

        let translation = '';
        if (detectedCulture) {
            const targetLanguage = cameroonianCultures[detectedCulture].language;
            translation = await translateToLocalDialect(aiText, targetLanguage);
        }

        res.json({
            response: aiText,
            responseHtml: aiHtml,
            translation,
            detectedCulture: detectedCulture ? cameroonianCultures[detectedCulture].name : 'General',
            originalQuestion: message
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to process your question' });
    }
});

// Cultural response generator
async function generateCulturalResponse(userMessage, culture) {
    if (culture && cameroonianCultures[culture]) {
        const c = cameroonianCultures[culture];

        // plain text format (one per line)
        const stepsText = Array.isArray(c.marriageSteps) && c.marriageSteps.length
            ? c.marriageSteps.map((s, i) => ` ${i + 1}. ${s}`).join('\n')
            : ' No specific steps available.';
        const traditionsText = Array.isArray(c.traditions) && c.traditions.length
            ? c.traditions.map(t => ` - ${t}`).join('\n')
            : ' No specific traditions available.';

        const text = `Traditional marriage information for ${c.name}: Marriage steps:\n${stepsText}\nTraditions:\n${traditionsText}\nAsk for more detail on any step if you need it`;

        // HTML version - preserves the same line structure but renders properly in browser
        const stepsHtml = Array.isArray(c.marriageSteps) && c.marriageSteps.length
            ? c.marriageSteps.map((s, i) => ` ${i + 1}. ${escapeHtml(s)}<br>`).join('')
            : ' No specific steps available.<br>';
        const traditionsHtml = Array.isArray(c.traditions) && c.traditions.length
            ? c.traditions.map(t => ` - ${escapeHtml(t)}<br>`).join('')
            : ' No specific traditions available.<br>';

        const html = `<div>Traditional marriage information for <strong>${escapeHtml(c.name)}</strong>:<br>` +
                     `<strong>Marriage steps:</strong><br>${stepsHtml}<strong>Traditions:</strong><br>${traditionsHtml}` +
                     `<em>Ask for more detail on any step if you need it</em></div>`;

        return { text, html };
    }

    // fallback - return both forms
    const text = `Cameroonian traditional marriages vary by ethnic group. The main cultures include:\n- Bamileke\n- Bassa\n- Bakweri\n- Fulani\n\nPlease specify which culture you're interested in for detailed information!`;
    const html = `<div>Cameroonian traditional marriages vary by ethnic group.<br>` +
                 `<ul><li><strong>Bamileke</strong></li><li><strong>Bassa</strong></li><li><strong>Bakweri</strong></li><li><strong>Fulani</strong></li></ul>` +
                 `Please specify which culture you're interested in for detailed information!</div>`;
    return { text, html };
}

// helper to escape HTML
function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
}

// serve static files (adjust 'public' if your frontend is in a different folder)
app.use(express.static(path.join(__dirname))); 

// fallback to index.html for GET /
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Cultural AI Chatbot running on port ${PORT}`);
});