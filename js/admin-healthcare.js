// State
const DATA_URL = 'data/healthcare.json';
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
const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');

// Init
document.addEventListener('DOMContentLoaded', async () => {
    // Auth check skipped for simplicity in this demo, assumed handled by hub or similar checks
    await loadData();
    setupEvents();
});

// Data Handling
async function loadData() {
    try {
        const res = await fetch(`${DATA_URL}?t=${new Date().getTime()}`);
        allData = await res.json();
        filteredData = [...allData];
        renderTable();
    } catch (err) {
        console.error('Error loading healthcare data', err);
    }
}

// Rendering
function renderTable() {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = filteredData.slice(start, end);

    tableBody.innerHTML = pageData.map((item, index) => `
        <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td class="p-4 border-b border-gray-100 dark:border-slate-700 font-medium">${item.name || '-'}</td>
            <td class="p-4 border-b border-gray-100 dark:border-slate-700 text-sm text-gray-600 dark:text-gray-300">${item.type || '-'}</td>
            <td class="p-4 border-b border-gray-100 dark:border-slate-700 text-sm text-gray-600 dark:text-gray-300">${item.specialty || '-'}</td>
            <td class="p-4 border-b border-gray-100 dark:border-slate-700 text-sm text-gray-600 dark:text-gray-300">${item.government || '-'}</td>
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
        (item.name && item.name.toLowerCase().includes(term)) ||
        (item.specialty && item.specialty.toLowerCase().includes(term)) ||
        (item.government && item.government.toLowerCase().includes(term))
    );
    currentPage = 1;
    renderTable();
}

// CRUD
window.openAddModal = () => {
    itemForm.reset();
    document.getElementById('editIndex').value = '-1';
    document.getElementById('modalTitle').innerText = 'إضافة جديد';
    modal.classList.remove('hidden');
}

document.getElementById('addBtn').addEventListener('click', window.openAddModal);

window.editItem = (index) => {
    const item = allData[index];
    document.getElementById('editIndex').value = index;
    document.getElementById('modalTitle').innerText = 'تعديل بيانات: ' + item.name;

    document.getElementById('inpName').value = item.name || '';
    document.getElementById('inpType').value = item.type || 'الاطباء';
    document.getElementById('inpSpecialty').value = item.specialty || '';
    document.getElementById('inpGov').value = item.government || '';

    modal.classList.remove('hidden');
}

window.deleteItem = (index) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
        allData.splice(index, 1);
        filterData();
    }
}

itemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const index = parseInt(document.getElementById('editIndex').value);

    const newItem = {
        name: document.getElementById('inpName').value,
        type: document.getElementById('inpType').value,
        specialty: document.getElementById('inpSpecialty').value,
        government: document.getElementById('inpGov').value,
    };

    if (index === -1) {
        allData.unshift(newItem);
    } else {
        allData[index] = { ...allData[index], ...newItem };
    }

    closeModal();
    filterData();
});

window.closeModal = () => {
    modal.classList.add('hidden');
}

// Events
function setupEvents() {
    searchInput.addEventListener('input', () => {
        filterData();
    });

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; renderTable(); }
    });

    nextBtn.addEventListener('click', () => {
        if (currentPage * ITEMS_PER_PAGE < filteredData.length) { currentPage++; renderTable(); }
    });

    exportBtn.addEventListener('click', () => {
        const dataStr = JSON.stringify(allData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'healthcare.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}
