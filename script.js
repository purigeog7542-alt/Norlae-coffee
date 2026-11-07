// --- CONFIGURATION SUPABASE ---
const SUPABASE_URL = 'https://wtyvtjvzvgurybtcnnsf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JLPzS9fSB0-mJN9D3Vssiw_ibQEXq4d';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- PRODUCT CATALOG ---
const PRODUCTS = [
    { id: 1, name: 'อเมริกาโน่ร้อน', category: 'hot-coffee', icon: '☕', cogs: 16.82, priceSoldier: 25, priceTourist: 35 },
    { id: 2, name: 'อเมริกาโน่เย็น', category: 'iced-coffee', icon: '🧊', cogs: 17.50, priceSoldier: 30, priceTourist: 45 }
];

let customerType = 'soldier'; // 'soldier' or 'tourist'
let currentCategory = 'all';
let cart = [];

// รันฟังก์ชันตามหน้าปัจจุบัน
window.onload = function() {
    if (document.getElementById('pos-products-grid')) {
        renderProducts();
    }
    if (document.getElementById('sales-history-body')) {
        loadSalesHistory();
    }
};

// --- POS FUNCTIONS ---
function setCustomerType(type) {
    customerType = type;
    const btnSoldier = document.getElementById('btn-soldier');
    const btnTourist = document.getElementById('btn-tourist');
    if (!btnSoldier || !btnTourist) return;

    if (type === 'soldier') {
        btnSoldier.className = "px-3 py-1.5 rounded-lg text-slate-950 bg-amber-500 font-bold transition flex items-center gap-1.5";
        btnTourist.className = "px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition flex items-center gap-1.5";
    } else {
        btnTourist.className = "px-3 py-1.5 rounded-lg text-slate-950 bg-amber-500 font-bold transition flex items-center gap-1.5";
        btnSoldier.className = "px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition flex items-center gap-1.5";
    }
    renderProducts();
}

function filterCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.className = "cat-btn px-4 py-2 rounded-full font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 whitespace-nowrap";
    });
    if (event && event.currentTarget) {
        event.currentTarget.className = "cat-btn px-4 py-2 rounded-full font-medium bg-amber-500 text-slate-950 whitespace-nowrap shadow";
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
        return `
            <div onclick="addToCart(${p.id})" class="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/50 transition cursor-pointer select-none">
                <div class="bg-slate-900 rounded-xl h-24 flex items-center justify-center text-4xl mb-3 relative">
                    ${p.icon}
                    <span class="absolute top-2 right-2 text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">ทุน ฿${p.cogs}</span>
                </div>
                <div>
                    <h4 class="font-bold text-sm text-slate-200">${p.name}</h4>
                    <div class="flex items-center justify-between mt-2">
                        <span class="text-amber-400 font-bold text-base font-mono">฿${price}</span>
                        <span class="text-xs text-slate-500">กำไร +฿${profit.toFixed(1)}</span>
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
            typeLabel: typeLabel
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

function updateCartUI() {
    const list = document.getElementById('cart-items-list');
    const countTag = document.getElementById('cart-item-count');
    const btnCheckout = document.getElementById('btn-checkout');
    if (!list) return;

    if (cart.length === 0) {
        list.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <i class="fa-solid fa-basket-shopping text-3xl"></i>
                <p class="text-xs">ยังไม่มีรายการในตะกร้า</p>
            </div>
        `;
        if (countTag) countTag.innerText = '0 ชิ้น';
        document.getElementById('cart-subtotal').innerText = '฿0.00';
        document.getElementById('cart-total').innerText = '฿0.00';
        if (btnCheckout) btnCheckout.disabled = true;
        return;
    }

    let subtotal = 0;
    let totalItems = 0;

    list.innerHTML = cart.map((item, idx) => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;
        totalItems += item.qty;
        return `
            <div class="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                <div class="flex-1 pr-2">
                    <h5 class="font-bold text-slate-200">${item.name}</h5>
                    <p class="font-mono text-amber-400 mt-0.5">฿${itemTotal} (${item.price}x${item.qty})</p>
                </div>
                <div class="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
                    <button onclick="updateQty(${idx}, -1)" class="w-5 h-5 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded text-slate-200 font-bold">-</button>
                    <span class="w-5 text-center font-bold">${item.qty}</span>
                    <button onclick="updateQty(${idx}, 1)" class="w-5 h-5 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded text-slate-200 font-bold">+</button>
                </div>
            </div>
        `;
    }).join('');

    if (countTag) countTag.innerText = `${totalItems} ชิ้น`;
    document.getElementById('cart-subtotal').innerText = `฿${subtotal.toFixed(2)}`;
    document.getElementById('cart-total').innerText = `฿${subtotal.toFixed(2)}`;
    if (btnCheckout) btnCheckout.disabled = false;
}

