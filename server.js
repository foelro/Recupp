const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('ERROR: Falta OPENAI_API_KEY en .env');
  process.exit(1);
}

app.post('/chat', async (req, res) => {
  const { messages, days } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages debe ser un array' });
  }

  try {
    const systemMessage = `Sos un acompañante empático especializado en recuperación de adicciones. Respondés en español rioplatense (vos, che, etc.). Sos cálido, honesto, sin juicios. Das respuestas cortas (2-4 oraciones máximo). Nunca diagnosticás ni reemplazás la ayuda profesional. El usuario lleva ${days || 0} días limpio. Si pregunta algo de crisis, animalo a llamar a un profesional o ir a un grupo.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 400,
        temperature: 0.8,
        messages: [
          { role: 'system', content: systemMessage },
          ...messages
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI error:', data);
      return res.status(response.status).json({
        error: data?.error?.message || 'Error al conectar con OpenAI'
      });
    }

    const reply = data.choices?.[0]?.message?.content?.trim() || 'Estoy acá. ¿Querés contarme más?';
    res.json({ reply });

  } catch (error) {
    console.error('Backend error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Un Paso backend corriendo en http://localhost:${PORT}`);
  console.log(`   POST /chat — chat con IA`);
  console.log(`   GET /health — verificar que está vivo`);
});
