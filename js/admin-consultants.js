// State
const DATA_URL = 'data/simpledata.json';
let allData = [];
let filteredData = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 15;

// DOM Elements
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('adminSearch');
const modal = document.getElementById('itemModal');
const itemForm = document.getElementById('itemForm');
const exportBtn = document.getElementById('exportBtn');
const logoutBtn = document.getElementById('logoutBtn');
const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');

// Init
document.addEventListener('DOMContentLoaded', async () => {
    checkAdminAuth();
    await loadData();
    setupEvents();
});

// Auth Check (Basic) - In production check session/token
function checkAdminAuth() {
    const isLoggedIn = sessionStorage.getItem('sla_user_logged_in');
    if (!isLoggedIn) {
        window.location.href = 'consultants.html';
    }
    // Ideally check if user "is admin", but for now just being logged in is enough 
    // as we assume only admins are given the URL or credentials.
}

// Data Handling
async function loadData() {
    try {
        const res = await fetch(`${DATA_URL}?t=${new Date().getTime()}`);
        allData = await res.json();
        filteredData = [...allData];
        renderTable();
    } catch (err) {
        console.error('Error loading data', err);
        alert('فشل في تحميل البيانات');
    }
}

// Rendering
function renderTable() {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = filteredData.slice(start, end);

    tableBody.innerHTML = pageData.map((item, index) => `
        <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td class="p-4 border-b border-gray-100 dark:border-slate-700 text-sm font-mono text-gray-500">${item.ConsultantID || item.ID || '-'}</td>
            <td class="p-4 border-b border-gray-100 dark:border-slate-700 font-medium">${item.Name}</td>
            <td class="p-4 border-b border-gray-100 dark:border-slate-700 text-sm text-gray-600 dark:text-gray-300 p-4">${item.CurrentRankID || '-'}</td>
            <td class="p-4 border-b border-gray-100 dark:border-slate-700 text-sm text-gray-600 dark:text-gray-300 p-4">${item.Section || item.Sector || item.BranchName || '-'}</td>
            <td class="p-4 border-b border-gray-100 dark:border-slate-700 flex gap-2">
                <button onclick="editItem(${allData.indexOf(item)})" class="text-blue-600 hover:text-blue-800 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg"><i class="fa-solid fa-pen"></i></button>
                <button onclick="deleteItem(${allData.indexOf(item)})" class="text-red-600 hover:text-red-800 p-2 bg-red-50 dark:bg-red-900/30 rounded-lg"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');

    // Pagination Info
    pageInfo.innerText = `صفحة ${currentPage} من ${Math.ceil(filteredData.length / ITEMS_PER_PAGE)}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = end >= filteredData.length;
}

// Search
function filterData() {
    const term = searchInput.value.toLowerCase();
    filteredData = allData.filter(item =>
        (item.Name && item.Name.toLowerCase().includes(term)) ||
        (item.ConsultantID && String(item.ConsultantID).includes(term)) ||
        (item.ID && String(item.ID).includes(term)) ||
        (item.PhoneNumber && String(item.PhoneNumber).includes(term))
    );
    currentPage = 1;
    renderTable();
}

// CRUD
window.openAddModal = () => {
    itemForm.reset();
    document.getElementById('editIndex').value = '-1';
    document.getElementById('modalTitle').innerText = 'إضافة مستشار جديد';
    modal.classList.remove('hidden');
}

document.getElementById('addBtn').addEventListener('click', window.openAddModal);

window.editItem = (index) => {
    const item = allData[index];
    document.getElementById('editIndex').value = index;
    document.getElementById('modalTitle').innerText = 'تعديل بيانات: ' + item.Name;

    document.getElementById('inpID').value = item.ConsultantID || item.ID || '';
    document.getElementById('inpName').value = item.Name || '';
    document.getElementById('inpRank').value = item.CurrentRankID || '';
    document.getElementById('inpSector').value = item.Section || item.Sector || '';
    document.getElementById('inpBranch').value = item.BranchName || '';
    document.getElementById('inpSection').value = item.SectionName || item.HeadOF || '';
    document.getElementById('inpPhone').value = item.PhoneNumber || '';
    document.getElementById('inpAddress').value = item.Address || '';

    modal.classList.remove('hidden');
}

window.deleteItem = (index) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
        allData.splice(index, 1);
        filteredData = [...allData]; // Reset filter needed? Or just remove from filter too. 
        // Re-filter to be safe
        filterData();
    }
}

itemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const index = parseInt(document.getElementById('editIndex').value);

    const newItem = {
        ConsultantID: document.getElementById('inpID').value,
        Name: document.getElementById('inpName').value,
        CurrentRankID: document.getElementById('inpRank').value,
        Sector: document.getElementById('inpSector').value, 
        SectorName: document.getElementById('inpSector').value, // Also saving to SectorName for compatibility with any older scripts
        BranchName: document.getElementById('inpBranch').value,
        SectionName: document.getElementById('inpSection').value,
        PhoneNumber: document.getElementById('inpPhone').value,
        Address: document.getElementById('inpAddress').value,
    };

    if (index === -1) {
        // Add
        allData.unshift(newItem); // Add to top
    } else {
        // Edit
        // Preserve other fields we didn't edit?
        allData[index] = { ...allData[index], ...newItem };
    }

    closeModal();
    filterData(); // Refresh UI
});

window.closeModal = () => {
    modal.classList.add('hidden');
}

// Events
function setupEvents() {
    searchInput.addEventListener('input', () => {
        // Debounce if needed
        filterData();
    });

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; renderTable(); }
    });

    nextBtn.addEventListener('click', () => {
        if (currentPage * ITEMS_PER_PAGE < filteredData.length) { currentPage++; renderTable(); }
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('sla_user_logged_in');
        window.location.href = 'consultants.html';
    });

    exportBtn.addEventListener('click', () => {
        const dataStr = JSON.stringify(allData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'simpledata.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('تم تحميل الملف. يرجى استبداله في مجلد data/ على الخادم.');
    });
}
