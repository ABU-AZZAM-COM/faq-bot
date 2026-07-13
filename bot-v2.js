// ============================================
// المساعد الذكي - التبصيم
// النسخة المطورة بالكامل
// ============================================

// ===== تحميل الإعدادات =====
let configData = {};
let openRouterKey = '';
let deepseekKey = '';
let provider = 'openrouter';
let assistantConfig = { name: 'مساعد التبصيم', personality: 'مهذب' };
let isProcessing = false;
let activeChatId = null;
let chatsData = {};
let allKnowledge = {};

const CHATS_KEY = 'tabasim_chats';
const ACTIVE_CHAT_KEY = 'tabasim_active_chat';
const DB_CACHE_KEY = 'tabasim_knowledge_cache';

// ===== Firebase Config =====
if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.database();
const settingsRef = db.ref('tabasimSettings');

// ===== قاعدة المعرفة本地 =====
const KNOWLEDGE_BASE = {
    personal_docs: {
        name: 'الثبوتيات الشخصية',
        keywords: ['هوية', 'هويه', 'بطاقة', 'بطاقه', 'تبصيم', 'التبصيم', 'ورق', 'أوراق', 'شخصي', 'شخصية', 'إخراج قيد', 'اخراج قيد', 'القيد', 'قيد', 'رقم وطني', 'دفتر عائلة', 'دفتر عائله', 'عائلة', 'عائله'],
        content: 'يُعتمد على واحدة فقط من الوثائق التالية كثبوت شخصي عند التبصيم:\n\n1. الهوية الشخصية القديمة\n2. إخراج القيد الحديث (يتضمن الرقم الوطني + صورة شخصية مختومة بحيث نصف الختم على الورقة والنصف على الصورة)\n3. دفتر العائلة باسم الزوج (للمتزوجين فقط ويحتوي على صورة الزوج)',
        faq: [
            { q: ['ما هي الأوراق المطلوبة', 'وش الأوراق', 'ايش احتاج', 'كيف أتبصم', 'ورق التبصيم', 'الوثائق المطلوبة'], a: 'يُعتمد على واحدة فقط من الوثائق التالية:\n\n1. الهوية الشخصية القديمة\n2. إخراج القيد الحديث (يتضمن الرقم الوطني وصورة مختومة)\n3. دفتر العائلة باسم الزوج (للمتزوجين فقط)' },
            { q: ['الهوية القديمة', 'هويتي قديمة', 'هل تقبل الهوية'], a: 'نعم، الهوية الشخصية القديمة مقبولة كثبوت شخصي عند التبصيم.' },
            { q: ['إخراج القيد', 'اخراج قيد', 'شروط الإخراج'], a: 'يجب أن يكون إخراج القيد حديثاً ويحتوي على:\n- الرقم الوطني\n- صورة شخصية مختومة (نصف الختم على الورقة والنصف على الصورة)' },
            { q: ['دفتر العائلة', 'دفتر عائلتي'], a: 'يُقبل دفتر العائلة كثبوت شخصي شريطة أن يكون باسم الزوج (للمتزوجين فقط) ويحتوي على صورة الزوج.' }
        ]
    },
    marriage_docs: {
        name: 'ثبوتيات الزواج',
        keywords: ['زواج', 'زوج', 'زوجة', 'متزوج', 'عقد', 'محكمة', 'شيخ', 'بيان عائلي', 'بيان عائله', 'ثبتيات زواج'],
        content: 'ثبوتيات الزواج المقبولة:\n\n1. دفتر العائلة (قديم أو إنقاذ)\n2. البيان العائلي المختوم\n\nغير مقبول:\n- عقد المحكمة (مختوم أو غير مختوم)\n- عقد الشيخ',
        faq: [
            { q: ['ثبوتيات الزواج', 'ورق الزواج', 'أي ورقة للزواج'], a: 'تُقبل إحدى الوثيقتين التاليتين:\n1. دفتر العائلة (قديم أو إنقاذ)\n2. البيان العائلي المختوم' },
            { q: ['عقد المحكمة', 'المحكمة'], a: 'لا، عقد المحكمة غير مقبول إطلاقاً كثبوت زواج، سواء كان مختوماً أو غير مختوم.' },
            { q: ['عقد الشيخ', 'الشيخ'], a: 'لا، عقد الشيخ غير مقبول إطلاقاً كثبوت زواج.' }
        ]
    },
    education: {
        name: 'الشهادات العلمية',
        keywords: ['شهادة', 'شهاده', 'شهادات', 'تعليم', 'دراسة', 'جامعة', 'جامعه', 'مؤهل', 'أكاديمي'],
        content: 'الشهادات العلمية المقبولة:\n\n1. تُعتمد أعلى شهادة علمية حصل عليها الأخ\n2. يجب أن تكون أصلية أو صورة مصدقة أصولاً\n3. الصور غير المصدقة غير مقبولة\n4. في حال عدم وجود أي شهادة يُثبت المؤهل "ابتدائي"\n\nالشهادات الأجنبية:\n- يجب ترجمتها إلى العربية\n- تصديقها من الجهات المختصة',
        faq: [
            { q: ['شهادة علمية', 'الشهادات', 'أعلى شهادة', 'مؤهل'], a: 'تُعتمد أعلى شهادة علمية حصل عليها الأخ، ويجب أن تكون أصلية أو صورة مصدقة أصولاً.' },
            { q: ['ما عندي شهادة', 'بدون شهادة', 'لا أملك شهادة'], a: 'في حال عدم وجود أي شهادة علمية، يُثبت المؤهل العلمي على أنه "ابتدائي".' },
            { q: ['الصور المصدقة', 'صورة مصدقة', 'الشهادة الأصلية'], a: 'يجب أن تكون الشهادة أصلية أو صورة مصدقة أصولاً. الصور غير المصدقة غير مقبولة.' },
            { q: ['شهادة أجنبية', 'الشهادة الأجنبية', 'ترجمة'], a: 'الشهادات الأجنبية يجب أن تكون مترجمة إلى اللغة العربية ومصدقة أصولاً من الجهات المختصة.' }
        ]
    },
    north_syria: {
        name: 'شهادات الشمال السوري',
        keywords: ['شمال', 'سوري', 'ادلب', 'حلب', 'الشمال السوري', 'شهادات جامعية', 'تصديق', 'جامعة إدلب', 'حلب الحرة', 'حلب الشهباء', 'وزارة التعليم العالي'],
        content: 'شهادات الشمال السوري:\n\nتتطلب جميعها تصديقاً رسمياً من وزارة التعليم العالي، باستثناء:\n- جامعة إدلب\n- جامعة حلب الحرة\n- جامعة حلب الشهباء\n\nمدة القبول: 6 أشهر من تاريخ التثبيت\nفي حال عدم استكمال التصديق: يتم حذف الشهادة',
        faq: [
            { q: ['شهادات الشمال', 'الشمال السوري', 'صداق الشمال'], a: 'جميع الشهادات الجامعية الصادرة في الشمال السوري تتطلب تصديقاً رسمياً من وزارة التعليم العالي، باستثناء شهادات جامعة إدلب وحلب الحرة وحلب الشهباء.' },
            { q: ['6 أشهر', 'المدة', 'مدة القبول'], a: 'تُقبل الشهادات لمدة 6 أشهر من تاريخ تثبيتها في السجلات، وذلك لإتاحة الفرصة لاستكمال إجراءات التصديق. إذا لم يتم الاستكمال، يتم حذف الشهادة.' },
            { q: ['المعاهد', 'شهادة معهد', 'المعاهد الشرعية'], a: 'شهادات المعاهد التابعة لجميع الوزارات (بما فيها المعاهد الشرعية والمهنية) مقبولة، ولكن يجب أن تحمل تصديقاً حديثاً من الوزارة المختصة.' }
        ]
    },
    migrants: {
        name: 'ثبوتيات المهاجرين',
        keywords: ['مهاجر', 'مهاجرين', 'هجرة', 'الشعب المدنية', 'الشعبة', 'نازح'],
        content: 'ثبوتيات المهاجرين:\n\n1. الثبوتيات الشخصية والزواجية: تُستخرج من الشعب المدنية في مناطق التواجد\n2. الشهادات العلمية: يُكتفى بترجمتها وتصديقها من نفس الشعب',
        faq: [
            { q: ['المهاجرين', 'مهاجر', 'هجرة', 'نازح'], a: 'الثبوتيات الشخصية وثبوتيات الزواج يتم استخراجها من الشعب المدنية في مناطق التواجد. الشهادات العلمية يُكتفى بترجمتها وتصديقها من تلك الشعب.' }
        ]
    },
    general: {
        name: 'ملاحظات عامة',
        keywords: ['ملاحظات', 'عامة', 'مجالس', 'محلية', 'صور', 'إلكترونية', 'جوال', 'هاتف', 'نسخ', 'واضحة'],
        content: 'ملاحظات عامة مهمة:\n\n- هويات المجالس المحلية غير مقبولة\n- الأولاد غير المسجلين في دفتر العائلة لن يتم تسجيلهم\n- الصور الإلكترونية للوثائق (صور الجوال) غير مقبولة\n- يجب أن تكون جميع الوثائق واضحة ومقروءة\n- النسخ يجب أن تكون مصدقة من الجهات الحكومية',
        faq: [
            { q: ['هوية المجلس', 'مجالس محلية', 'هويات المجالس'], a: 'هويات المجالس المحلية غير مقبولة لأنها لا تحتوي على البيانات المطلوبة (الرقم الوطني، مكان القيد، الخانة).' },
            { q: ['صور الجوال', 'الصور الإلكترونية', 'الموبايل'], a: 'الصور الإلكترونية للوثائق (صور الجوال) غير مقبولة. يجب تقديم الوثائق الورقية.' }
        ]
    },
    special: {
        name: 'الحالات الخاصة',
        keywords: ['مكتوم', 'متوفى', 'متوفين', 'مكتومين', 'تعديل', 'حالة', 'مختار', 'محكمة', 'ضبط'],
        content: 'الحالات الخاصة (المكتومون أو المسجلون كمتوفين):\n\nيجب إحضار:\n1. ورقة تعريف من مختار الحي (تتضمن الصورة الشخصية)\n2. صورة عن ضبط المحكمة\n3. دفتر عائلة الأهل',
        faq: [
            { q: ['متوفى', 'مكتوم', 'تعديل حالة', 'سجلوني متوفى'], a: 'يجب إحضار: ورقة تعريف من مختار الحي تتضمن الصورة الشخصية، وصورة عن ضبط المحكمة، ودفتر عائلة الأهل.' }
        ]
    }
};

