const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');

// ==================== CONFIGURAÇÕES ====================
const client = new Client({
    authStrategy: new LocalAuth()
});

const CONFIG = {
    EXPIRATION_TIME: 60 * 60 * 1000,
    TYPING_DELAY: 2000,
    DATA_FILE: './atendimentos.json',
    
    LINKS: {
        PAGAMENTO_ONLINE: 'http://link.mercadopago.com.br/studiobrunamakeup',
        PIX: '79998186347',
        INSTAGRAM: 'https://www.instagram.com/studiobrunamakeup',
        PIX_BENEFICIARIO: 'Bruna Fabricia Moura Santos',
        PIX_BANCO: 'Mercado Pago'
    },
    
    PDFS: {
        PRODUCOES: './pdfs/producoes.pdf',
        NOIVAS: './pdfs/noivas.pdf',
        CURSO_VIP: './pdfs/curso-vip.pdf'
    },
    
    CURSOS: {
        '1': { 
            nome: 'Aperfeiçoamento Express', 
            duracao: '1 dia (6 horas)',
            entrada: 100.00,
            descricao: '✨ Marketing para maquiadores\n✨ 1 técnica de pele completa\n✨ Correção de manchas e olheiras\n✨ 1 técnica de olho\n✨ Aplicação de glitter e pigmento\n✨ Cílios postiços\n✨ Fotos e vídeos profissionais'
        },
        '2': { 
            nome: 'Aperfeiçoamento Avançado', 
            duracao: '2 dias (12 horas)',
            entrada: 150.00,
            descricao: '🌟 Marketing avançado + Consultoria VIP\n🌟 Colorimetria e visagismo\n🌟 2 tipos de preparação de pele\n🌟 2 técnicas de olhos\n🌟 Composição de produtos\n🌟 Fotos, vídeos e iluminação\n🌟 Estratégias de mercado'
        }
    }
};

// ==================== MENSAGENS ====================
const MESSAGES = {
    welcome: (name) => `Olá *${name}!* 😊✨\n\nSeja bem-vinda ao *Studio Bruna Makeup* 💄\n\n📋 *MENU PRINCIPAL*\n\n1️⃣ Serviços e agendamentos 💅📅\n2️⃣ Cursos profissionais 🎓\n3️⃣ Falar com atendente 👋\n4️⃣ Ver localização 📍\n5️⃣ Ver portfólio 📸\n\n*Digite o número da opção desejada* 👇`,
    servicos: `💅 *SERVIÇOS E AGENDAMENTOS*\n\nEscolha:\n\n1️⃣ Ver tabela de preços 💰\n2️⃣ Pacotes para noivas 👰💍\n3️⃣ Agendar atendimento 📅\n4️⃣ Realizar pagamento 💳\n5️⃣ Voltar ao menu 🔙`,
    tabelaPrecos: `💰 *TABELA DE PREÇOS*\n\nEnviando catálogo...`,
    noivas: `👰💍 *PACOTES PARA NOIVAS*\n\nEnviando catálogo...`,
    cursos: `🎓 *CURSOS VIP*\n\n1️⃣ Express (1 dia)\n2️⃣ Avançado (2 dias)\n3️⃣ Voltar 🔙\n\nDigite o número para ver detalhes:`,
    cursoDetalhes: (tipo) => {
        const curso = CONFIG.CURSOS[tipo];
        return `🎓 *${curso.nome}*\n\n⏰ Duração: ${curso.duracao}\n💰 Entrada: R$ ${curso.entrada.toFixed(2)}\n\n📚 Conteúdo:\n${curso.descricao}\n\nDeseja agendar?\nDigite *SIM* ou *MENU*`;
    },
    agendamento: (name) => `📅 *AGENDAMENTO*\n\nOlá *${name}*, envie:\n\n📝 Nome\n📅 Data (DD/MM/AAAA)\n⏰ Horário (HH:MM)\n💅 Serviço\n\nExemplo:\nNome: Maria\nData: 20/12/2025\nHorário: 14:00\nServiço: Maquiagem`,
    agendamentoCurso: (name, tipoCurso) => {
        const curso = CONFIG.CURSOS[tipoCurso];
        return `📅 *AGENDAMENTO DO CURSO*\n\nCurso: *${curso.nome}*\nEntrada: R$ ${curso.entrada.toFixed(2)}\n\nEnvie:\nNome\nData desejada\nHorário`;
    },
    confirmacao: (data) => `CONFIRME:\n\nNome: ${data.nome}\nData: ${data.data}\nHorário: ${data.horario}\nServiço: ${data.servico}\n\nDigite *SIM* ou *CORRIGIR*`,
    pagamento: `💳 Escolha o pagamento:\n\n1️⃣ Pagamento Online\n2️⃣ PIX`,
    pagamentoOnline: `Link de pagamento:\n${CONFIG.LINKS.PAGAMENTO_ONLINE}`,
    pagamentoPix: `Chave PIX:\n${CONFIG.LINKS.PIX}\n\nEnvie o comprovante aqui.`,
    pagamentoConfirmado: `✅ PAGAMENTO CONFIRMADO!\nSeu horário está garantido!`,
    atendente: `👋 Transferindo para atendimento humano...`,
    localizacao: `📍 *LOCALIZAÇÃO*\n\nTv. Pedro José dos Santos, 38 - Lagarto-SE`,
    portfolio: `📸 Instagram:\n${CONFIG.LINKS.INSTAGRAM}`,
    dataError: `⚠️ Faltam informações. Verifique os dados e envie novamente.`,
    invalidOption: `Opção inválida. Digite *MENU*.`
};

