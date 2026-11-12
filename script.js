// --- CONFIGURATION SUPABASE ---
const SUPABASE_URL = 'https://wtyvtjvzvgurybtcnnsf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JLPzS9fSB0-mJN9D3Vssiw_ibQEXq4d';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let PRODUCTS = []; // ดึงจาก Supabase table 'products'
let customerType = 'soldier'; // 'soldier' or 'tourist'
let currentCategory = 'all';
let cart = [];
let activeBills = []; // เก็บรายการบิลที่เปิดค้างไว้
let checkingBillIndex = null; // บิลที่กำลังจะชำระเงิน

window.onload = async function() {
    await loadProductsFromSupabase();
    if (document.getElementById('pos-products-grid')) {
        renderProducts();
    }
    if (document.getElementById('sales-history-body')) {
        loadSalesHistory();
    }
    if (document.getElementById('cost-bean-per-gram')) {
        calculateCosts();
    }
};

// --- LOAD PRODUCTS FROM SUPABASE ---
async function loadProductsFromSupabase() {
    try {
        const { data, error } = await supabaseClient.from('products').select('*').order('id', { ascending: true });
        if (error) throw error;
        if (data && data.length > 0) {
            PRODUCTS = data.map(p => ({
                id: p.id,
                name: p.name,
                category: p.category,
                icon: p.icon || '☕',
                imageUrl: p.image_url || '',
                cogs: Number(p.cogs) || 0,
                priceSoldier: Number(p.price_soldier) || 0,
                priceTourist: Number(p.price_tourist) || 0,
                beanGram: Number(p.bean_gram) || 18,
                cupType: p.cup_type || 'แก้วร้อน',
                lidType: p.lid_type || 'ฝาร้อน'
            }));
        }
    } catch (err) {
        console.error('Error loading products:', err);
        // Fallback ค่าเริ่มต้นหากดึงไม่ได้
        PRODUCTS = [
            { id: 1, name: 'อเมริกาโน่ร้อน', category: 'hot-coffee', icon: '☕', imageUrl: '', cogs: 16.82, priceSoldier: 25, priceTourist: 35, beanGram: 18, cupType: 'แก้วร้อน', lidType: 'ฝาร้อน' },
            { id: 2, name: 'อเมริกาโน่เย็น', category: 'iced-coffee', icon: '🧊', imageUrl: '', cogs: 17.50, priceSoldier: 30, priceTourist: 45, beanGram: 20, cupType: 'แก้วเย็น', lidType: 'ฝาเย็น' }
        ];
    }
}

// --- POS UI & FUNCTIONS ---
function setCustomerType(type) {
    customerType = type;
    const btnSoldier = document.getElementById('btn-soldier');
    const btnTourist = document.getElementById('btn-tourist');
    if (!btnSoldier || !btnTourist) return;

    if (type === 'soldier') {
        btnSoldier.className = "flex-1 py-2 rounded-lg text-white bg-zinc-800 font-bold text-xs transition flex items-center justify-center gap-1";
        btnTourist.className = "flex-1 py-2 rounded-lg text-zinc-400 hover:text-white font-bold text-xs transition flex items-center justify-center gap-1";
    } else {
        btnTourist.className = "flex-1 py-2 rounded-lg text-white bg-zinc-800 font-bold text-xs transition flex items-center justify-center gap-1";
        btnSoldier.className = "flex-1 py-2 rounded-lg text-zinc-400 hover:text-white font-bold text-xs transition flex items-center justify-center gap-1";
    }
    renderProducts();
}

function filterCategory(cat, event) {
    currentCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.className = "cat-btn px-3 py-2 rounded-xl font-bold bg-darkbg text-zinc-400 border border-bordercol text-xs whitespace-nowrap";
    });
    if (event && event.currentTarget) {
        event.currentTarget.className = "cat-btn px-3 py-2 rounded-xl font-bold bg-zinc-800 text-white text-xs whitespace-nowrap shadow";
    }
    renderProducts();
}