// ===== البحث المحلي الذكي =====
function smartLocalSearch(query) {
    const q = query.trim().toLowerCase();

    for (const [catId, cat] of Object.entries(KNOWLEDGE_BASE)) {
        if (cat.faq) {
            for (const faq of cat.faq) {
                for (const keyword of faq.q) {
                    if (q.includes(keyword.toLowerCase())) {
                        return faq.a;
                    }
                }
            }
        }
    }

    for (const [catId, cat] of Object.entries(KNOWLEDGE_BASE)) {
        let score = 0;
        for (const kw of cat.keywords) {
            if (q.includes(kw.toLowerCase())) score++;
        }
        if (score > 0) return cat.content;
    }

    if (q.includes('كم عدد') || q.includes('العدد الكلي')) {
        return 'هذا البوت مخصص للإجابة على أسئلة التبصيم فقط.';
    }

    return null;
}

// ===== أدوات Function Calling =====
const tools = [
    { type: "function", function: { name: "get_fingerprint_info", description: "الحصول على معلومات عن نوع معين من الوثائق المطلوبة للتبصيم", parameters: { type: "object", properties: { doc_type: { type: "string", enum: ["personal", "marriage", "education", "north_syria", "migrants", "special", "general"] } }, required: ["doc_type"] } } },
    { type: "function", function: { name: "search_faq", description: "البحث عن إجابة لسؤال شائع بخصوص التبصيم", parameters: { type: "object", properties: { question: { type: "string" } }, required: ["question"] } } }
];

