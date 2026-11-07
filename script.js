// --- CONFIGURATION SUPABASE ---
const SUPABASE_URL = 'https://wtyvtjvzvgurybtcnnsf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JLPzS9fSB0-mJN9D3Vssiw_ibQEXq4d';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- PRODUCT CATALOG ---
const PRODUCTS = [
    { id: 1, name: 'อเมริกาโน่ร้อน', category: 'hot-coffee', icon: '☕', cogs: 16.82, priceSoldier: 25, priceTourist: 35, beanGram: 18, cupType: 'แก้วร้อน', lidType: 'ฝาร้อน' },
    { id: 2, name: 'อเมริกาโน่เย็น', category: 'iced-coffee', icon: '🧊', cogs: 17.50, priceSoldier: 30, priceTourist: 45, beanGram: 20, cupType: 'แก้วเย็น', lidType: 'ฝาเย็น' }
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
    if (document.getElementById('cost-bean-per-gram')) {
        calculateCosts();
    }
};

// --- POS FUNCTIONS ---
function setCustomerType(type) {
    customerType = type;
    const btnSoldier = document.getElementById('btn-soldier');
    const btnTourist = document.getElementById('btn-tourist');
    if (!btnSoldier || !btnTourist) return;

    if (type === 'soldier') {
        btnSoldier.className = "flex-1 py-2 rounded-lg text-white bg-black font-bold text-xs transition flex items-center justify-center gap-1";
        btnTourist.className = "flex-1 py-2 rounded-lg text-black hover:bg-gray-200 font-bold text-xs transition flex items-center justify-center gap-1";
    } else {
        btnTourist.className = "flex-1 py-2 rounded-lg text-white bg-black font-bold text-xs transition flex items-center justify-center gap-1";
        btnSoldier.className = "flex-1 py-2 rounded-lg text-black hover:bg-gray-200 font-bold text-xs transition flex items-center justify-center gap-1";
    }
    renderProducts();
}

function filterCategory(cat, event) {
    currentCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.className = "cat-btn px-3 py-2 rounded-xl font-bold bg-gray-100 text-black border-2 border-black text-xs whitespace-nowrap";
    });
    if (event && event.currentTarget) {
        event.currentTarget.className = "cat-btn px-3 py-2 rounded-xl font-bold bg-black text-white text-xs whitespace-nowrap shadow";
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
            <div onclick="addToCart(${p.id})" class="bg-gray-50 border-2 border-black rounded-xl p-3 flex flex-col justify-between hover:bg-gray-100 transition cursor-pointer select-none shadow-sm active:scale-95">
                <div class="bg-white border-2 border-black rounded-lg h-16 flex items-center justify-center text-3xl mb-2 relative">
                    ${p.icon}
                    <span class="absolute top-1 right-1 text-[9px] font-bold bg-black text-white px-1.5 py-0.5 rounded-full font-mono">ทุน ฿${p.cogs}</span>
                </div>
                <div>
                    <h4 class="font-extrabold text-xs text-black">${p.name}</h4>
                    <div class="flex items-center justify-between mt-1.5 pt-1 border-t border-gray-200">
                        <span class="text-black font-black text-sm font-mono">฿${price}</span>
                        <span class="text-[9px] font-bold text-gray-700 bg-gray-200 px-1 py-0.5 rounded">กำไร +฿${profit.toFixed(1)}</span>
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
    const btnCheckout = document.getElementById('btn-checkout');
    if (!list) return;

    if (cart.length === 0) {
        list.innerHTML = `
            <div class="h-28 flex flex-col items-center justify-center text-gray-400 space-y-1.5">
                <i class="fa-solid fa-basket-shopping text-2xl"></i>
                <p class="text-xs font-medium">ยังไม่มีรายการในตะกร้า</p>
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
            <div class="flex items-center justify-between bg-gray-50 p-2 rounded-xl border-2 border-black text-xs shadow-sm">
                <div class="flex-1 pr-1">
                    <h5 class="font-bold text-black text-xs">${item.name}</h5>
                    <p class="font-mono text-black font-bold mt-0.5">฿${itemTotal} (${item.price}x${item.qty})</p>
                </div>
                <div class="flex items-center gap-1">
                    <div class="flex items-center gap-0.5 bg-white border-2 border-black rounded-lg p-0.5">
                        <button onclick="updateQty(${idx}, -1)" class="w-5 h-5 flex items-center justify-center bg-gray-200 hover:bg-black hover:text-white rounded text-black font-black">-</button>
                        <span class="w-4 text-center font-black text-xs">${item.qty}</span>
                        <button onclick="updateQty(${idx}, 1)" class="w-5 h-5 flex items-center justify-center bg-gray-200 hover:bg-black hover:text-white rounded text-black font-black">+</button>
                    </div>
                    <button onclick="removeFromCart(${idx})" class="w-6 h-6 flex items-center justify-center bg-red-100 hover:bg-red-600 hover:text-white text-red-600 border-2 border-black rounded-lg font-bold" title="ลบ">
                        <i class="fa-solid fa-trash-can text-[10px]"></i>
                    </button>
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
    document.getElementById('order-note').value = '';
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

// --- SUPABASE ACTIONS & INVENTORY DEDUCTION ---
async function completePaymentAndSave() {
    const btnConfirm = document.getElementById('btn-confirm-pay');
    const orderNote = document.getElementById('order-note').value.trim();
    if (btnConfirm) {
        btnConfirm.disabled = true;
        btnConfirm.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> บันทึก...`;
    }

    try {
        const rowsToInsert = cart.map(item => ({
            customer_type: item.typeLabel,
            product_name: item.rawName,
            quantity: item.qty,
            total_price: item.price * item.qty,
            note: orderNote || '-'
        }));

        const { error } = await supabaseClient
            .from('coffee_sales')
            .insert(rowsToInsert);

        if (error) throw error;

        for (const item of cart) {
            await deductInventory('เมล็ดกาแฟ', item.beanGram * item.qty);
            await deductInventory(item.cupType, item.qty);
            await deductInventory(item.lidType, item.qty);
            await deductInventory('หลอด', item.qty);
        }

        alert('ชำระเงินและบันทึกสำเร็จ!');
        cart = [];
        updateCartUI();
        closeCheckoutModal();
    } catch (err) {
        console.error(err);
        alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
        if (btnConfirm) {
            btnConfirm.disabled = false;
            btnConfirm.innerHTML = `<i class="fa-solid fa-check"></i> ยืนยัน & บันทึก`;
        }
    }
}