function renderProducts() {
    const container = document.getElementById('pos-products-grid');
    const searchInput = document.getElementById('search-product');
    if (!container) return;

    const keyword = searchInput ? searchInput.value.toLowerCase() : '';
    const items = PRODUCTS.filter(p => {
        const matchCat = (currentCategory === 'all' || p.category === currentCategory);
        const matchName = p.name.toLowerCase().includes(keyword);
        return matchCat && matchName;
    });

    container.innerHTML = items.map(p => {
        const price = customerType === 'soldier' ? p.priceSoldier : p.priceTourist;
        const profit = price - p.cogs;
        const imageContent = p.imageUrl 
            ? `<img src="${p.imageUrl}" class="w-full h-full object-cover rounded-lg">` 
            : `<span class="text-3xl">${p.icon}</span>`;

        return `
            <div onclick="addToCart(${p.id})" class="bg-darkbg border border-bordercol rounded-xl p-3 flex flex-col justify-between hover:border-zinc-500 transition cursor-pointer select-none shadow-sm active:scale-95">
                <div class="bg-cardbg border border-bordercol rounded-lg h-16 flex items-center justify-center overflow-hidden mb-2 relative">
                    ${imageContent}
                    <span class="absolute top-1 right-1 text-[9px] font-bold bg-zinc-900/90 text-zinc-300 px-1.5 py-0.5 rounded-full font-mono border border-bordercol">ทุน ฿${p.cogs}</span>
                </div>
                <div>
                    <h4 class="font-extrabold text-xs text-zinc-100">${p.name}</h4>
                    <div class="flex items-center justify-between mt-1.5 pt-1 border-t border-bordercol">
                        <span class="text-zinc-100 font-black text-sm font-mono">฿${price}</span>
                        <span class="text-[9px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 rounded">+฿${profit.toFixed(1)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function addToCart(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    const price = customerType === 'soldier' ? product.priceSoldier : product.priceTourist;
    const typeLabel = customerType === 'soldier' ? 'กำลังพล' : 'ราคาปกติ';

    const existing = cart.find(item => item.id === productId && item.typeLabel === typeLabel);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({
            id: product.id,
            rawName: product.name,
            name: `${product.name} (${typeLabel})`,
            price: price,
            qty: 1,
            typeLabel: typeLabel,
            beanGram: product.beanGram,
            cupType: product.cupType,
            lidType: product.lidType
        });
    }
    updateCartUI();
}

function updateQty(index, change) {
    cart[index].qty += change;
    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    updateCartUI();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function updateCartUI() {
    const list = document.getElementById('cart-items-list');
    const countTag = document.getElementById('cart-item-count');
    const btnSaveBill = document.getElementById('btn-save-bill');
    const btnCheckoutDirect = document.getElementById('btn-checkout-direct');
    if (!list) return;

    if (cart.length === 0) {
        list.innerHTML = `
            <div class="h-24 flex flex-col items-center justify-center text-zinc-500 space-y-1">
                <i class="fa-solid fa-basket-shopping text-xl"></i>
                <p class="text-xs font-medium">ยังไม่มีรายการในตะกร้า</p>
            </div>
        `;
        if (countTag) countTag.innerText = '0 ชิ้น';
        document.getElementById('cart-subtotal').innerText = '฿0.00';
        if (btnSaveBill) btnSaveBill.disabled = true;
        if (btnCheckoutDirect) btnCheckoutDirect.disabled = true;
        return;
    }

    let subtotal = 0;
    let totalItems = 0;

    list.innerHTML = cart.map((item, idx) => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;
        totalItems += item.qty;
        return `
            <div class="flex items-center justify-between bg-darkbg p-2 rounded-xl border border-bordercol text-xs shadow-sm">
                <div class="flex-1 pr-1">
                    <h5 class="font-bold text-zinc-100 text-xs">${item.name}</h5>
                    <p class="font-mono text-zinc-400 font-bold mt-0.5">฿${itemTotal} (${item.price}x${item.qty})</p>
                </div>
                <div class="flex items-center gap-1">
                    <div class="flex items-center gap-0.5 bg-cardbg border border-bordercol rounded-lg p-0.5">
                        <button onclick="updateQty(${idx}, -1)" class="w-5 h-5 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-200 font-black">-</button>
                        <span class="w-4 text-center font-black text-xs text-zinc-100">${item.qty}</span>
                        <button onclick="updateQty(${idx}, 1)" class="w-5 h-5 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-200 font-black">+</button>
                    </div>
                    <button onclick="removeFromCart(${idx})" class="w-6 h-6 flex items-center justify-center bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-lg font-bold" title="ลบ">
                        <i class="fa-solid fa-trash-can text-[10px]"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    if (countTag) countTag.innerText = `${totalItems} ชิ้น`;
    document.getElementById('cart-subtotal').innerText = `฿${subtotal.toFixed(2)}`;
    if (btnSaveBill) btnSaveBill.disabled = false;
    if (btnCheckoutDirect) btnCheckoutDirect.disabled = false;
}

// --- ACTIVE BILLS & QUEUE MANAGEMENT ---
function saveAsBill() {
    if (cart.length === 0) return;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const newBill = {
        id: Date.now().toString().slice(-4),
        items: [...cart],
        subtotal: subtotal,
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };
    activeBills.push(newBill);
    cart = [];
    updateCartUI();
    updateActiveBillsUI();
}

function updateActiveBillsUI() {
    const container = document.getElementById('active-bills-list');
    const badge = document.getElementById('bill-count-badge');
    if (!container) return;

    badge.innerText = `${activeBills.length} บิล`;

    if (activeBills.length === 0) {
        container.innerHTML = `<p class="text-xs text-zinc-500 text-center py-3">ยังไม่มีบิลค้างในระบบ</p>`;
        return;
    }

    container.innerHTML = activeBills.map((bill, index) => `
        <div class="bg-darkbg p-2.5 rounded-xl border border-bordercol space-y-2 text-xs">
            <div class="flex justify-between items-center border-b border-bordercol pb-1.5">
                <span class="font-black text-amber-400">บิล #${bill.id} (${bill.time})</span>
                <span class="font-mono font-bold text-zinc-100">฿${bill.subtotal.toFixed(2)}</span>
            </div>
            <div class="text-[11px] text-zinc-300 space-y-0.5">
                ${bill.items.map(i => `<div>• ${i.name} x${i.qty}</div>`).join('')}
            </div>
            <div class="flex gap-1.5 pt-1">
                <button onclick="openCheckoutForBill(${index})" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded-lg transition text-[11px]">
                    <i class="fa-solid fa-cash-register"></i> ชำระเงินบิลนี้
                </button>
                <button onclick="cancelBill(${index})" class="px-2.5 bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 rounded-lg transition text-[11px]">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function cancelBill(index) {
    if (confirm('ต้องการยกเลิกบิลนี้ใช่หรือไม่?')) {
        activeBills.splice(index, 1);
        updateActiveBillsUI();
    }
}

function openCheckoutModalDirect() {
    if (cart.length === 0) return;
    checkingBillIndex = null; // หมายถึงชำระจากตะกร้าโดยตรง
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    showModalWithTotal(subtotal);
}

function openCheckoutForBill(index) {
    checkingBillIndex = index;
    const bill = activeBills[index];
    showModalWithTotal(bill.subtotal);
}

function showModalWithTotal(total) {
    document.getElementById('checkout-total-price').innerText = `฿${total.toFixed(2)}`;
    document.getElementById('cash-received').value = '';
    document.getElementById('cash-change').innerText = '฿0.00';
    document.getElementById('order-note').value = '';
    document.getElementById('modal-checkout').classList.remove('hidden');
}

function closeCheckoutModal() {
    document.getElementById('modal-checkout').classList.add('hidden');
}

function calculateChange() {
    const totalText = document.getElementById('checkout-total-price').innerText.replace('฿', '');
    const total = parseFloat(totalText) || 0;
    const received = parseFloat(document.getElementById('cash-received').value) || 0;
    const change = received - total;
    document.getElementById('cash-change').innerText = `฿${Math.max(0, change).toFixed(2)}`;
}

// --- SUPABASE ACTIONS & SAVE ---
async function confirmPayment() {
    const btnConfirm = document.getElementById('btn-confirm-pay');
    const orderNote = document.getElementById('order-note').value.trim();
    
    let itemsToProcess = [];
    if (checkingBillIndex !== null) {
        itemsToProcess = activeBills[checkingBillIndex].items;
    } else {
        itemsToProcess = [...cart];
    }

    if (itemsToProcess.length === 0) return;

    if (btnConfirm) {
        btnConfirm.disabled = true;
        btnConfirm.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> บันทึก...`;
    }

    try {
        const rowsToInsert = itemsToProcess.map(item => ({
            customer_type: item.typeLabel,
            product_name: item.rawName,
            quantity: item.qty,
            total_price: item.price * item.qty,
            note: orderNote || '-'
        }));

        const { error } = await supabaseClient.from('coffee_sales').insert(rowsToInsert);
        if (error) throw error;

        for (const item of itemsToProcess) {
            await deductInventory('เมล็ดกาแฟ', item.beanGram * item.qty);
            await deductInventory(item.cupType, item.qty);
            await deductInventory(item.lidType, item.qty);
            await deductInventory('หลอด', item.qty);
        }

        // จัดการเคลียร์บิลหรือตะกร้า
        if (checkingBillIndex !== null) {
            activeBills.splice(checkingBillIndex, 1);
            updateActiveBillsUI();
            checkingBillIndex = null;
        } else {
            cart = [];
            updateCartUI();
        }

        alert('ชำระเงินและบันทึกสำเร็จ!');
        closeCheckoutModal();
    } catch (err) {
        console.error(err);
        alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
        if (btnConfirm) {
            btnConfirm.disabled = false;
            btnConfirm.innerHTML = `<i class="fa-solid fa-check"></i> ยืนยันรับเงิน & บันทึก`;
        }
    }
}

async function deductInventory(itemName, amount) {
    try {
        const { data } = await supabaseClient.from('inventory').select('*').eq('item_name', itemName).single();
        if (data) {
            const newQty = Math.max(0, Number(data.quantity) - amount);
            await supabaseClient.from('inventory').update({ quantity: newQty }).eq('item_name', itemName);
        }
    } catch (e) {
        console.error('Inventory error:', e);
    }
}

// --- DASHBOARD & COST FUNCTIONS (สืบทอดความสมบูรณ์เดิม) ---
async function loadSalesHistory() {
    const tbody = document.getElementById('sales-history-body');
    const filterDate = document.getElementById('filter-date') ? document.getElementById('filter-date').value : '';
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-zinc-500 font-medium">กำลังโหลด...</td></tr>`;

    try {
        const { data, error } = await supabaseClient.from('coffee_sales').select('*').order('created_at', { ascending: false });
        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-zinc-500 font-medium">ยังไม่มีประวัติการขาย</td></tr>`;
            return;
        }

        let filteredData = data;
        if (filterDate) {
            filteredData = data.filter(row => row.created_at.startsWith(filterDate));
        }

        let totalRev = 0, soldierCups = 0, touristCups = 0;

        tbody.innerHTML = filteredData.map(row => {
            totalRev += Number(row.total_price);
            if (row.customer_type === 'กำลังพล') soldierCups += Number(row.quantity);
            else touristCups += Number(row.quantity);

            const formattedDate = new Date(row.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'medium' });
            return `
                <tr class="hover:bg-zinc-800/50 transition border-b border-bordercol">
                    <td class="px-3 py-2.5 font-medium text-zinc-400">${formattedDate}</td>
                    <td class="px-3 py-2.5"><span class="px-2 py-0.5 bg-zinc-800 text-zinc-200 font-bold rounded text-[10px] border border-bordercol">${row.customer_type}</span></td>
                    <td class="px-3 py-2.5 font-bold text-zinc-100">${row.product_name}</td>
                    <td class="px-3 py-2.5 text-zinc-400">${row.note || '-'}</td>
                    <td class="px-3 py-2.5 text-right font-mono font-bold text-zinc-200">${row.quantity}</td>
                    <td class="px-3 py-2.5 text-right font-mono font-black text-emerald-400">฿${row.total_price}</td>
                </tr>
            `;
        }).join('');

        if (document.getElementById('stats-total-revenue')) document.getElementById('stats-total-revenue').innerText = `฿${totalRev.toLocaleString()}`;
        if (document.getElementById('stats-soldier-cups')) document.getElementById('stats-soldier-cups').innerText = `${soldierCups.toLocaleString()} แก้ว`;
        if (document.getElementById('stats-tourist-cups')) document.getElementById('stats-tourist-cups').innerText = `${touristCups.toLocaleString()} แก้ว`;
        if (document.getElementById('stats-total-orders')) document.getElementById('stats-total-orders').innerText = `${filteredData.length} รายการ`;

    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-red-400 font-bold">โหลดข้อมูลไม่สำเร็จ</td></tr>`;
    }
}

