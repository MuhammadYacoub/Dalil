// --- Constants & State ---
const DATA_URL = 'data/simpledata.json';
const AUTH_URL = 'data/passwords.json';
const ITEMS_PER_PAGE = 24;
let allEmployees = [];
let filteredEmployees = [];
let currentPage = 1;
let authData = []; // To store users from passwords.json

// --- DOM Elements ---
const grid = document.getElementById('cardsGrid');
const searchInput = document.getElementById('searchInput');
const rankFilter = document.getElementById('rankFilter');
const sectorFilter = document.getElementById('sectorFilter');
const branchFilter = document.getElementById('branchFilter');
const countValue = document.getElementById('countValue');
const statusMessage = document.getElementById('statusMessage');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const themeToggle = document.getElementById('themeToggle');

// Login Elements
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('loginError');

// Modal Elements
const modal = document.getElementById('detailsModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalPanel = document.getElementById('modalPanel');
const modalContent = document.getElementById('modalContent');
const closeModalBtns = document.querySelectorAll('.close-modal');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    checkAuth(); // Check if user is logged in
});

// --- Auth Logic ---
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('sla_user_logged_in');
    if (isLoggedIn === 'true') {
        loginModal.classList.add('hidden');
        loadData(); // Load data only if logged in
        setupEventListeners();
    } else {
        loginModal.classList.remove('hidden');
        setupLoginListener();
    }
}

function setupLoginListener() {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        let username = toEnglishDigits(usernameInput.value.trim());
        let password = toEnglishDigits(passwordInput.value.trim());

        if (!authData.length) {
            try {
                const res = await fetch(`${AUTH_URL}?t=${new Date().getTime()}`);
                const json = await res.json();
                authData = json.users;
            } catch (err) {
                console.error('Auth fetch error', err);
                loginError.textContent = 'خطأ في الاتصال بالخادم';
                loginError.classList.remove('hidden');
                return;
            }
        }

        // Validate
        // flexible matching for usernames (handle potential missing/extra leading zeros)
        const user = authData.find(u => {
            const storedUser = String(u.Username);
            const storedPass = String(u.Password);

            // Check Username (Exact or with leading zero difference)
            const usernameMatch = (storedUser === username) ||
                ('0' + storedUser === username) ||
                (storedUser === '0' + username);

            // Check Password (Exact match after normalization)
            const passwordMatch = (storedPass === password);

            return usernameMatch && passwordMatch;
        });

        if (user) {
            sessionStorage.setItem('sla_user_logged_in', 'true');

            // Animate Login Modal Out
            gsap.to(loginModal, {
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                    loginModal.classList.add('hidden');
                    loadData();
                    setupEventListeners();
                }
            });
        } else {
            loginError.textContent = 'بيانات الدخول غير صحيحة';
            loginError.classList.remove('hidden');
            // Shake animation
            gsap.fromTo(loginForm, { x: -5 }, { x: 5, duration: 0.1, repeat: 3, yoyo: true });
        }
    });

    // Forgot Password Listener
    const forgotBtn = document.getElementById('forgotPasswordBtn');
    if (forgotBtn) {
        forgotBtn.addEventListener('click', showForgotPasswordView);
    }
}

// --- Forgot Password Flow ---
let oldData = [];