async function deductInventory(itemName, amount) {
    try {
        const { data } = await supabaseClient
            .from('inventory')
            .select('*')
            .eq('item_name', itemName)
            .single();

        if (data) {
            const newQty = Math.max(0, Number(data.quantity) - amount);
            await supabaseClient
                .from('inventory')
                .update({ quantity: newQty })
                .eq('item_name', itemName);
        }
    } catch (e) {
        console.error('Inventory error:', e);
    }
}

async function loadSalesHistory() {
    const tbody = document.getElementById('sales-history-body');
    const filterDate = document.getElementById('filter-date') ? document.getElementById('filter-date').value : '';
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-gray-500 font-medium">กำลังโหลด...</td></tr>`;

    try {
        const { data, error } = await supabaseClient
            .from('coffee_sales')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-gray-500 font-medium">ยังไม่มีประวัติการขาย</td></tr>`;
            document.getElementById('stats-total-revenue').innerText = '฿0.00';
            document.getElementById('stats-soldier-cups').innerText = '0 แก้ว';
            document.getElementById('stats-tourist-cups').innerText = '0 แก้ว';
            document.getElementById('stats-total-orders').innerText = '0 รายการ';
            return;
        }

        let filteredData = data;
        if (filterDate) {
            filteredData = data.filter(row => row.created_at.startsWith(filterDate));
        }

        let totalRev = 0;
        let soldierCups = 0;
        let touristCups = 0;

        tbody.innerHTML = filteredData.map(row => {
            totalRev += Number(row.total_price);
            if (row.customer_type === 'กำลังพล') {
                soldierCups += Number(row.quantity);
            } else {
                touristCups += Number(row.quantity);
            }

            const formattedDate = new Date(row.created_at).toLocaleString('th-TH', {
                dateStyle: 'short',
                timeStyle: 'medium'
            });
            return `
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-3 py-2.5 font-medium text-gray-600">${formattedDate}</td>
                    <td class="px-3 py-2.5"><span class="px-2 py-0.5 bg-black text-white font-bold rounded text-[10px]">${row.customer_type}</span></td>
                    <td class="px-3 py-2.5 font-bold text-black">${row.product_name}</td>
                    <td class="px-3 py-2.5 text-gray-700">${row.note || '-'}</td>
                    <td class="px-3 py-2.5 text-right font-mono font-bold">${row.quantity}</td>
                    <td class="px-3 py-2.5 text-right font-mono font-black">฿${row.total_price}</td>
                </tr>
            `;
        }).join('');

        document.getElementById('stats-total-revenue').innerText = `฿${totalRev.toLocaleString()}`;
        document.getElementById('stats-soldier-cups').innerText = `${soldierCups.toLocaleString()} แก้ว`;
        document.getElementById('stats-tourist-cups').innerText = `${touristCups.toLocaleString()} แก้ว`;
        document.getElementById('stats-total-orders').innerText = `${filteredData.length} รายการ`;

    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-red-600 font-bold">โหลดข้อมูลไม่สำเร็จ</td></tr>`;
    }
}

// --- COST & BREAK-EVEN CALCULATOR ---
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

    const hotCogsEl = document.getElementById('result-hot-cogs');
    const icedCogsEl = document.getElementById('result-iced-cogs');
    const avgProfitEl = document.getElementById('result-avg-profit');
    const breakEvenCupsEl = document.getElementById('result-break-even-cups');

    if (hotCogsEl) hotCogsEl.innerText = `฿${hotCogs.toFixed(2)}`;
    if (icedCogsEl) icedCogsEl.innerText = `฿${icedCogs.toFixed(2)}`;

    const avgPrice = (30 + 37.5) / 2; // ราคาเฉลี่ยระหว่างกำลังพลและนักท่องเที่ยว
    const avgCogs = (hotCogs + icedCogs) / 2;
    const avgProfit = avgPrice - avgCogs;

    if (avgProfitEl) avgProfitEl.innerText = `฿${avgProfit.toFixed(2)}`;

    const breakEvenCups = avgProfit > 0 ? Math.ceil(totalCapex / avgProfit) : 0;
    if (breakEvenCupsEl) breakEvenCupsEl.innerText = `${breakEvenCups.toLocaleString()} แก้ว`;
}