function executeTool(toolName, args) {
    switch (toolName) {
        case 'get_fingerprint_info': {
            const cat = KNOWLEDGE_BASE[args.doc_type];
            if (!cat) return 'نوع غير معروف.';
            return cat.content;
        }
        case 'search_faq': {
            const result = smartLocalSearch(args.question);
            return result || 'لم يتم العثور على إجابة محلية.';
        }
        default: return 'أداة غير معروفة.';
    }
}

// ===== استدعاء AI =====
async function callAI(messages) {
    const apiKey = provider === 'deepseek' ? deepseekKey : openRouterKey;
    if (!apiKey) return null;

    const url = provider === 'deepseek' ? 'https://api.deepseek.com/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };
    if (provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://tabasim-bot.firebaseapp.com';
        headers['X-Title'] = 'TabasimBot';
    }

    const model = provider === 'deepseek' ? 'deepseek-chat' : 'google/gemini-2.5-flash';
    const body = JSON.stringify({ model, messages, tools, tool_choice: 'auto', temperature: 0.3, max_tokens: 1024 });

    try {
        const res = await fetch(url, { method: 'POST', headers, body });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) { return null; }
}

async function processAI(messages) {
    const response = await callAI(messages);
    if (!response) return null;

    const msg = response.choices?.[0]?.message;
    if (!msg) return null;

    if (msg.tool_calls?.length) {
        messages.push(msg);
        for (const tc of msg.tool_calls) {
            const args = JSON.parse(tc.function.arguments);
            const result = executeTool(tc.function.name, args);
            messages.push({ role: 'tool', tool_call_id: tc.id, content: result });
        }
        const finalResp = await callAI(messages);
        return finalResp?.choices?.[0]?.message?.content || null;
    }

    return msg.content || null;
}