async function showForgotPasswordView() {
    const originalContent = loginModal.querySelector('div.bg-white, div.dark\\:bg-slate-800');
    const container = originalContent;
    const innerContent = container.innerHTML;

    // Transition to Loading
    container.innerHTML = `
        <div class="text-center py-12">
            <i class="fa-solid fa-circle-notch fa-spin text-4xl text-gold-500 mb-4"></i>
            <p class="text-slate-500 dark:text-slate-400">جاري التحميل...</p>
        </div>
    `;

    // Fetch Old Data for verification if not already loaded
    if (!oldData.length) {
        try {
            const res = await fetch(`data/simpledataOld.json?t=${new Date().getTime()}`);
            oldData = await res.json();
        } catch (err) {
            console.error('Failed to load old data', err);
            container.innerHTML = innerContent; // Revert
            alert('فشل في تحميل قاعدة بيانات التحقق');
            setupLoginListener(); // Re-attach
            return;
        }
    }

    // Show Verification Form
    container.innerHTML = `
        <div class="text-center mb-8 relative z-10">
            <button id="backToLogin" class="absolute top-0 right-0 text-slate-400 hover:text-primary-800 dark:hover:text-gold-500 transition-colors">
                <i class="fa-solid fa-arrow-right text-xl"></i>
            </button>
            <img src="assets/images/logo.png" alt="Logo" class="w-16 h-16 mx-auto mb-4 object-contain drop-shadow-md">
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">نسيت كلمة المرور</h2>
            <p class="text-slate-500 dark:text-slate-400 text-sm">أدخل الرقم القومي للتحقق من هويتك</p>
        </div>

        <div class="space-y-4 relative z-10">
            <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الرقم القومي (14 رقم)</label>
                <input type="text" id="verifyNationalID" maxlength="14"
                    class="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all text-center font-mono tracking-widest"
                    placeholder="00000000000000">
            </div>
            
            <div id="verifyError" class="hidden text-red-500 text-xs text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-900/50"></div>

            <button id="verifyIDBtn"
                class="w-full py-3.5 bg-primary-900 hover:bg-primary-800 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5">
                تحقق
            </button>
        </div>
    `;

    // Back to Login Handler
    container.querySelector('#backToLogin').onclick = () => {
        container.innerHTML = innerContent;
        setupLoginListener();
    };

    // Verify Button Handler
    container.querySelector('#verifyIDBtn').onclick = async () => {
        const idInput = container.querySelector('#verifyNationalID');
        const errorDiv = container.querySelector('#verifyError');
        const nationalID = toEnglishDigits(idInput.value.trim());

        if (nationalID.length !== 14 || isNaN(nationalID)) {
            errorDiv.textContent = 'يرجى إدخال رقم قومي صحيح مكون من 14 رقم';
            errorDiv.classList.remove('hidden');
            return;
        }

        // Ensure authData is loaded (to check if user exists)
        if (!authData.length) {
            try {
                const res = await fetch(`${AUTH_URL}?t=${new Date().getTime()}`);
                const json = await res.json();
                authData = json.users;
            } catch (err) {
                console.error('Auth fetch error', err);
            }
        }

        // Search in oldData
        const consultant = oldData.find(c => String(c.NationalID) === nationalID);

        if (consultant) {
            showResetPasswordView(container, nationalID, consultant.Name);
        } else {
            errorDiv.textContent = 'هذا الرقم القومي غير مسجل لدينا';
            errorDiv.classList.remove('hidden');
        }
    };
}

function showResetPasswordView(container, nationalID, name) {
    // Check if user exists in passwords.json (authData)
    const existingUser = authData.find(u => String(u.Username) === nationalID);
    const mode = existingUser ? 'إعادة تعيين' : 'إنشاء';

    container.innerHTML = `
        <div class="text-center mb-6 relative z-10">
            <img src="assets/images/logo.png" alt="Logo" class="w-16 h-16 mx-auto mb-4 object-contain">
            <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-1">${mode} كلمة المرور</h2>
            <p class="text-gold-600 dark:text-gold-400 font-medium text-sm mb-2">${name}</p>
        </div>

        <div class="space-y-4 relative z-10">
            <div class="relative">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">كلمة المرور الجديدة</label>
                <input type="text" id="newPassword" 
                    class="w-full p-3 pr-12 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all font-mono">
                <button id="genPass" class="absolute left-3 top-[34px] text-xs text-gold-600 hover:text-gold-700 font-bold">توليد</button>
            </div>

            <button id="savePassBtn"
                class="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5">
                حفظ كلمة المرور
            </button>

            <p class="text-[10px] text-slate-400 text-center leading-relaxed">
                ملاحظة: سيتم طلب كلمة المرور هذه في المرة القادمة. <br>
                يرجى تصوير الشاشة أو كتابتها في مكان آمن.
            </p>
        </div>
    `;

    const passInput = container.querySelector('#newPassword');
    
    // Generate Password
    container.querySelector('#genPass').onclick = () => {
        const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
        let retVal = "";
        for (let i = 0; i < 8; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        passInput.value = retVal;
    };

    // Save Password
    container.querySelector('#savePassBtn').onclick = async () => {
        const newPass = passInput.value.trim();
        if (newPass.length < 4) {
            alert('كلمة المرور قصيرة جداً');
            return;
        }

        // Show loading state
        const btn = container.querySelector('#savePassBtn');
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> جاري الحفظ...';

        try {
            const res = await fetch('/api/save-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: nationalID, newPassword: newPass })
            });

            const result = await res.json();
            if (result.success) {
                alert(`تم ${mode} كلمة المرور بنجاح!\nكلمة المرور: ${newPass}\n\nسيتم الآن إعادة تحميل الصفحة لتسجيل الدخول بنجاح.`);
                
                // Update local authData for immediate effect (optional since we reload)
                const userIdx = authData.findIndex(u => String(u.Username) === nationalID);
                if (userIdx > -1) {
                    authData[userIdx].Password = newPass;
                } else {
                    authData.push({ Username: nationalID, Password: newPass });
                }

                location.reload();
            } else {
                throw new Error(result.error || 'خطأ غير معروف');
            }
        } catch (err) {
            console.error('Save failed', err);
            alert('فشل في حفظ كلمة المرور على الخادم. يرجى التأكد من تشغيل الخادم بشكل صحيح.');
            btn.disabled = false;
            btn.innerText = originalText;
        }
    };
}

