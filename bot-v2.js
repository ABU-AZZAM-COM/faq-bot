// ============================================
// المساعد الذكي - نسخة الذكاء الاصطناعي فقط
// ============================================

// ===== تحميل الإعدادات =====
let configData = {};

async function loadConfig() {
    try {
        const response = await fetch('config.json');
        configData = await response.json();
        if (configData.encoded_key) {
            configData.api_key = atob(configData.encoded_key);
        }
    } catch (e) {
        console.log('Config error:', e);
        configData = {};
    }
}

function getSettings() {
    return {
        apiKey: configData.api_key || '',
        personality: localStorage.getItem('bot_personality') || 'formal',
        tone: localStorage.getItem('bot_tone') || 'victorian'
    };
}

// ===== system prompt =====
const SYSTEM_PROMPT = `أنت مساعد ذكي ومحترف للإجابة على الأسئلة بخصوص الأوراق المطلوبة عند التبصيم في سوريا.

معلوماتك الأساسية:

أولاً: الثبوتيات الشخصية المقبولة (واحدة فقط):
1. الهوية الشخصية القديمة
2. إخراج القيد الحديث (يتضمن الرقم الوطني + صورة شخصية مختومة بحيث نصف الختم على الورقة والنصف على الصورة)
3. دفتر العائلة باسم الزوج (للمتزوجين فقط ويحتوي على صورة الزوج)

ثانياً: ثبوتيات الزواج المقبولة (واحدة فقط):
- دفتر عائلة (قديم أو إنقاذ)
- بيان عائلي مختوم
غير مقبول: عقد المحكمة (مختوم أو غير مختوم) أو عقد الشيخ

ثالثاً: الشهادات العلمية:
- تُعتمد أعلى شهادة علمية حصل عليها الأخ
- في حال عدم وجود شهادة يُثبت المؤهل "ابتدائي"
- يجب أن تكون أصلية أو صورة مصدقة أصولاً (الصور غير المصدقة مرفوضة)
- الشهادات الأجنبية: تُترجم إلى العربية وتُصدق من الجهات المختصة

رابعاً: شهادات الشمال السوري:
- تتطلب تصديقاً رسمياً من وزارة التعليم العالي
- باستثناء: جامعة إدلب، جامعة حلب الحرة، جامعة حلب الشهباء (مقبولة مباشرة)
- تُقبل لمدة 6 أشهر من تاريخ التثبيت في السجلات
- إذا لم يتم استكمال التصديق خلالها يتم حذف الشهادة
- شهادات المعاهد (الشرعية والمهنية): تقبل بتصديق حديث من الوزارة المختصة

خامساً: المهاجرون:
- الثبوتيات الشخصية والزواجية: تُستخرج من الشعب المدنية في مناطق التواجد
- الشهادات العلمية: يُكتفى بترجمتها وتصديقها من تلك الشعب

سادساً: ملاحظات عامة:
- هويات المجالس المحلية غير مقبولة (لا تحتوي الرقم الوطني، مكان القيد، الخانة)
- الأولاد غير المسجلين في دفتر العائلة لن يتم تسجيلهم
- الصور الإلكترونية للوثائق (صور الجوال) غير مقبولة
- يجب أن تكون جميع الوثائق ورقية واضحة ومقروءة
- النسخ المأخوذة عن الوثائق الأصلية يجب أن تكون مصدقة من الجهات الحكومية المختصة
- أي وثيقة غير واضحة تعتبر غير مقبولة

سابعاً: الحالات الخاصة (المكتومون أو المسجلون كمتوفين):
- ورقة تعريف من مختار الحي ( حصراً ) تتضمن صورته الشخصية
- صورة عن ضبط المحكمة
- دفتر عائلة الأهل

قواعد الرد:
1. رد بالعربية الفصحى بشكل واضح ومباشر ومفيد
2. لا تستخدم عبارات طويلة غير ضرورية
3. إذا لم تجد إجابة في معلوماتك، قل ذلك بأدب
4. كن محترفاً ودقيقاً في المعلومات
5. استخدم التنسيق المناسب (قوائم، عناوين) لتسهيل القراءة`;

// ===== استدعاء AI API =====
async function callAI(userMessage) {
    const settings = getSettings();
    if (!settings.apiKey) {
        return 'عذراً، لم يتم العثور على مفتاح API. يرجى التأكد من إعدادات الاتصال.';
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + settings.apiKey
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.5,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            console.error('API Error:', response.status, err);
            return 'حدث خطأ في الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.\n\n(خطأ: ' + response.status + ')';
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) {
        console.error('API Call Failed:', e);
        return 'لا يمكن الاتصال بالذكاء الاصطناعي الآن. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.';
    }
}

// ===== واجهة المستخدم =====
function addMessage(text, isUser) {
    const chatArea = document.getElementById('chatArea');
    const msg = document.createElement('div');
    msg.className = 'message ' + (isUser ? 'user' : 'bot');
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.style.whiteSpace = 'pre-line';
    bubble.textContent = text;
    msg.appendChild(bubble);
    chatArea.appendChild(msg);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function showTyping() {
    document.getElementById('typingIndicator').classList.add('active');
    document.getElementById('chatArea').scrollTop = document.getElementById('chatArea').scrollHeight;
}

function hideTyping() {
    document.getElementById('typingIndicator').classList.remove('active');
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, true);
    input.value = '';
    showTyping();

    const response = await callAI(text);

    hideTyping();
    addMessage(response, false);
}

function askQuestion(q) {
    document.getElementById('chatInput').value = q;
    sendMessage();
}

function toggleSettings() {
    document.getElementById('settingsPanel').classList.toggle('active');
}

function saveSettings() {
    const personality = document.getElementById('personalitySelect').value;
    const tone = document.getElementById('toneSelect').value;
    localStorage.setItem('bot_personality', personality);
    localStorage.setItem('bot_tone', tone);
    document.getElementById('settingsPanel').classList.remove('active');
    addMessage('تم حفظ الإعدادات بنجاح!', false);
}

function updateStatus() {
    const settings = getSettings();
    const status = document.getElementById('aiStatus');
    if (settings.apiKey) {
        status.textContent = 'متصل بالذكاء الاصطناعي';
        status.style.color = '#4CAF50';
    } else {
        status.textContent = 'غير متصل - تحقق من الإعدادات';
        status.style.color = '#f44336';
    }
}

// ===== التهيئة =====
window.onload = async function() {
    await loadConfig();
    const settings = getSettings();
    document.getElementById('personalitySelect').value = settings.personality;
    document.getElementById('toneSelect').value = settings.tone;
    updateStatus();

    addMessage('مرحباً! أنا مساعدك الذكي للإجابة على أسئلتك بخصوص الأوراق المطلوبة عند التبصيم.\n\nكيف يمكنني مساعدتك؟', false);

    const quickDiv = document.getElementById('quickQuestions');
    const questions = [
        'ما هي الأوراق المطلوبة للتبصيم؟',
        'هل الهوية القديمة مقبولة؟',
        'ثبوتيات الزواج',
        'عقد المحكمة مقبول؟',
        'الشهادات الأجنبية',
        'شهادات الشمال السوري',
        'الحالات الخاصة',
        'صور الجوال مقبولة؟'
    ];
    let html = '<div class="quick-questions-title">اسئلة شائعة:</div>';
    for (const q of questions) {
        html += '<button class="quick-btn" onclick="askQuestion(\'' + q.replace(/'/g, "\\'") + '\')">' + q + '</button>';
    }
    quickDiv.innerHTML = html;
};