// ===== واجهة المستخدم =====
function addMsg(text, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const d = document.createElement('div');
    d.className = `message ${sender}`;
    if (sender === 'bot') {
        d.innerHTML = `<span class="sender">${assistantConfig.name}</span>${formatBotMessage(text)}`;
    } else {
        d.textContent = text;
    }
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => copyBtn.innerHTML = '<i class="fas fa-copy"></i>', 1500);
        });
    });
    d.appendChild(copyBtn);
    chatMessages.appendChild(d);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function formatBotMessage(text) {
    return text
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>')
        .replace(/\n/g, '<br>');
}

function showTyping() {
    const chatMessages = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTyping() {
    const typing = document.getElementById('typing');
    if (typing) typing.remove();
}

// ===== نظام المحادثات =====
function loadChats() {
    try { chatsData = JSON.parse(localStorage.getItem(CHATS_KEY)) || {}; } catch { chatsData = {}; }
}
function saveChats() { localStorage.setItem(CHATS_KEY, JSON.stringify(chatsData)); }
function getActiveChat() { return localStorage.getItem(ACTIVE_CHAT_KEY); }
function setActiveChat(id) { localStorage.setItem(ACTIVE_CHAT_KEY, id); activeChatId = id; }

function createNewChat() {
    const id = 'chat_' + Date.now();
    chatsData[id] = { title: 'محادثة جديدة', messages: [], createdAt: new Date().toISOString() };
    saveChats(); setActiveChat(id); renderSidebar(); renderMessages();
}

function deleteChat(id) {
    delete chatsData[id]; saveChats();
    if (activeChatId === id) {
        const remaining = Object.keys(chatsData);
        if (remaining.length > 0) { setActiveChat(remaining[0]); } else { createNewChat(); return; }
    }
    renderSidebar(); renderMessages();
}

function renderSidebar() {
    const list = document.getElementById('sidebarList');
    const sorted = Object.entries(chatsData).sort((a, b) => new Date(b[1].createdAt) - new Date(a[1].createdAt));
    list.innerHTML = sorted.map(([id, chat]) => {
        const date = new Date(chat.createdAt).toLocaleDateString('ar-EG');
        const activeClass = id === activeChatId ? 'active' : '';
        return `<div class="chat-item ${activeClass}" data-id="${id}"><div class="chat-title">${chat.title}</div><div class="chat-date">${date}</div><button class="delete-chat" data-id="${id}"><i class="fas fa-times"></i></button></div>`;
    }).join('');

    list.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.delete-chat')) return;
            setActiveChat(item.dataset.id); renderSidebar(); renderMessages(); closeSidebar();
        });
    });
    list.querySelectorAll('.delete-chat').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('هل تريد حذف هذه المحادثة؟')) deleteChat(btn.dataset.id);
        });
    });
}

function saveMessageToActiveChat(role, text) {
    if (!chatsData[activeChatId]) createNewChat();
    chatsData[activeChatId].messages.push({ role, text, timestamp: new Date().toISOString() });
    if (role === 'user' && chatsData[activeChatId].title === 'محادثة جديدة') {
        chatsData[activeChatId].title = text.substring(0, 50) + (text.length > 50 ? '...' : '');
    }
    saveChats();
}