// --- Helpers ---
function toEnglishDigits(str) {
    if (!str) return '';
    return str.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
}


// --- Theme Logic ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    // Default is Light. Only enable dark if explicitly saved.
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
        // Optional: Pre-set to light if nothing saved, to be explicit
        if (!savedTheme) localStorage.setItem('theme', 'light');
    }
}

function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// --- Data Fetching ---
async function loadData() {
    try {
        const response = await fetch(`${DATA_URL}?t=${new Date().getTime()}`);
        const data = await response.json();
        allEmployees = data;
        filteredEmployees = data;

        populateFilters();
        renderInitialBatch();
        updateCount(allEmployees.length);
    } catch (error) {
        console.error('Failed to load data:', error);
        statusMessage.innerHTML = '<p class="text-red-500">فشل في تحميل البيانات</p>';
        statusMessage.classList.remove('hidden');
    }
}

// --- Rendering Logic ---
function renderInitialBatch() {
    grid.innerHTML = '';
    currentPage = 1;
    renderBatch();
}

function renderBatch() {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const batch = filteredEmployees.slice(start, end);

    if (batch.length === 0 && currentPage === 1) {
        statusMessage.classList.remove('hidden');
        loadMoreBtn.classList.add('hidden');
        return;
    } else {
        statusMessage.classList.add('hidden');
    }

    const fragment = document.createDocumentFragment();

    batch.forEach(emp => {
        const card = createCard(emp);
        fragment.appendChild(card);
    });

    grid.appendChild(fragment);

    // Show/Hide Load More
    if (end >= filteredEmployees.length) {
        loadMoreBtn.classList.add('hidden');
    } else {
        loadMoreBtn.classList.remove('hidden');
    }

    // Animate new items
    gsap.fromTo(grid.children,
        { autoAlpha: 0, y: 15 },
        { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.02, ease: 'power1.out', overwrite: 'auto' }
    );
}

function createCard(emp) {
    const card = document.createElement('div');
    card.className = 'group bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-gold-500 dark:hover:border-gold-500 transition-all duration-200 cursor-pointer flex items-center gap-4';
    card.onclick = () => openModal(emp);

    const imgPath = `assets/images/coun/${emp.ConsultantID || emp.ID}.webp`;
    const fallbackImg = `assets/images/logo.png`;

    card.innerHTML = `
        <div class="relative w-16 h-16 flex-shrink-0">
            <img src="${imgPath}" alt="${emp.Name}" 
                 class="w-full h-full rounded-full object-cover object-top border-2 border-slate-100 dark:border-slate-700 group-hover:border-gold-500 transition-colors"
                 onerror="this.src='${fallbackImg}'; this.classList.add('p-2', 'bg-slate-50', 'dark:bg-slate-700');">
        </div>
        <div class="flex-1 min-w-0 text-right">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white truncate mb-0.5 group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">
                ${emp.Name}
            </h3>
            <p class="text-xs text-gold-600 dark:text-gold-500 font-medium mb-1">${emp.CurrentRankID}</p>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-full">
                ${emp.Section || emp.BranchName || emp.Sector || 'غير محدد'}
            </p>
        </div>
        <div class="text-slate-300 dark:text-slate-600">
            <i class="fa-solid fa-chevron-left text-xs"></i>
        </div>
    `;
    return card;
}

