import React, { useEffect, useMemo, useState } from "react";
import Login from "./Login";

const initialMenu = [
  { id: "m1", name: "Idli (2 pcs)", category: "Breakfast", price: 30 },
  { id: "m2", name: "Masala Dosa", category: "Breakfast", price: 60 },
  { id: "m3", name: "Plain Dosa", category: "Breakfast", price: 45 },
  { id: "m4", name: "Vada (2 pcs)", category: "Breakfast", price: 30 },
  { id: "m5", name: "Poori (2 pcs)", category: "Breakfast", price: 50 },
  { id: "m6", name: "Meals", category: "Meals", price: 100 },
  { id: "m7", name: "Tea", category: "Beverages", price: 15 },
  { id: "m8", name: "Coffee", category: "Beverages", price: 20 }
];
const starter = { menu: initialMenu, bills: [], purchases: [], expenses: [], stock: [], suppliers: [], settings: { hotelName: "YOUR HOTEL", address: "", phone: "", gstin: "", billPrefix: "BILL", nextBill: 1 }, cashOpening: 0 };
const money = n => "₹" + (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0,10);
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
function useStore() {
  const [data, setData] = useState(() => {
    try { return { ...starter, ...JSON.parse(localStorage.getItem("hotel-desk-data") || "{}") }; }
    catch { return starter; }
  });
  useEffect(() => { localStorage.setItem("hotel-desk-data", JSON.stringify(data)); }, [data]);
  return [data, setData];
}
const nav = [
  ["Overview","▦"], ["Billing / POS","▤"], ["Sales & Bills","▧"], ["Purchases","⇩"],
  ["Expenses","₹"], ["Stock","▣"], ["Suppliers","♙"], ["Menu Items","☷"], ["Reports","◷"], ["Settings","⚙"]
];