// ==================== DADOS E ESTADOS ====================
const userStates = {};

function loadData() {
    try {
        if (fs.existsSync(CONFIG.DATA_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG.DATA_FILE, 'utf8'));
        }
    } catch {}
    return [];
}

function saveData(data) {
    try {
        const all = loadData();
        all.push({ ...data, timestamp: new Date().toISOString() });
        fs.writeFileSync(CONFIG.DATA_FILE, JSON.stringify(all, null, 2));
    } catch {}
}

// ==================== QR CODE (CORRIGIDO) ====================
client.on('qr', qr => {
    console.clear();
    console.log('📱 ESCANEIE O QR CODE ABAIXO:\n');

    try {
        qrcode.generate(qr, { small: true });
    } catch (err) {
        console.log('❌ Erro ao gerar QR Code:', err.message);
        console.log('💡 Tente outro terminal (CMD / PowerShell / VSCode).');
    }

    console.log('\nAbra o WhatsApp → Aparelhos conectados → Conectar\n');
});

// ==================== EVENTOS DO WHATSAPP ====================
client.on('ready', () => console.log('✅ Bot conectado!'));
client.on('authenticated', () => console.log('🔐 Autenticado!'));
client.on('auth_failure', () => console.log('❌ Falha na autenticação!'));
client.on('disconnected', r => console.log('⚠️ Bot desconectado:', r));

// ==================== PARSERS ====================
function validateDate(dateStr) {
    const r = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!r.test(dateStr)) return false;
    const [, d, m, y] = dateStr.match(r);
    const date = new Date(y, m - 1, d);
    return date >= new Date();
}

function validateTime(t) {
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(t);
}

function parseAgendamento(text) {
    const d = {};
    const nome = text.match(/nome:?\s*(.+)/i);
    const data = text.match(/\d{2}\/\d{2}\/\d{4}/);
    const hora = text.match(/\d{1,2}:\d{2}/);
    const serv = text.match(/servi[çc]o:?\s*(.+)/i);

    if (nome) d.nome = nome[1].trim();
    if (data) d.data = data[0];
    if (hora) d.horario = hora[0];
    if (serv) d.servico = serv[1].trim();

    return d;
}

// ==================== FUNÇÕES AUXILIARES ====================
const delay = ms => new Promise(r => setTimeout(r, ms));

async function sendTyping(chat, msg) {
    await chat.sendStateTyping();
    await delay(1500);
    await client.sendMessage(chat.id._serialized, msg);
}

function updateUserState(id, updates) {
    if (!userStates[id]) userStates[id] = {};
    userStates[id] = { ...userStates[id], ...updates };
}