// --- Filtering ---
function filterData() {
    const term = searchInput.value.toLowerCase().trim();
    const rank = rankFilter.value;
    const sector = sectorFilter.value;
    const branch = branchFilter.value;

    filteredEmployees = allEmployees.filter(emp => {
        // Optimized search: check ID first (fastest), then name
        const consultantId = emp.ConsultantID || emp.ID;
        const idMatch = consultantId && consultantId.toString().startsWith(term); // StartsWith is better for ID
        if (!idMatch) {
            // If ID doesn't match, check name. 
            // Note: Includes is expensive on large strings, but necessary for names.
            if (term && (!emp.Name || !emp.Name.toLowerCase().includes(term))) return false;
        }

        if (rank && emp.CurrentRankID !== rank) return false;
        if (sector && (emp.Sector !== sector && emp.Section !== sector)) return false;
        if (branch && emp.BranchName !== branch) return false;

        return true;
    });

    updateCount(filteredEmployees.length);
    renderInitialBatch();
}

function updateCount(count) {
    countValue.textContent = count;
}

// --- Dropdowns ---
function populateFilters() {
    const ranks = [...new Set(allEmployees.map(e => e.CurrentRankID))].sort();
    const sectors = [...new Set(allEmployees.map(e => e.Sector || e.Section))].filter(Boolean).sort();
    const branches = [...new Set(allEmployees.map(e => e.BranchName))].filter(Boolean).sort();

    const append = (select, opts) => {
        const frag = document.createDocumentFragment();
        opts.forEach(opt => {
            if (!opt) return;
            const el = document.createElement('option');
            el.value = opt;
            el.textContent = opt;
            frag.appendChild(el);
        });
        select.appendChild(frag);
    };

    append(rankFilter, ranks);
    append(sectorFilter, sectors);
    append(branchFilter, branches);
}

// --- Event Listeners ---
function setupEventListeners() {
    // Debounce search
    let timeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(filterData, 300);
    });

    rankFilter.addEventListener('change', filterData);
    sectorFilter.addEventListener('change', filterData);
    branchFilter.addEventListener('change', filterData);

    loadMoreBtn.addEventListener('click', () => {
        currentPage++;
        renderBatch();
    });

    themeToggle.addEventListener('click', toggleTheme);

    // Modal Closing
    closeModalBtns.forEach(btn => btn.addEventListener('click', closeModal));
    modalBackdrop.addEventListener('click', closeModal);
}