function openCheckoutModal() {
    if (cart.length === 0) return;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    document.getElementById('checkout-total-price').innerText = `฿${subtotal.toFixed(2)}`;
    document.getElementById('cash-received').value = '';
    document.getElementById('cash-change').innerText = '฿0.00';
    document.getElementById('modal-checkout').classList.remove('hidden');
}

function closeCheckoutModal() {
    const modal = document.getElementById('modal-checkout');
    if (modal) modal.classList.add('hidden');
}

function calculateChange() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const received = parseFloat(document.getElementById('cash-received').value) || 0;
    const change = received - subtotal;
    document.getElementById('cash-change').innerText = `฿${Math.max(0, change).toFixed(2)}`;
}

// --- SUPABASE ACTIONS ---
async function completePaymentAndSave() {
    const btnConfirm = document.getElementById('btn-confirm-pay');
    if (btnConfirm) {
        btnConfirm.disabled = true;
        btnConfirm.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> กำลังบันทึก...`;
    }

    try {
        const rowsToInsert = cart.map(item => ({
            customer_type: item.typeLabel,
            product_name: item.rawName,
            quantity: item.qty,
            total_price: item.price * item.qty
        }));

        const { error } = await supabaseClient
            .from('coffee_sales')
            .insert(rowsToInsert);

        if (error) throw error;

        alert('ชำระเงินและบันทึกข้อมูลลง Supabase สำเร็จ!');
        cart = [];
        updateCartUI();
        closeCheckoutModal();
    } catch (err) {
        console.error(err);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message);
    } finally {
        if (btnConfirm) {
            btnConfirm.disabled = false;
            btnConfirm.innerHTML = `<i class="fa-solid fa-check"></i> ยืนยัน & บันทึกลง Supabase`;
        }
    }
}

async function loadSalesHistory() {
    const tbody = document.getElementById('sales-history-body');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-500">กำลังดึงข้อมูลจาก Supabase...</td></tr>`;

    try {
        const { data, error } = await supabaseClient
            .from('coffee_sales')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-500">ยังไม่มีประวัติการขาย</td></tr>`;
            document.getElementById('stats-total-revenue').innerText = '฿0.00';
            document.getElementById('stats-total-cups').innerText = '0 แก้ว';
            document.getElementById('stats-total-orders').innerText = '0 รายการ';
            return;
        }

        let totalRev = 0;
        let totalCups = 0;

        tbody.innerHTML = data.map(row => {
            totalRev += Number(row.total_price);
            totalCups += Number(row.quantity);
            const formattedDate = new Date(row.created_at).toLocaleString('th-TH', {
                dateStyle: 'short',
                timeStyle: 'medium'
            });
            return `
                <tr class="hover:bg-slate-800/30 transition">
                    <td class="px-4 py-3 text-slate-400">${formattedDate}</td>
                    <td class="px-4 py-3"><span class="px-2 py-0.5 bg-slate-800 text-slate-300 rounded">${row.customer_type}</span></td>
                    <td class="px-4 py-3 font-medium text-slate-200">${row.product_name}</td>
                    <td class="px-4 py-3 text-right">${row.quantity}</td>
                    <td class="px-4 py-3 text-right font-mono font-bold text-amber-400">฿${row.total_price}</td>
                </tr>
            `;
        }).join('');

        document.getElementById('stats-total-revenue').innerText = `฿${totalRev.toLocaleString()}`;
        document.getElementById('stats-total-cups').innerText = `${totalCups.toLocaleString()} แก้ว`;
        document.getElementById('stats-total-orders').innerText = `${data.length} รายการ`;

    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-red-400">ไม่สามารถโหลดข้อมูลได้: ${err.message}</td></tr>`;
    }
}