function renderMessages() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    const chat = chatsData[activeChatId];
    if (chat?.messages) {
        chat.messages.forEach(msg => {
            const d = document.createElement('div');
            d.className = `message ${msg.role}`;
            if (msg.role === 'bot') d.innerHTML = `<span class="sender">${assistantConfig.name}</span>${formatBotMessage(msg.text)}`;
            else d.textContent = msg.text;
            chatMessages.appendChild(d);
        });
    } else {
        chatMessages.innerHTML = `<div class="message bot"><span class="sender">${assistantConfig.name}</span>مرحباً! أنا مساعدك الذكي للإجابة على أسئلتك بخصوص الأوراق المطلوبة عند التبصيم.\n\nكيف يمكنني مساعدتك؟</div>`;
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ===== إرسال الرسالة =====
async function sendMessage() {
    if (isProcessing) return;
    const chatInput = document.getElementById('chatInput');
    const query = chatInput.value.trim();
    if (!query) return;

    isProcessing = true;
    addMsg(query, 'user');
    saveMessageToActiveChat('user', query);
    chatInput.value = '';

    const localResponse = smartLocalSearch(query);
    if (localResponse) {
        addMsg(localResponse, 'bot');
        saveMessageToActiveChat('bot', localResponse);
        isProcessing = false;
        return;
    }

    showTyping();

    const conversationHistory = [
        { role: 'system', content: `أنت ${assistantConfig.name}، مساعد ذكي متخصص في الإجابة على الأسئلة بخصوص الأوراق المطلوبة عند التبصيم في سوريا. لديك أدوات للبحث في قاعدة بيانات التبصيم. رد بالعربية الفصحى بشكل واضح ومفيد.` },
        ...(chatsData[activeChatId]?.messages || []).map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }))
    ];

    let response = await processAI(conversationHistory);
    if (!response) response = 'عذراً، لا أستطيع الإجابة حالياً. يرجى المحاولة مرة أخرى.';

    hideTyping();
    addMsg(response, 'bot');
    saveMessageToActiveChat('bot', response);
    renderSidebar();
    isProcessing = false;
}

// ===== Sidebar Controls =====
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const isOpen = sidebar.classList.contains('open');
    sidebar.classList.toggle('open', !isOpen);
    overlay.classList.toggle('show', !isOpen);
}
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
}

// ===== إعدادات AI =====
async function testProviderKey(key, providerType) {
    const url = providerType === 'deepseek' ? 'https://api.deepseek.com/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` };
    if (providerType === 'openrouter') { headers['HTTP-Referer'] = 'https://test'; headers['X-Title'] = 'Test'; }
    const model = providerType === 'deepseek' ? 'deepseek-chat' : 'google/gemini-2.5-flash';
    const body = JSON.stringify({ model, messages: [{ role: 'user', content: 'Say "ready" only.' }], max_tokens: 10 });

    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const res = await fetch(url, { method: 'POST', headers, body });
            const data = await res.json();
            if (data.choices?.[0]?.message?.content?.includes('ready')) return { ok: true };
        } catch (e) { console.warn(`Attempt ${attempt}: ${e.message}`); }
        if (attempt < 3) await new Promise(r => setTimeout(r, 1500 * attempt));
    }
    return { ok: false, msg: 'فشل الاتصال بعد 3 محاولات' };
}

async function loadConfig() {
    try {
        const snap = await settingsRef.once('value');
        const data = snap.val() || {};
        assistantConfig = { name: data.name || 'مساعد التبصيم', personality: data.personality || 'مهذب' };
        openRouterKey = data.openRouterKey || '';
        deepseekKey = data.deepseekKey || '';
        provider = data.provider || 'openrouter';
        document.getElementById('assistantName').textContent = assistantConfig.name;
    } catch (e) { console.log('Config load failed:', e); }
}