// ==================== FLUXO PRINCIPAL ====================
client.on('message', async msg => {
    try {
        const userId = msg.from;
        const body = msg.body.trim();
        const chat = await msg.getChat();
        const contact = await msg.getContact();
        const name = contact.pushname || "Cliente";

        if (msg.isGroup) return;

        // Comando global MENU
        if (/^(menu|início|inicio)$/i.test(body)) {
            await sendTyping(chat, MESSAGES.welcome(name));
            updateUserState(userId, { step: 'menu', name });
            return;
        }

        // Início de conversa
        if (!userStates[userId] && /(oi|olá|ola|hey|opa|bom|boa)/i.test(body)) {
            await sendTyping(chat, MESSAGES.welcome(name));
            updateUserState(userId, { step: 'menu', name });
            return;
        }

        // Se não existe estado
        if (!userStates[userId]) {
            await sendTyping(chat, "Digite *MENU* para começar.");
            return;
        }

        const step = userStates[userId].step;

     // ============= MENU PRINCIPAL =============
if (step === 'menu') {
    if (body === '1') {
        await sendTyping(chat, MESSAGES.servicos);
        updateUserState(userId, { step: 'servicos' });

    } else if (body === '2') {
        await sendTyping(chat, MESSAGES.cursos);
        updateUserState(userId, { step: 'cursos' });

    } else if (body === '3') {
        await sendTyping(chat, MESSAGES.atendente);
        delete userStates[userId];

    } else if (body === '4') {
        await sendTyping(chat, MESSAGES.localizacao);

    } else if (body === '5') {
        await sendTyping(chat, MESSAGES.portfolio);

    } else if (body === '6') { // NOVA OPÇÃO PARA ORÇAMENTOS
        await sendTyping(chat, "📄 Aqui está nosso PDF de orçamentos:");
        await sendFile(chat, "PRODUCAO.pdf"); // envia o PDF
        updateUserState(userId, { step: 'menu' });

    } else {
        await sendTyping(chat, MESSAGES.invalidOption);
    }
    return;
}
// ============= SERVIÇOS =============
if (step === 'servicos') {
    if (body === '1') {
        await sendTyping(chat, MESSAGES.tabelaPrecos);
    } else if (body === '2') {
        await sendTyping(chat, MESSAGES.noivas);
    } else if (body === '3') {
        await sendTyping(chat, MESSAGES.agendamento(name));
        updateUserState(userId, { step: 'agendamento' });
    } else if (body === '4') {
        await sendTyping(chat, MESSAGES.pagamento);
        updateUserState(userId, { step: 'pagamento' });
    } else if (body === '5') {
        await sendTyping(chat, MESSAGES.welcome(name));
        updateUserState(userId, { step: 'menu' });
    } else if (body === '6') { // NOVA OPÇÃO PARA ORÇAMENTOS
        await sendTyping(chat, "📄 Aqui está nosso PDF de orçamentos:");
        await sendFile(chat, "PRODUCAO.pdf"); // envia o PDF
        updateUserState(userId, { step: 'menu' });
    } else {
        await sendTyping(chat, MESSAGES.invalidOption);
    }
    return;
}

        // ============= CURSOS =============
        if (step === 'cursos') {
            if (['1', '2'].includes(body)) {
                await sendTyping(chat, MESSAGES.cursoDetalhes(body));
                updateUserState(userId, { step: 'curso_confirmar', tipoCurso: body });

            } else if (body === '3') {
                await sendTyping(chat, MESSAGES.welcome(name));
                updateUserState(userId, { step: 'menu' });

            } else {
                await sendTyping(chat, MESSAGES.invalidOption);
            }
            return;
        }

        if (step === 'curso_confirmar') {
            if (body.toUpperCase() === 'SIM') {
                const tipo = userStates[userId].tipoCurso;
                await sendTyping(chat, MESSAGES.agendamentoCurso(name, tipo));
                updateUserState(userId, { step: 'agendamento' });
            } else {
                await sendTyping(chat, "Digite SIM ou MENU");
            }
            return;
        }

       // ============= AGENDAMENTO =============
if (step === 'agendamento') {
    const data = parseAgendamento(body);
    data.nome = data.nome || name;

    if (!data.data || !validateDate(data.data) ||
        !data.horario || !validateTime(data.horario) ||
        !data.servico) {
        await sendTyping(chat, MESSAGES.dataError);
        return;
    }

    updateUserState(userId, { step: 'confirmar_agendamento', agendamento: data });
    await sendTyping(chat, MESSAGES.confirmacao(data));
    return;
}

// ============= CONFIRMAÇÃO =============
if (step === 'confirmar_agendamento') {
    const resposta = body.toUpperCase();

    if (resposta === 'SIM') {
        await sendTyping(chat, MESSAGES.pagamento);
        updateUserState(userId, { step: 'pagamento' });

    } else if (resposta === 'VOLTAR' || resposta === 'MENU') {
        await sendTyping(chat, MESSAGES.welcome(name));
        updateUserState(userId, { step: 'menu' });

    } else {
        await sendTyping(chat, "Digite *SIM* para confirmar ou *VOLTAR* para retornar ao menu.");
    }
    return;
}

        // ============= PAGAMENTO =============
        if (step === 'pagamento') {
            if (body === '1') {
                await sendTyping(chat, MESSAGES.pagamentoOnline);
                updateUserState(userId, { step: 'comprovante' });

            } else if (body === '2') {
                await sendTyping(chat, MESSAGES.pagamentoPix);
                updateUserState(userId, { step: 'comprovante' });

            } else {
                await sendTyping(chat, MESSAGES.invalidOption);
            }
            return;
        }

        // ============= COMPROVANTE =============
        if (step === 'comprovante') {
            if (msg.hasMedia || /(paguei|pago|pix|comprovante)/i.test(body)) {
                saveData({
                    userId,
                    ...userStates[userId].agendamento,
                    status: 'pago'
                });

                await sendTyping(chat, MESSAGES.pagamentoConfirmado);
                updateUserState(userId, { step: 'menu' });
            } else {
                await sendTyping(chat, "Envie o comprovante ou digite MENU.");
            }
            return;
        }

    } catch (err) {
        console.log('❌ Erro:', err);
    }
});

// ==================== INICIALIZAR ====================
console.log('🚀 Iniciando bot...');
client.initialize();