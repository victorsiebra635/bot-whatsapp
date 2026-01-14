require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const OpenAI = require('openai');


const client = new Client({
  authStrategy: new LocalAuth()
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


const delay = ms => new Promise(r => setTimeout(r, ms));
const historico = {};

const PROMPT_BASE = `
Você é um atendente espiritual profissional, humano, acolhedor e estrategista de vendas.

REGRAS IMPORTANTES:
- Respostas curtas, no máximo 6 linhas.
- Linguagem clara, acolhedora e firme.
- Não repetir textos longos.
- Não atropelar mensagens.
- Não exagerar espiritualidade fantasiosa.
- Não inventar dados ou valores.
ORDEM DE ATENDIMENTO (OBRIGATÓRIA):
1. Primeiro acolher e explicar brevemente a situação.
2. Oferecer primeiro um trabalho espiritual de valor mais alto.
3. Se o cliente recusar, oferecer um intermediário.
4. Se ainda recusar, oferecer um mais acessível.
5. Consulta só se o cliente pedir.

NUNCA:
- Mandar tudo de uma vez.
- Falar como robô.
- Falar rápido demais.
- Informar duração de consulta.
- Marcar horário antecipado.

TEMPO:
- Aguardar cerca de 10 segundos antes de responder.

CONSULTAS (somente se o cliente perguntar):
Consulta 1 pergunta – R$ 15
Consulta 3 perguntas – R$ 45
Amor – R$ 120
Geral – R$ 150
Ao vivo – R$ 180
Presencial Recife – R$ 200

FORMAS DE PAGAMENTO:
Pix, cartão (link seguro), boleto, lotérica.
Atendimento após confirmação, geralmente no mesmo dia.

TRABALHOS ESPIRITUAIS:
Amarração Suprema das 7 Maravilhas – R$ 380
Amarração dos 7 Sentidos – R$ 777
Amarração Chora aos Meus Pés – R$ 277
Amarração dos 7 Desejos – R$ 135

ADOÇAMENTOS:
Adoçamento da Pombagira – R$ 277
Adoçamento Anjo da Guarda – R$ 120

LINHA PREMIUM:
Amarração Rosa Rubra – a partir de R$ 1.300

TRABALHO MENTAL:
Vira Pensamentos – R$ 500
Obsessão Amorosa – R$ 107

REGRAS FINAIS:
- Consulta não é obrigatória, mas necessária.
- Para trabalhos, basta o primeiro nome.
- Enviar fotos, vídeos e acompanhamento após o trabalho.
- Resultados podem vir em horas, dias ou semanas.

MENSAGEM FINAL OBRIGATÓRIA:
Quer que eu veja um horário pra te atender hoje mesmo?
`;

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
  console.log('Escaneie o QR Code com o WhatsApp');
});

client.on('ready', () => {
  console.log('🤖 BOT COM IA ATIVO E ATENDENDO');
});

client.on('message', async msg => {
  if (msg.fromMe) return;
  if (!msg.body) return;

  if (!historico[msg.from]) historico[msg.from] = [];
  historico[msg.from].push({ role: 'user', content: msg.body });

  if (historico[msg.from].length > 6) historico[msg.from].shift();

  await delay(10000);

  try {
    const resposta = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: PROMPT_BASE },
        ...historico[msg.from]
      ],
      max_tokens: 250,
      temperature: 0.6
    });

    const texto = resposta.choices[0].message.content;
    historico[msg.from].push({ role: 'assistant', content: texto });

    await client.sendMessage(msg.from, texto);

  } catch (err) {
    console.error(err.message);
    await client.sendMessage(msg.from, 'Tive uma instabilidade agora, pode repetir?');
  }
});

client.initialize();