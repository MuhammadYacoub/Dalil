// ========== Global Variables ==========
let employees = [];
const CACHE_KEY = 'employeesCache';
const CACHE_DURATION = 3600000; // 1 ساعة

// ========== Initialization ==========
document.addEventListener('DOMContentLoaded', () => {
    initializeDarkMode();
    loadData();
    setupLoginModal();
});

// ========== Data Handling ==========
async function loadData() {
    try {
        const cachedData = getCachedData();
        if (cachedData) {
            employees = cachedData;
            renderUI();
        } else {
            await fetchData();
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

async function fetchData() {
    const response = await fetch('data/simpledata.json');
    employees = await response.json();
    cacheData(employees);
    renderUI();
}

// ========== Caching Mechanism ==========
function cacheData(data) {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
    }));
}

function getCachedData() {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
}

// ========== UI Rendering ==========
function renderUI() {
    renderCards(employees);
    setupFilters(employees);
    setupEventListeners();
}

function renderCards(data) {
    const container = document.getElementById('employeeCardContainer');
    container.innerHTML = data.map(emp => `
        <div class="employee-card" 
            data-rank="${emp.CurrentRankID}"
            data-branch="${emp.BranchName}"
            data-section="${emp.SectionName || ''}"
            data-sector="${emp.SectorName}"
            data-name="${emp.Name.toLowerCase()}"
            onclick="showDetails(${emp.ConsultantID || emp.ID})">
            <div class="contact-card">
                <img src="assets/images/coun/${emp.ConsultantID || emp.ID}.webp" 
                     alt="${emp.Name}" 
                     class="employee-photo"
                     onerror="this.src='assets/images/logo.webp';">
                <div class="employee-info">
                    <h3>${emp.Name}</h3>
                    <p>${emp.CurrentRankID} - الأقدمية: ${emp.TimeRank}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// ========== Filter & Search ==========
function setupFilters(data) {
    const filters = {
        rankFilter: [...new Set(data.map(e => e.CurrentRankID))],
        branchFilter: [...new Set(data.map(e => e.BranchName))],
        sectionFilter: [...new Set(data.map(e => e.SectionName || ''))],
        sectorFilter: [...new Set(data.map(e => e.SectorName))]
    };

    Object.entries(filters).forEach(([id, options]) => {
        const select = document.getElementById(id);
        select.innerHTML = `<option value="">الكل</option>`;
        options.forEach(option => {
            select.innerHTML += `<option value="${option}">${option}</option>`;
        });
    });
}

function setupEventListeners() {
    const filterElements = ['rankFilter', 'branchFilter', 'sectionFilter', 'sectorFilter'];
    filterElements.forEach(id => {
        document.getElementById(id).addEventListener('change', debounce(filterCards, 300));
    });
    document.getElementById('searchInput').addEventListener('input', debounce(filterCards, 300));
}

function filterCards() {
    const filters = {
        rank: document.getElementById('rankFilter').value,
        branch: document.getElementById('branchFilter').value,
        section: document.getElementById('sectionFilter').value,
        sector: document.getElementById('sectorFilter').value,
        search: document.getElementById('searchInput').value.toLowerCase()
    };

    const filtered = employees.filter(emp =>
        (!filters.rank || emp.CurrentRankID === filters.rank) &&
        (!filters.branch || emp.BranchName === filters.branch) &&
        (!filters.section || emp.SectionName === filters.section) &&
        (!filters.sector || emp.SectorName === filters.sector) &&
        (!filters.search || emp.Name.toLowerCase().includes(filters.search))
    );

    renderCards(filtered);
    updateResultsCount(filtered.length);
}

// ========== Utilities ==========
function debounce(func, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function updateResultsCount(count) {
    document.getElementById('filteredRowCount').textContent = `عدد النتائج: ${count}`;
}

// ========== Dark Mode ==========
function initializeDarkMode() {
    const toggle = document.getElementById('darkModeToggle');
    toggle.checked = localStorage.getItem('darkMode') === 'enabled';
    toggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode', toggle.checked);
        localStorage.setItem('darkMode', toggle.checked ? 'enabled' : 'disabled');
    });
}

// ========== Login System ==========
function setupLoginModal() {
    const modal = new bootstrap.Modal('#loginModal', {
        backdrop: 'static',
        keyboard: false
    });
    modal.show();

    document.getElementById('loginForm').addEventListener('submit', e => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === 'admin' && password === 'admin123') {
            modal.hide();
        } else {
            alert('بيانات الدخول غير صحيحة!');
        }
    });
}

// ========== Employee Details ==========
function showDetails(id) {
    const employee = employees.find(emp => (emp.ConsultantID || emp.ID) === id);
    const modalBody = document.getElementById('selectedRowModalBody');

    modalBody.innerHTML = `
        <div class="container">
            <div class="row">
                <div class="col-md-4">
                    <img src="assets/images/coun/${id}.webp" 
                         alt="${employee.Name}" 
                         class="fixed-size-image"
                         onerror="this.src='assets/images/logo.webp'">
                </div>
                <div class="col-md-8">
                    <h2>${employee.Name}</h2>
                    <p>الدرجة: ${employee.CurrentRankID}</p>
                    <hr>
                    <p>الفرع: ${employee.BranchName}</p>
                    <p>الأقدمية: ${employee.TimeRank}</p>
                    <p>الهاتف: 0${employee.PhoneNumber}</p>
                    <button class="btn btn-success" 
                            onclick="window.open('https://wa.me/+200${employee.PhoneNumber}')">
                        واتساب
                    </button>
                </div>
            </div>
        </div>
    `;

    new bootstrap.Modal('#selectedRowModal').show();
}