// --- Modal Logic ---
function openModal(emp) {
    const imgPath = `assets/images/coun/${emp.ConsultantID || emp.ID}.webp`;
    const fallbackImg = `assets/images/logo.png`;
    const phoneDisplay = emp.PhoneNumber ? `0${emp.PhoneNumber}` : '';

    modalContent.innerHTML = `
        <div class="text-center mb-6">
            <img src="${imgPath}" alt="${emp.Name}" 
                 class="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-slate-100 dark:border-slate-800 object-cover object-top shadow-lg"
                 onerror="this.src='${fallbackImg}'; this.className='w-24 h-24 mx-auto mb-4 object-contain opacity-80';">
            
            <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-1 leading-snug">${emp.Name}</h2>
            <span class="inline-block px-3 py-1 bg-gold-500/10 text-gold-600 dark:text-gold-400 rounded-full text-sm font-medium">
                ${emp.CurrentRankID}
            </span>
        </div>

        <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 mb-6 space-y-3 border border-slate-100 dark:border-slate-700">
            <div class="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span class="text-slate-500 dark:text-slate-400 text-sm">الأقدمية</span>
                <span class="text-slate-800 dark:text-slate-200 font-medium">${emp.TimeRank || '-'}</span>
            </div>
            <div class="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span class="text-slate-500 dark:text-slate-400 text-sm">القطاع / القسم</span>
                <span class="text-slate-800 dark:text-slate-200 font-medium text-left dir-ltr truncate ml-4">${emp.Section || emp.Sector || '-'}</span>
            </div>
            <div class="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span class="text-slate-500 dark:text-slate-400 text-sm">الفرع</span>
                <span class="text-slate-800 dark:text-slate-200 font-medium text-left dir-ltr truncate ml-4">${emp.BranchName || '-'}</span>
            </div>
            ${(emp.SectionName || emp.HeadOF) ? `
            <div class="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span class="text-slate-500 dark:text-slate-400 text-sm">القسم / الرئاسة</span>
                <span class="text-slate-800 dark:text-slate-200 font-medium text-left dir-ltr truncate ml-4">${emp.SectionName || emp.HeadOF}</span>
            </div>` : ''}
            ${emp.Governorate ? `
            <div class="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span class="text-slate-500 dark:text-slate-400 text-sm">المحافظة</span>
                <span class="text-slate-800 dark:text-slate-200 font-medium text-left dir-ltr truncate ml-4">${emp.Governorate}</span>
            </div>` : ''}
            ${phoneDisplay ? `
            <div class="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2 items-center">
                <span class="text-slate-500 dark:text-slate-400 text-sm">رقم الهاتف</span>
                <div class="phone-copy-btn relative flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer group/phone" data-phone="${phoneDisplay}">
                    <span class="text-slate-800 dark:text-slate-200 font-medium dir-ltr" dir="ltr">${phoneDisplay}</span>
                    <i class="fa-regular fa-copy text-xs text-slate-400 group-hover/phone:text-gold-500 transition-colors"></i>
                </div>
            </div>` : ''}
            <div class="pt-2">
                <div class="flex justify-between items-start mb-2">
                    <p class="text-slate-500 dark:text-slate-400 text-xs mt-1">العنوان</p>
                    ${emp.Address ? `
                    <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(emp.Address)}" 
                       target="_blank" 
                       class="flex items-center gap-2 px-3 py-1.5 bg-gold-500/10 text-gold-600 dark:text-gold-400 border border-gold-500/20 rounded-lg text-[11px] font-bold hover:bg-gold-500 hover:text-white dark:hover:bg-gold-500 dark:hover:text-white transition-all active:scale-95" 
                       title="فتح في خرائط جوجل">
                        <i class="fa-solid fa-map-location-dot text-sm"></i>
                        <span>عرض على الخريطة</span>
                    </a>` : ''}
                </div>
                <p class="text-slate-800 dark:text-slate-200 text-sm leading-relaxed">${emp.Address || '-'}</p>
            </div>
        </div>

        ${emp.PhoneNumber ? `
        <div class="grid grid-cols-2 gap-3">
            <a href="https://wa.me/+200${emp.PhoneNumber}" target="_blank" 
               class="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 rounded-xl transition-colors font-bold shadow-sm shadow-green-500/20">
                <i class="fa-brands fa-whatsapp text-lg"></i>
                واتساب
            </a>
            <a href="tel:0${emp.PhoneNumber}" 
               class="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl transition-colors font-bold shadow-sm shadow-blue-500/20">
                <i class="fa-solid fa-phone text-sm"></i>
                اتصال
            </a>
        </div>
        ` : ''}
    `;

    // Attach copy-to-clipboard handler for the phone button in modal
    const modalPhoneBtn = modalContent.querySelector('.phone-copy-btn');
    if (modalPhoneBtn) {
        modalPhoneBtn.addEventListener('click', () => {
            const phone = modalPhoneBtn.getAttribute('data-phone');
            navigator.clipboard.writeText(phone).then(() => {
                // Show "copied" tooltip
                const tooltip = document.createElement('span');
                tooltip.textContent = 'تم النسخ ✓';
                tooltip.className = 'absolute -top-7 right-1/2 translate-x-1/2 bg-slate-800 dark:bg-white text-white dark:text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg whitespace-nowrap pointer-events-none z-10';
                modalPhoneBtn.appendChild(tooltip);
                gsap.fromTo(tooltip, { opacity: 0, y: 4 }, {
                    opacity: 1, y: 0, duration: 0.2, onComplete: () => {
                        gsap.to(tooltip, { opacity: 0, y: -4, delay: 1, duration: 0.3, onComplete: () => tooltip.remove() });
                    }
                });
            });
        });
    }

    modal.classList.remove('hidden');
    // Animate Modal In
    gsap.to(modalBackdrop, { opacity: 1, duration: 0.2 });
    gsap.to(modalPanel, {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: 'back.out(1.2)'
    });

    document.body.style.overflow = 'hidden';
}

function closeModal() {
    // Animate Modal Out
    gsap.to(modalBackdrop, { opacity: 0, duration: 0.2 });
    gsap.to(modalPanel, {
        opacity: 0,
        scale: 0.95,
        duration: 0.2,
        onComplete: () => {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });
}