export default function App() {
  const [data, setData] = useStore();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [page, setPage] = useState("Overview");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [category, setCategory] = useState("All");
  const [billDiscount, setBillDiscount] = useState(0);
  const [payment, setPayment] = useState("Cash");
  const [purchaseForm, setPurchaseForm] = useState({date:today(), supplier:"", item:"", qty:"", unit:"kg", rate:"", paid:"", notes:""});
  const [expenseForm, setExpenseForm] = useState({date:today(), category:"Other", amount:"", method:"Cash", notes:""});
  const [stockForm, setStockForm] = useState({name:"", unit:"kg", qty:"", min:""});
  const [supplierForm, setSupplierForm] = useState({name:"", phone:"", notes:""});
  const [menuForm, setMenuForm] = useState({name:"", category:"Breakfast", price:""});
  const [settingsForm, setSettingsForm] = useState(data.settings);
  const [reportDate, setReportDate] = useState(today());
  const [showAddItem, setShowAddItem] = useState(false);

  const update = (key, value) => setData(d => ({...d, [key]: value}));
  const notify = msg => { setToast(msg); setTimeout(() => setToast(""), 2600); };
  const todayBills = data.bills.filter(b => b.date === today() && !b.cancelled);
  const todaySales = todayBills.reduce((s,b)=>s+b.total,0);
  const todayPurchases = data.purchases.filter(p=>p.date===today()).reduce((s,p)=>s+p.total,0);
  const todayExpenses = data.expenses.filter(e=>e.date===today()).reduce((s,e)=>s+Number(e.amount),0);
  const categories = ["All", ...new Set(data.menu.map(i=>i.category))];
  const filteredMenu = data.menu.filter(i => (category==="All" || i.category===category) && i.name.toLowerCase().includes(search.toLowerCase()));
  const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const discount = Math.max(0, Math.min(Number(billDiscount)||0, subtotal));
  const billTotal = Math.max(0, subtotal-discount);
  const addToCart = item => setCart(old => {
    const found = old.find(i=>i.id===item.id);
    return found ? old.map(i=>i.id===item.id?{...i,qty:i.qty+1}:i) : [...old,{...item,qty:1}];
  });
  const saveBill = () => {
    if (!cart.length) return notify("Add at least one item first.");
    const billNo = `${data.settings.billPrefix || "BILL"}-${String(data.settings.nextBill || 1).padStart(4,"0")}`;
    const bill = {id:uid(), billNo, date:today(), time:new Date().toLocaleTimeString("en-IN"), items:cart.map(i=>({...i})), subtotal, discount, total:billTotal, payment, cancelled:false};
    setData(d=>({...d,bills:[bill,...d.bills],settings:{...d.settings,nextBill:(d.settings.nextBill||1)+1}}));
    setCart([]); setBillDiscount(0); setPage("Sales & Bills"); setTimeout(()=>window.print(),100);
  };
  const printBill = bill => {
    const w = window.open("", "_blank", "width=360,height=700");
    if (!w) return notify("Allow pop-ups to print the receipt.");
    w.document.write(`<html><head><title>${bill.billNo}</title><style>
      @page{size:80mm auto;margin:3mm}body{font:12px monospace;width:72mm;margin:0 auto;color:#000}
      h2,p{text-align:center;margin:4px 0}hr{border:0;border-top:1px dashed #000}
      table{width:100%;border-collapse:collapse}td{padding:3px 0;vertical-align:top}
      .r{text-align:right}.center{text-align:center}.small{font-size:10px}
      </style></head><body><h2>${escapeHtml(data.settings.hotelName||"YOUR HOTEL")}</h2>
      <p>${escapeHtml(data.settings.address||"")}</p><p>${escapeHtml(data.settings.phone||"")}</p><hr/>
      <p>Bill: ${escapeHtml(bill.billNo)}<br/>${escapeHtml(bill.date)} ${escapeHtml(bill.time||"")}</p><hr/>
      <table><tr><td>Item</td><td class="r">Qty</td><td class="r">Amt</td></tr>
      ${bill.items.map(i=>`<tr><td>${escapeHtml(i.name)}<br/><span class="small">${money(i.price)} each</span></td><td class="r">${i.qty}</td><td class="r">${money(i.price*i.qty)}</td></tr>`).join("")}</table><hr/>
      <table><tr><td>Subtotal</td><td class="r">${money(bill.subtotal)}</td></tr>
      ${bill.discount?`<tr><td>Discount</td><td class="r">-${money(bill.discount)}</td></tr>`:""}
      <tr><td><b>TOTAL</b></td><td class="r"><b>${money(bill.total)}</b></td></tr></table>
      <hr/><p>Payment: ${escapeHtml(bill.payment)}</p><p>Thank you! Visit again.</p><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script></body></html>`);
    w.document.close();
  };
  const cancelBill = bill => {
    if (!confirm(`Cancel ${bill.billNo}? It will remain in the records marked cancelled.`)) return;
    update("bills", data.bills.map(b=>b.id===bill.id?{...b,cancelled:true}:b));
  };
  const addPurchase = e => {
    e.preventDefault();
    const qty=Number(purchaseForm.qty), rate=Number(purchaseForm.rate);
    if (!purchaseForm.item.trim() || qty<=0 || rate<0) return notify("Enter item, quantity and a valid rate.");
    const total=qty*rate, paid=Math.max(0,Math.min(Number(purchaseForm.paid)||0,total));
    const p={id:uid(),...purchaseForm,qty,rate,total,paid,balance:total-paid};
    setData(d=>({...d,purchases:[p,...d.purchases],stock:mergeStock(d.stock,purchaseForm.item,purchaseForm.unit,qty)}));
    setPurchaseForm({date:today(),supplier:"",item:"",qty:"",unit:"kg",rate:"",paid:"",notes:""}); notify("Purchase saved and stock updated.");
  };
  const addExpense = e => {
    e.preventDefault(); if(Number(expenseForm.amount)<=0) return notify("Enter an amount greater than zero.");
    update("expenses",[{id:uid(),...expenseForm,amount:Number(expenseForm.amount)},...data.expenses]);
    setExpenseForm({date:today(),category:"Other",amount:"",method:"Cash",notes:""}); notify("Expense saved.");
  };
  const addStock = e => {
    e.preventDefault(); if(!stockForm.name.trim()) return notify("Enter a stock item name.");
    update("stock",mergeStock(data.stock,stockForm.name,stockForm.unit,Number(stockForm.qty)||0,Number(stockForm.min)||0));
    setStockForm({name:"",unit:"kg",qty:"",min:""}); notify("Stock item saved.");
  };
  const addSupplier = e => {
    e.preventDefault(); if(!supplierForm.name.trim()) return notify("Enter supplier name.");
    update("suppliers",[{id:uid(),...supplierForm},...data.suppliers]); setSupplierForm({name:"",phone:"",notes:""}); notify("Supplier saved.");
  };
  const addMenuItem = e => {
    e.preventDefault(); if(!menuForm.name.trim()||Number(menuForm.price)<0) return notify("Enter item name and price.");
    update("menu",[...data.menu,{id:uid(),...menuForm,price:Number(menuForm.price)}]); setMenuForm({name:"",category:"Breakfast",price:""}); setShowAddItem(false); notify("Menu item added.");
  };
  const reportBills = data.bills.filter(b=>b.date===reportDate&&!b.cancelled);
  const reportSales = reportBills.reduce((s,b)=>s+b.total,0);
  const reportPurchases = data.purchases.filter(p=>p.date===reportDate).reduce((s,p)=>s+p.total,0);
  const reportExpenses = data.expenses.filter(e=>e.date===reportDate).reduce((s,e)=>s+Number(e.amount),0);
  const monthKey = today().slice(0,7);
  const monthSales = data.bills.filter(b=>b.date?.startsWith(monthKey)&&!b.cancelled).reduce((s,b)=>s+b.total,0);
  const monthPurchases = data.purchases.filter(p=>p.date?.startsWith(monthKey)).reduce((s,p)=>s+p.total,0);
  const monthExpenses = data.expenses.filter(e=>e.date?.startsWith(monthKey)).reduce((s,e)=>s+Number(e.amount),0);

if (!isLoggedIn) {
  return <Login onLogin={() => setIsLoggedIn(true)} />;
}

return <div className="app-shell">    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">H</div><div><strong>Hotel Desk</strong><small>MANAGEMENT SYSTEM</small></div></div>
      <div className="side-label">WORKSPACE</div>
      <nav>{nav.map(([name,icon])=><button key={name} className={page===name?"nav-item active":"nav-item"} onClick={()=>setPage(name)}><span className="nav-icon">{icon}</span>{name}{name==="Billing / POS"&&<span className="nav-dot"/>}</button>)}</nav>
      <div className="sidebar-bottom"><span className="status-dot"/> Data saved in this browser <small>Local device storage</small></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="mobile-brand">Hotel Desk</div><div className="crumb">Workspace <span>/</span> <b>{page}</b></div><div className="top-actions"><span className="today-chip">{new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span><button className="avatar" title="Settings" onClick={()=>setPage("Settings")}>HD</button></div></header>
      <div className="content">
        {page==="Overview"&&<><div className="page-heading"><div><p className="eyebrow">YOUR BUSINESS AT A GLANCE</p><h1>Good {new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"} 👋</h1><p className="muted">Here’s what’s happening at your hotel today.</p></div><button className="primary" onClick={()=>setPage("Billing / POS")}>＋ New bill</button></div>
          <div className="stat-grid">
            <Stat title="Today's sales" value={money(todaySales)} note={`${todayBills.length} completed bills`} icon="↗" tone="green"/>
            <Stat title="Purchases today" value={money(todayPurchases)} note="Stock buying recorded" icon="⇩" tone="blue"/>
            <Stat title="Expenses today" value={money(todayExpenses)} note="Operating expenses" icon="₹" tone="orange"/>
            <Stat title="Estimated today" value={money(todaySales-todayPurchases-todayExpenses)} note="Sales − purchases − expenses" icon="⌁" tone="purple"/>
          </div>
          <div className="dashboard-grid"><section className="panel"><div className="panel-head"><div><h2>Recent bills</h2><p>Latest completed transactions</p></div><button className="text-button" onClick={()=>setPage("Sales & Bills")}>View all →</button></div>
            {data.bills.filter(b=>!b.cancelled).slice(0,5).length?<div className="table-wrap"><table><thead><tr><th>Bill no.</th><th>Time</th><th>Items</th><th className="right">Amount</th></tr></thead><tbody>{data.bills.filter(b=>!b.cancelled).slice(0,5).map(b=><tr key={b.id}><td><b>{b.billNo}</b></td><td>{b.time||b.date}</td><td>{b.items.reduce((s,i)=>s+i.qty,0)} items</td><td className="right amount">{money(b.total)}</td></tr>)}</tbody></table></div>:<Empty title="No bills yet" text="Create your first bill from Billing / POS." action={()=>setPage("Billing / POS")}/>}</section>
            <section className="panel quick-panel"><div className="panel-head"><div><h2>Quick actions</h2><p>Common tasks</p></div></div><div className="quick-list"><Quick icon="▤" title="Create a customer bill" text="Add items and print receipt" click={()=>setPage("Billing / POS")}/><Quick icon="⇩" title="Record a purchase" text="Update ingredient stock" click={()=>setPage("Purchases")}/><Quick icon="₹" title="Add an expense" text="Track daily spending" click={()=>setPage("Expenses")}/><Quick icon="◷" title="View reports" text="Check sales and spending" click={()=>setPage("Reports")}/></div></section></div>
          <div className="note-banner"><div className="note-icon">i</div><div><b>Start by setting up your hotel details</b><p>Add your hotel name, address and phone number in Settings. These details will appear on printed receipts.</p></div><button onClick={()=>setPage("Settings")}>Set up →</button></div>
        </>}

        {page==="Billing / POS"&&<><div className="page-heading"><div><p className="eyebrow">POINT OF SALE</p><h1>Billing / POS</h1><p className="muted">Tap menu items to add them to the customer bill.</p></div><span className="live-pill"><i/> POS ready</span></div>
          <div className="pos-layout"><section className="panel menu-panel"><div className="search-row"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="⌕  Search menu items..."/><button className="outline" onClick={()=>setShowAddItem(true)}>＋ Add item</button></div><div className="category-row">{categories.map(c=><button key={c} className={category===c?"category active":"category"} onClick={()=>setCategory(c)}>{c}</button>)}</div>
            <div className="menu-grid">{filteredMenu.map(item=><button key={item.id} className="menu-card" onClick={()=>addToCart(item)}><span className="food-icon">{item.category==="Beverages"?"☕":item.category==="Meals"?"🍛":"◉"}</span><b>{item.name}</b><small>{item.category}</small><strong>{money(item.price)}</strong><span className="add-bubble">+</span></button>)}</div>
            {!filteredMenu.length&&<Empty title="No menu items found" text="Try a different search or add a new item." action={()=>setShowAddItem(true)}/>}</section>
            <section className="panel cart-panel"><div className="panel-head"><div><h2>Current bill</h2><p>{cart.reduce((s,i)=>s+i.qty,0)} items in order</p></div><button className="text-button danger-text" onClick={()=>{setCart([]);setBillDiscount(0)}}>Clear</button></div>
              <div className="cart-items">{cart.map(i=><div className="cart-row" key={i.id}><div className="cart-item-info"><b>{i.name}</b><small>{money(i.price)} each</small></div><div className="qty-control"><button onClick={()=>setCart(c=>c.map(x=>x.id===i.id?{...x,qty:x.qty-1}:x).filter(x=>x.qty>0))}>−</button><span>{i.qty}</span><button onClick={()=>setCart(c=>c.map(x=>x.id===i.id?{...x,qty:x.qty+1}:x))}>+</button></div><b className="line-total">{money(i.price*i.qty)}</b></div>)}
              {!cart.length&&<div className="cart-empty"><div>▤</div><b>Your bill is empty</b><span>Select items from the menu to get started.</span></div>}</div>
              <div className="bill-summary"><div className="summary-line"><span>Subtotal</span><b>{money(subtotal)}</b></div><div className="discount-line"><label>Discount (₹)</label><input type="number" min="0" max={subtotal} value={billDiscount} onChange={e=>setBillDiscount(e.target.value)} /></div><div className="summary-line grand"><span>Total due</span><strong>{money(billTotal)}</strong></div><label className="field-label">Payment method</label><div className="payment-options">{["Cash","UPI","Card","Credit"].map(p=><button key={p} className={payment===p?"pay-option selected":"pay-option"} onClick={()=>setPayment(p)}>{p}</button>)}</div><button className="primary checkout" disabled={!cart.length} onClick={saveBill}>Save bill &amp; print receipt <span>→</span></button><p className="print-hint">80mm receipt layout · Works with compatible thermal printers</p></div>
            </section></div>
          {showAddItem&&<Modal title="Add menu item" close={()=>setShowAddItem(false)}><form onSubmit={addMenuItem} className="form-grid"><Field label="Item name" required><input value={menuForm.name} onChange={e=>setMenuForm({...menuForm,name:e.target.value})} required placeholder="e.g. Rava idli"/></Field><Field label="Category"><select value={menuForm.category} onChange={e=>setMenuForm({...menuForm,category:e.target.value})}><option>Breakfast</option><option>Meals</option><option>Beverages</option><option>Snacks</option><option>Other</option></select></Field><Field label="Selling price (₹)" required><input type="number" min="0" step=".01" value={menuForm.price} onChange={e=>setMenuForm({...menuForm,price:e.target.value})} required/></Field><div className="form-actions"><button type="button" className="outline" onClick={()=>setShowAddItem(false)}>Cancel</button><button className="primary">Save item</button></div></form></Modal>}</>}

        {page==="Sales & Bills"&&<><PageTitle eyebrow="TRANSACTION REGISTER" title="Sales & Bills" subtitle="Search, review and reprint saved customer bills."/><div className="panel"><div className="toolbar"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search bill number or date..."/><button className="outline" onClick={()=>downloadCsv("sales.csv",[["Bill No","Date","Time","Items","Subtotal","Discount","Total","Payment","Status"],...data.bills.map(b=>[b.billNo,b.date,b.time||"",b.items.map(i=>`${i.name} x${i.qty}`).join("; "),b.subtotal,b.discount,b.total,b.payment,b.cancelled?"Cancelled":"Completed"])])}>Export CSV ↓</button></div><DataTable headers={["Bill no.","Date","Items","Payment","Total","Status","Actions"]} rows={data.bills.filter(b=>(b.billNo+" "+b.date).toLowerCase().includes(search.toLowerCase())).map(b=>[<b>{b.billNo}</b>,b.date,b.items.reduce((s,i)=>s+i.qty,0),b.payment,money(b.total),<span className={b.cancelled?"status cancelled":"status paid"}>{b.cancelled?"Cancelled":"Completed"}</span>,<div className="row-actions"><button className="small-button" onClick={()=>printBill(b)}>Print</button>{!b.cancelled&&<button className="small-button danger" onClick={()=>cancelBill(b)}>Cancel</button>}</div>])} empty="No bills recorded yet."/></div></>}

        {page==="Purchases"&&<><PageTitle eyebrow="INVENTORY COSTS" title="Purchases" subtitle="Record supplier purchases, payment amounts and stock received."/><div className="two-col"><section className="panel"><PanelTitle title="Record purchase" subtitle="Stock is increased when a purchase is saved."/><form onSubmit={addPurchase} className="form-grid"><Field label="Purchase date"><input type="date" value={purchaseForm.date} onChange={e=>setPurchaseForm({...purchaseForm,date:e.target.value})} required/></Field><Field label="Supplier"><select value={purchaseForm.supplier} onChange={e=>setPurchaseForm({...purchaseForm,supplier:e.target.value})}><option value="">Select supplier (optional)</option>{data.suppliers.map(s=><option key={s.id}>{s.name}</option>)}</select></Field><Field label="Item / ingredient" required><input value={purchaseForm.item} onChange={e=>setPurchaseForm({...purchaseForm,item:e.target.value})} placeholder="e.g. Rice" required/></Field><div className="form-pair"><Field label="Quantity" required><input type="number" min=".01" step=".01" value={purchaseForm.qty} onChange={e=>setPurchaseForm({...purchaseForm,qty:e.target.value})} required/></Field><Field label="Unit"><select value={purchaseForm.unit} onChange={e=>setPurchaseForm({...purchaseForm,unit:e.target.value})}>{["kg","g","litre","ml","piece","packet","bag","box"].map(x=><option>{x}</option>)}</select></Field></div><Field label="Rate per unit (₹)" required><input type="number" min="0" step=".01" value={purchaseForm.rate} onChange={e=>setPurchaseForm({...purchaseForm,rate:e.target.value})} required/></Field><Field label="Amount paid (₹)"><input type="number" min="0" step=".01" value={purchaseForm.paid} onChange={e=>setPurchaseForm({...purchaseForm,paid:e.target.value})} placeholder="0 if unpaid"/></Field><Field label="Notes"><input value={purchaseForm.notes} onChange={e=>setPurchaseForm({...purchaseForm,notes:e.target.value})} placeholder="Invoice number, details..."/></Field><div className="form-total"><span>Purchase total</span><b>{money((Number(purchaseForm.qty)||0)*(Number(purchaseForm.rate)||0))}</b></div><button className="primary full">Save purchase</button></form></section><section className="panel"><PanelTitle title="Recent purchases" subtitle={`${data.purchases.length} records`} /><DataTable headers={["Date","Item","Supplier","Qty","Total","Balance"]} rows={data.purchases.slice(0,30).map(p=>[p.date,<b>{p.item}</b>,p.supplier||"—",`${p.qty} ${p.unit}`,money(p.total),money(p.balance)])} empty="No purchases recorded."/></section></div></>}

        {page==="Expenses"&&<><PageTitle eyebrow="OPERATING COSTS" title="Expenses" subtitle="Keep track of daily spending outside ingredient purchases."/><div className="two-col"><section className="panel"><PanelTitle title="Add expense" subtitle="Record rent, salaries, electricity, gas and more."/><form onSubmit={addExpense} className="form-grid"><Field label="Date"><input type="date" value={expenseForm.date} onChange={e=>setExpenseForm({...expenseForm,date:e.target.value})} required/></Field><Field label="Category"><select value={expenseForm.category} onChange={e=>setExpenseForm({...expenseForm,category:e.target.value})}>{["Salary","Rent","Electricity","Gas","Water","Repairs","Transport","Cleaning","Internet/Phone","Packaging","Other"].map(x=><option>{x}</option>)}</select></Field><Field label="Amount (₹)" required><input type="number" min=".01" step=".01" value={expenseForm.amount} onChange={e=>setExpenseForm({...expenseForm,amount:e.target.value})} required placeholder="0.00"/></Field><Field label="Payment method"><select value={expenseForm.method} onChange={e=>setExpenseForm({...expenseForm,method:e.target.value})}>{["Cash","UPI","Card","Bank transfer","Credit"].map(x=><option>{x}</option>)}</select></Field><Field label="Notes"><input value={expenseForm.notes} onChange={e=>setExpenseForm({...expenseForm,notes:e.target.value})} placeholder="What was this for?"/></Field><button className="primary full">Save expense</button></form></section><section className="panel"><PanelTitle title="Expense history" subtitle={`${data.expenses.length} records`} /><DataTable headers={["Date","Category","Notes","Method","Amount"]} rows={data.expenses.slice(0,40).map(e=>[e.date,<b>{e.category}</b>,e.notes||"—",e.method,money(e.amount)])} empty="No expenses recorded."/></section></div></>}

        {page==="Stock"&&<><PageTitle eyebrow="INVENTORY CONTROL" title="Stock" subtitle="Track ingredients and supplies. Purchases increase stock; record usage to keep quantities accurate."/><div className="two-col"><section className="panel"><PanelTitle title="Add stock item" subtitle="Create an item and opening quantity."/><form onSubmit={addStock} className="form-grid"><Field label="Item name" required><input value={stockForm.name} onChange={e=>setStockForm({...stockForm,name:e.target.value})} required placeholder="e.g. Cooking oil"/></Field><div className="form-pair"><Field label="Unit"><select value={stockForm.unit} onChange={e=>setStockForm({...stockForm,unit:e.target.value})}>{["kg","g","litre","ml","piece","packet","bag","box"].map(x=><option>{x}</option>)}</select></Field><Field label="Opening quantity"><input type="number" min="0" step=".01" value={stockForm.qty} onChange={e=>setStockForm({...stockForm,qty:e.target.value})}/></Field></div><Field label="Low-stock alert threshold"><input type="number" min="0" step=".01" value={stockForm.min} onChange={e=>setStockForm({...stockForm,min:e.target.value})} placeholder="Optional"/></Field><button className="primary full">Save stock item</button></form><div className="info-box">Tip: purchases automatically add to matching stock items. Use the same item name and unit consistently.</div></section><section className="panel"><PanelTitle title="Current stock" subtitle={`${data.stock.length} stock items`} /><DataTable headers={["Item","Quantity","Alert at","Status"]} rows={data.stock.map(s=>[<b>{s.name}</b>,`${Number(s.qty).toLocaleString("en-IN")} ${s.unit}`,s.min??0,Number(s.qty)<=Number(s.min||0)?<span className="status low">Low stock</span>:<span className="status paid">In stock</span>])} empty="No stock items yet."/></section></div></>}

        {page==="Suppliers"&&<><PageTitle eyebrow="SUPPLIER DIRECTORY" title="Suppliers" subtitle="Maintain supplier contact details and review outstanding purchase balances."/><div className="two-col"><section className="panel"><PanelTitle title="Add supplier" subtitle="Keep contact information in one place."/><form onSubmit={addSupplier} className="form-grid"><Field label="Supplier / business name" required><input value={supplierForm.name} onChange={e=>setSupplierForm({...supplierForm,name:e.target.value})} required/></Field><Field label="Phone number"><input value={supplierForm.phone} onChange={e=>setSupplierForm({...supplierForm,phone:e.target.value})} inputMode="tel"/></Field><Field label="Notes / address"><textarea value={supplierForm.notes} onChange={e=>setSupplierForm({...supplierForm,notes:e.target.value})} rows="3"/></Field><button className="primary full">Save supplier</button></form></section><section className="panel"><PanelTitle title="Supplier directory" subtitle={`${data.suppliers.length} suppliers`} /><DataTable headers={["Supplier","Phone","Purchase total","Outstanding"]} rows={data.suppliers.map(s=>{const ps=data.purchases.filter(p=>p.supplier===s.name);return [<b>{s.name}</b>,s.phone||"—",money(ps.reduce((n,p)=>n+p.total,0)),money(ps.reduce((n,p)=>n+p.balance,0))]})} empty="No suppliers added yet."/></section></div></>}

        {page==="Menu Items"&&<><PageTitle eyebrow="MENU CONFIGURATION" title="Menu Items" subtitle="Manage the dishes and prices used at the billing counter."/><section className="panel"><div className="toolbar"><span className="muted">Items listed: {data.menu.length}</span><button className="primary" onClick={()=>setShowAddItem(true)}>＋ Add menu item</button></div><DataTable headers={["Item name","Category","Selling price","Action"]} rows={data.menu.map(i=>[<b>{i.name}</b>,i.category,money(i.price),<button className="small-button danger" onClick={()=>{if(confirm(`Remove ${i.name} from the menu?`))update("menu",data.menu.filter(x=>x.id!==i.id))}}>Remove</button>])} empty="No menu items."/></section>{showAddItem&&<Modal title="Add menu item" close={()=>setShowAddItem(false)}><form onSubmit={addMenuItem} className="form-grid"><Field label="Item name" required><input value={menuForm.name} onChange={e=>setMenuForm({...menuForm,name:e.target.value})} required/></Field><Field label="Category"><select value={menuForm.category} onChange={e=>setMenuForm({...menuForm,category:e.target.value})}>{["Breakfast","Meals","Beverages","Snacks","Other"].map(x=><option>{x}</option>)}</select></Field><Field label="Selling price (₹)" required><input type="number" min="0" step=".01" value={menuForm.price} onChange={e=>setMenuForm({...menuForm,price:e.target.value})} required/></Field><div className="form-actions"><button type="button" className="outline" onClick={()=>setShowAddItem(false)}>Cancel</button><button className="primary">Save item</button></div></form></Modal>}</>}

        {page==="Reports"&&<><PageTitle eyebrow="BUSINESS PERFORMANCE" title="Reports" subtitle="Review daily performance and export records for bookkeeping."/><section className="panel report-filter"><Field label="Choose date"><input type="date" value={reportDate} onChange={e=>setReportDate(e.target.value)}/></Field><button className="outline" onClick={()=>downloadCsv(`hotel-report-${reportDate}.csv`,[["Report date",reportDate],[],["SALES"],["Bill","Time","Total","Payment"],...reportBills.map(b=>[b.billNo,b.time||"",b.total,b.payment]),[],["PURCHASES"],["Date","Item","Supplier","Quantity","Rate","Total","Paid","Balance"],...data.purchases.filter(p=>p.date===reportDate).map(p=>[p.date,p.item,p.supplier,p.qty+" "+p.unit,p.rate,p.total,p.paid,p.balance]),[],["EXPENSES"],["Date","Category","Notes","Method","Amount"],...data.expenses.filter(e=>e.date===reportDate).map(e=>[e.date,e.category,e.notes,e.method,e.amount])])}>Export selected day ↓</button></section><div className="stat-grid report-stats"><Stat title="Sales" value={money(reportSales)} note={`${reportBills.length} bills`} icon="↗" tone="green"/><Stat title="Purchases" value={money(reportPurchases)} note="Purchases recorded" icon="⇩" tone="blue"/><Stat title="Expenses" value={money(reportExpenses)} note="Expenses recorded" icon="₹" tone="orange"/><Stat title="Difference" value={money(reportSales-reportPurchases-reportExpenses)} note="Sales − purchases − expenses" icon="⌁" tone="purple"/></div><div className="panel"><PanelTitle title="Month-to-date overview" subtitle="Current calendar month" /><div className="month-grid"><Metric label="Sales" value={money(monthSales)}/><Metric label="Purchases" value={money(monthPurchases)}/><Metric label="Expenses" value={money(monthExpenses)}/><Metric label="Difference" value={money(monthSales-monthPurchases-monthExpenses)}/></div><div className="info-box">This difference is a simple management estimate, not formal accounting profit. It does not yet account for opening/closing inventory, wastage, unpaid sales, tax, depreciation or other adjustments.</div></div><div className="panel"><PanelTitle title={`Bills on ${reportDate}`} subtitle="Completed sales only"/><DataTable headers={["Bill","Time","Items","Payment","Total"]} rows={reportBills.map(b=>[<b>{b.billNo}</b>,b.time||"—",b.items.reduce((s,i)=>s+i.qty,0),b.payment,money(b.total)])} empty="No completed bills for this date."/></div></>}

        {page==="Settings"&&<><PageTitle eyebrow="BUSINESS PROFILE" title="Settings" subtitle="Set the details printed on customer receipts and manage your records."/><div className="settings-grid"><section className="panel"><PanelTitle title="Hotel details" subtitle="Shown at the top of the receipt."/><form className="form-grid" onSubmit={e=>{e.preventDefault();update("settings",{...settingsForm,nextBill:data.settings.nextBill||1});notify("Hotel settings saved.")}}><Field label="Hotel name" required><input value={settingsForm.hotelName||""} onChange={e=>setSettingsForm({...settingsForm,hotelName:e.target.value})} required/></Field><Field label="Address"><textarea rows="2" value={settingsForm.address||""} onChange={e=>setSettingsForm({...settingsForm,address:e.target.value})}/></Field><Field label="Phone"><input value={settingsForm.phone||""} onChange={e=>setSettingsForm({...settingsForm,phone:e.target.value})}/></Field><Field label="GSTIN (optional)"><input value={settingsForm.gstin||""} onChange={e=>setSettingsForm({...settingsForm,gstin:e.target.value})}/></Field><Field label="Bill number prefix"><input value={settingsForm.billPrefix||"BILL"} onChange={e=>setSettingsForm({...settingsForm,billPrefix:e.target.value})}/></Field><button className="primary full">Save hotel details</button></form></section><section className="panel"><PanelTitle title="Data & backups" subtitle="Keep a safe copy of your business records."/><div className="backup-actions"><div><b>Export full backup</b><p>Download menu, bills, purchases, expenses, stock, suppliers and settings as a JSON file.</p><button className="outline" onClick={()=>downloadJson(data)}>Download backup ↓</button></div><div className="divider"/><div><b>Restore backup</b><p>Import a previously downloaded Hotel Desk JSON backup into this browser.</p><label className="outline file-label">Choose backup file<input type="file" accept=".json,application/json" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const obj=JSON.parse(r.result);if(!obj.menu||!obj.bills)throw new Error("Invalid backup");if(confirm("Replace current records with this backup?")){setData({...starter,...obj});setSettingsForm(obj.settings||starter.settings);notify("Backup restored.")}}catch{notify("Could not read this backup file.")}};r.readAsText(f);e.target.value=""}}/></label></div><div className="divider"/><div><b>Clear all records</b><p>Destructive action. Download a backup before clearing your data.</p><button className="outline danger" onClick={()=>{if(prompt('Type DELETE to permanently clear this browser’s Hotel Desk records.')==="DELETE"){setData(starter);setSettingsForm(starter.settings);setCart([]);notify("Local records cleared.")}}}>Clear local data</button></div></div></section></div><div className="note-banner"><div className="note-icon">!</div><div><b>Important: this version stores data in this browser</b><p>Records persist on this device and browser, but do not automatically sync between your computer and mobile. For shared live records across devices, connect a cloud database and authentication before using it as the hotel's official system.</p></div></div></>}
      </div>
      <footer className="footer"><span>Hotel Desk <span className="muted">· Management workspace</span></span><span><i className="status-dot"/> Local data storage</span></footer>
    </main>
    {toast&&<div className="toast">{toast}</div>}
  </div>;
}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function mergeStock(stock,name,unit,qty,min=0){const existing=stock.find(s=>s.name.toLowerCase()===String(name).toLowerCase()&&s.unit===unit);return existing?stock.map(s=>s.id===existing.id?{...s,qty:Number(s.qty)+Number(qty),min:min||s.min||0}:s):[...stock,{id:uid(),name,unit,qty:Number(qty)||0,min:Number(min)||0}];}
function downloadCsv(filename,rows){const csv=rows.map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"}));a.download=filename;a.click();URL.revokeObjectURL(a.href);}
function downloadJson(data){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.download=`hotel-desk-backup-${today()}.json`;a.click();URL.revokeObjectURL(a.href);}
function Stat({title,value,note,icon,tone}){return <div className="stat-card"><div className="stat-top"><span>{title}</span><span className={`stat-icon ${tone}`}>{icon}</span></div><strong className="stat-value">{value}</strong><small>{note}</small></div>}
function Quick({icon,title,text,click}){return <button className="quick-action" onClick={click}><span className="quick-icon">{icon}</span><span><b>{title}</b><small>{text}</small></span><span className="quick-arrow">→</span></button>}
function PageTitle({eyebrow,title,subtitle}){return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="muted">{subtitle}</p></div></div>}
function PanelTitle({title,subtitle}){return <div className="panel-head"><div><h2>{title}</h2><p>{subtitle}</p></div></div>}
function Field({label,children,required}){return <label className="field"><span>{label}{required&&<em> *</em>}</span>{children}</label>}
function Empty({title,text,action}){return <div className="empty"><div className="empty-icon">▤</div><b>{title}</b><p>{text}</p>{action&&<button className="text-button" onClick={action}>Get started →</button>}</div>}
function Metric({label,value}){return <div className="metric"><span>{label}</span><b>{value}</b></div>}
function Modal({title,close,children}){return <div className="modal-backdrop" onClick={close}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><h2>{title}</h2><button onClick={close}>✕</button></div>{children}</div></div>}
function DataTable({headers,rows,empty}){return !rows.length?<div className="empty compact"><div className="empty-icon">▤</div><b>{empty||"No records found."}</b></div>:<div className="table-wrap"><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j}>{v}</td>)}</tr>)}</tbody></table></div>}
