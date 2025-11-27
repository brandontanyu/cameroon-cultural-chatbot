const axios = require('axios');
const culturesModule = require('../../cultures-data');
const cameroonianCultures = culturesModule.cameroonianCultures || culturesModule.default || culturesModule;

function escapeHtml(str){ return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }

function findCultureKey(identifier){
  if(!identifier || !cameroonianCultures) return null;
  const target = String(identifier).toLowerCase();
  for(const key of Object.keys(cameroonianCultures)){
    if(key.toLowerCase() === target) return key;
    const name = (cameroonianCultures[key].name || '').toLowerCase();
    if(name === target || name.includes(target)) return key;
  }
  return null;
}

function detectCulture(userMessage){
  if(!cameroonianCultures) return null;
  const message = String(userMessage || '').toLowerCase();
  for(const culture of Object.keys(cameroonianCultures)){
    if(message.includes(culture.toLowerCase())) return culture;
    const nameLower = (cameroonianCultures[culture].name || '').toLowerCase();
    if(message.includes(nameLower)) return culture;
  }
  return null;
}

function getLanguageCode(language){
  const map = { 'Medumba': 'fr','Bassa': 'fr','Mokpwe': 'fr','Fulfulde': 'fr' };
  return map[language] || 'fr';
}

async function translateToLocalDialect(text, targetLanguage){
  try{
    const res = await axios.post('https://libretranslate.com/translate', {
      q: text, source: 'en', target: getLanguageCode(targetLanguage), format: 'text'
    }, { timeout: 4000 });
    return res.data.translatedText;
  }catch(e){
    return `[Translation unavailable for ${targetLanguage}] ${text}`;
  }
}

function buildResponseForCulture(c){
  // plain text — each step/tradition on its own line
  const stepsText = Array.isArray(c.marriageSteps) && c.marriageSteps.length
    ? c.marriageSteps.map((s,i)=> `${i+1}. ${s}`).join('\n')
    : 'No specific steps available.';
  const traditionsText = Array.isArray(c.traditions) && c.traditions.length
    ? c.traditions.map(t=> `- ${t}`).join('\n')
    : 'No specific traditions available.';
  const text = `Traditional marriage information for ${c.name}: Marriage steps:\n${stepsText}\n\nTraditions:\n${traditionsText}\n\nAsk for more detail on any step if you need it`;

  // HTML — preserve those breaks so browser shows each item on its own line
  const stepsHtml = Array.isArray(c.marriageSteps) && c.marriageSteps.length
    ? c.marriageSteps.map((s,i)=> `${i+1}. ${escapeHtml(s)}<br>`).join('')
    : 'No specific steps available.<br>';
  const traditionsHtml = Array.isArray(c.traditions) && c.traditions.length
    ? c.traditions.map(t=> `- ${escapeHtml(t)}<br>`).join('')
    : 'No specific traditions available.<br>';
  const html = `<div>Traditional marriage information for <strong>${escapeHtml(c.name)}</strong>:<br><strong>Marriage steps:</strong><br>${stepsHtml}<br><strong>Traditions:</strong><br>${traditionsHtml}<br><em>Ask for more detail on any step if you need it</em></div>`;

  return { text, html };
}

exports.handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const message = (typeof body.message === 'string' ? body.message.trim() : '');
    if(!message) return { statusCode: 400, body: JSON.stringify({ error: 'Missing message' }) };

    let detectedCulture = null;
    if(body.selectedCulture) {
      const found = findCultureKey(body.selectedCulture);
      if(found) detectedCulture = found;
    }
    if(!detectedCulture) detectedCulture = detectCulture(message);

    // If culture found produce details, else give a fallback response
    let result;
    if(detectedCulture && cameroonianCultures[detectedCulture]) {
      result = buildResponseForCulture(cameroonianCultures[detectedCulture]);
    } else {
      const text = `Cameroonian traditional marriages vary by ethnic group. The main cultures include: - Bamileke - Bassa - Bakweri - Fulani\nPlease specify which culture you're interested in for detailed information!`;
      const html = `<div>Cameroonian traditional marriages vary by ethnic group.<br><ul><li>Bamileke</li><li>Bassa</li><li>Bakweri</li><li>Fulani</li></ul>Please specify which culture you're interested in for detailed information!</div>`;
      result = { text, html };
    }

    let translation = '';
    if(detectedCulture) {
      const targetLanguage = cameroonianCultures[detectedCulture].language;
      translation = await translateToLocalDialect(result.text, targetLanguage);
    }

    return { statusCode: 200, body: JSON.stringify({
      response: result.text,
      responseHtml: result.html,
      translation,
      detectedCulture: detectedCulture ? cameroonianCultures[detectedCulture].name : 'General',
      originalQuestion: message
    }) };
  } catch (err) {
    console.error('Function error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to process request' }) };
  }
};