function calculateCosts() {
    const beanPerGram = parseFloat(document.getElementById('cost-bean-per-gram')?.value) || 0;
    const hotCup = parseFloat(document.getElementById('cost-hot-cup')?.value) || 0;
    const hotLid = parseFloat(document.getElementById('cost-hot-lid')?.value) || 0;
    const icedCup = parseFloat(document.getElementById('cost-iced-cup')?.value) || 0;
    const icedLid = parseFloat(document.getElementById('cost-iced-lid')?.value) || 0;
    const straw = parseFloat(document.getElementById('cost-straw')?.value) || 0;
    const iceBag = parseFloat(document.getElementById('cost-ice-bag')?.value) || 0;
    const totalCapex = parseFloat(document.getElementById('total-capex')?.value) || 0;

    const icePerCup = iceBag / 35;
    const hotCogs = (beanPerGram * 18) + hotCup + hotLid;
    const icedCogs = (beanPerGram * 20) + icedCup + icedLid + straw + icePerCup;

    if (document.getElementById('result-hot-cogs')) document.getElementById('result-hot-cogs').innerText = `฿${hotCogs.toFixed(2)}`;
    if (document.getElementById('result-iced-cogs')) document.getElementById('result-iced-cogs').innerText = `฿${icedCogs.toFixed(2)}`;

    const avgPrice = (30 + 37.5) / 2;
    const avgCogs = (hotCogs + icedCogs) / 2;
    const avgProfit = avgPrice - avgCogs;

    if (document.getElementById('result-avg-profit')) document.getElementById('result-avg-profit').innerText = `฿${avgProfit.toFixed(2)}`;
    const breakEvenCups = avgProfit > 0 ? Math.ceil(totalCapex / avgProfit) : 0;
    if (document.getElementById('result-break-even-cups')) document.getElementById('result-break-even-cups').innerText = `${breakEvenCups.toLocaleString()} แก้ว`;
}