function showSettings() {
    const modal = document.getElementById('settingsModal');
    const content = document.getElementById('settingsContent');
    content.innerHTML = `
        <h3>⚙️ إعدادات المساعد</h3>
        <div class="section-card">
            <h4>🧠 الشخصية</h4>
            <div class="form-row"><label>اسم المساعد</label><input type="text" id="setName" value="${assistantConfig.name}"></div>
            <div class="form-row"><label>الشخصية</label><select id="setPersonality">
                <option value="مهذب" ${assistantConfig.personality === 'مهذب' ? 'selected' : ''}>مهذب</option>
                <option value="رسمي" ${assistantConfig.personality === 'رسمي' ? 'selected' : ''}>رسمي</option>
                <option value="ودود" ${assistantConfig.personality === 'ودود' ? 'selected' : ''}>ودود</option>
                <option value="صارم" ${assistantConfig.personality === 'صارم' ? 'selected' : ''}>صارم</option>
            </select></div>
        </div>
        <div class="section-card">
            <h4>☁️ مزود الذكاء الاصطناعي</h4>
            <div class="form-row"><label>المزود</label><select id="setProvider">
                <option value="openrouter" ${provider === 'openrouter' ? 'selected' : ''}>OpenRouter (Gemini)</option>
                <option value="deepseek" ${provider === 'deepseek' ? 'selected' : ''}>DeepSeek</option>
            </select></div>
            <div class="form-row"><label>مفتاح OpenRouter</label><input type="password" id="setOpenRouterKey" value="${openRouterKey}" placeholder="sk-or-v1-..."></div>
            <div class="form-row"><label>مفتاح DeepSeek</label><input type="password" id="setDeepseekKey" value="${deepseekKey}" placeholder="sk-..."></div>
            <button class="btn btn-ghost" id="testBtn">🔌 اختبار الاتصال</button> <span id="testStatus"></span>
        </div>
        <div style="display:flex; gap:10px; margin-top:20px;">
            <button class="btn btn-primary" id="saveBtn">💾 حفظ</button>
            <button class="btn btn-ghost" id="closeBtn">إغلاق</button>
        </div>`;

    document.getElementById('testBtn').onclick = async () => {
        const prov = document.getElementById('setProvider').value;
        const key = prov === 'deepseek' ? document.getElementById('setDeepseekKey').value.trim() : document.getElementById('setOpenRouterKey').value.trim();
        const el = document.getElementById('testStatus');
        if (!key) { el.textContent = 'أدخل المفتاح أولاً'; return; }
        el.textContent = 'جاري الاختبار...';
        const r = await testProviderKey(key, prov);
        el.textContent = r.ok ? '✅ متصل!' : `❌ ${r.msg}`;
        el.style.color = r.ok ? '#10b981' : '#ef4444';
    };

    document.getElementById('saveBtn').onclick = async () => {
        provider = document.getElementById('setProvider').value;
        openRouterKey = document.getElementById('setOpenRouterKey').value.trim();
        deepseekKey = document.getElementById('setDeepseekKey').value.trim();
        const name = document.getElementById('setName').value;
        const personality = document.getElementById('setPersonality').value;
        try {
            await settingsRef.set({ name, personality, provider, openRouterKey, deepseekKey });
        } catch (e) { console.log('Save failed:', e); }
        assistantConfig = { name, personality };
        document.getElementById('assistantName').textContent = name;
        modal.classList.remove('show');
    };

    document.getElementById('closeBtn').onclick = () => modal.classList.remove('show');
    modal.classList.add('show');
}

// ===== التهيئة =====
window.onload = async function() {
    loadChats();
    if (Object.keys(chatsData).length === 0) createNewChat();
    activeChatId = getActiveChat();
    if (!activeChatId || !chatsData[activeChatId]) {
        activeChatId = Object.keys(chatsData)[0];
        setActiveChat(activeChatId);
    }

    document.getElementById('menuBtn').addEventListener('click', toggleSidebar);
    document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('chatInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } });
    document.getElementById('newChatBtn').addEventListener('click', () => { createNewChat(); closeSidebar(); });
    document.getElementById('settingsBtn').addEventListener('click', showSettings);
    document.getElementById('backBtn').addEventListener('click', () => { window.location.href = 'index.html'; });

    document.getElementById('darkToggleBtn').addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('tabasimTheme', isDark ? 'dark' : 'light');
        const icon = document.getElementById('darkToggleBtn').querySelector('i');
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    });
    if (localStorage.getItem('tabasimTheme') === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkToggleBtn').querySelector('i').className = 'fas fa-sun';
    }

    renderSidebar();
    renderMessages();
    await loadConfig();
};
