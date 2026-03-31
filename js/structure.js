document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('data/organization.json');
        const data = await res.json();
        renderTree(data);
    } catch (err) {
        console.error('Error loading structure data', err);
        document.getElementById('treeContainer').innerHTML = '<p class="text-red-500">فشل في تحميل البيانات</p>';
    }
});

function renderTree(data) {
    const container = document.getElementById('treeContainer');

    const createNode = (item) => {
        const li = document.createElement('li');

        // Card HTML
        const cardClass = item.children && item.children.length > 0 ? 'node-card border-gold-500/30' : 'node-card border-slate-200';

        const html = `
            <div class="${cardClass}">
                <div class="mb-2">
                    <i class="fa-solid fa-user-tie text-gold-500 text-xl mb-1 block"></i>
                    <h3 class="font-bold text-sm leading-tight mb-1">${item.title}</h3>
                    <p class="text-xs text-primary-800 dark:text-gold-400 font-medium">${item.role || ''}</p>
                </div>
                ${item.sideInfo ? `<div class="text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-1 mt-1">${item.sideInfo}</div>` : ''}
            </div>
        `;

        // Using a span wrapper instead of 'a' to avoid link behavior, or could utilize expanding
        const wrapper = document.createElement('a');
        wrapper.href = 'javascript:void(0)'; // No-op
        wrapper.innerHTML = html;
        li.appendChild(wrapper);

        // Children
        if (item.children && item.children.length > 0) {
            const ul = document.createElement('ul');
            item.children.forEach(child => {
                ul.appendChild(createNode(child));
            });
            li.appendChild(ul);
        }

        return li;
    };

    const rootUl = document.createElement('ul');
    rootUl.appendChild(createNode(data));

    container.innerHTML = '';
    container.appendChild(rootUl);
}
