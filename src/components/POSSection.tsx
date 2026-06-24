import React, { useState } from 'react';
import { Product, ProductSale, CarServiceOrder, PaymentStatus } from '../types';
import { Search, ShoppingCart, Trash2, Plus, Minus, Percent, Coins, CreditCard, Landmark, Wallet, AlertCircle, Sparkles, Check } from 'lucide-react';

interface POSSectionProps {
  products: Product[];
  orders: CarServiceOrder[];
  onAddSale: (sale: Omit<ProductSale, 'id' | 'createdAt'>) => void;
  currentUser: any;
}

export default function POSSection({ products, orders, onAddSale, currentUser }: POSSectionProps) {
  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ყველა');

  // Cart state
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);

  // Client link state
  const [clientType, setClientType] = useState<'existing' | 'new'>('new');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newCarBrand, setNewCarBrand] = useState('');
  const [newCarNumber, setNewCarNumber] = useState('');

  // Discount state
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Payment state
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');

  // Success message modal/state
  const [successSale, setSuccessSale] = useState<any>(null);

  // Get categories list
  const categories = ['ყველა', ...Array.from(new Set(products.map((p) => p.category)))];

  // Filter products based on active queries
  const filteredProducts = products.filter((p) => {
    if (p.status !== 'active') return false;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ყველა' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Adding product to cart
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // block if exceeds stock
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.product.stock) return item; // limit to stock
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Pricing calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);
  
  let calculatedDiscount = 0;
  if (discountType === 'flat') {
    calculatedDiscount = Math.min(discountValue, cartSubtotal);
  } else {
    calculatedDiscount = Number(((cartSubtotal * Math.min(discountValue, 100)) / 100).toFixed(2));
  }
  
  const cartTotal = Math.max(0, cartSubtotal - calculatedDiscount);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Resolve client data
    let clientName = '';
    let clientPhone = '';
    let carBrand = '';
    let carNumber = '';

    if (clientType === 'existing') {
      const matchedOrder = orders.find((o) => o.id === selectedOrderId);
      if (matchedOrder) {
        clientName = matchedOrder.clientFullName;
        clientPhone = matchedOrder.clientPhone;
        carBrand = matchedOrder.carBrand;
        carNumber = matchedOrder.carNumber;
      } else {
        clientName = 'გავლითი კლიენტი';
      }
    } else {
      clientName = newClientName.trim() || 'გავლითი კლიენტი';
      clientPhone = newClientPhone.trim();
      carBrand = newCarBrand.trim();
      carNumber = newCarNumber.trim();
    }

    // Build items payload
    const items = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      purchasePrice: item.product.purchasePrice,
      salePrice: item.product.salePrice,
    }));

    // Trigger callback
    const salePayload = {
      clientName,
      clientPhone,
      carBrand,
      carNumber,
      date: new Date().toISOString().split('T')[0],
      totalAmount: cartSubtotal,
      discount: calculatedDiscount,
      finalAmount: cartTotal,
      paymentStatus,
      paymentMethod,
      items,
      createdBy: `${currentUser.firstName} ${currentUser.lastName}`,
    };

    onAddSale(salePayload as any);

    // Save success state for modal view
    setSuccessSale(salePayload);

    // Reset loop
    setCart([]);
    setNewClientName('');
    setNewClientPhone('');
    setNewCarBrand('');
    setNewCarNumber('');
    setDiscountValue(0);
    setPaymentMethod('cash');
    setPaymentStatus('paid');
  };

  const handleReceiptPrint = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-1 font-sans">
      {/* LEFT: Products section - 7 cols */}
      <div className="lg:col-span-7 space-y-4">
        {/* Search & filters bar */}
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-lg flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute inset-y-0 left-3 my-auto w-4 h-4 text-slate-500" />
            <input
              id="pos-product-search"
              type="text"
              placeholder="მოძებნე სახელით, ბრენდით ან SKU კოდით..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500/60"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-[10.5px] font-bold rounded-lg whitespace-nowrap cursor-pointer transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 border border-slate-800/80 hover:bg-slate-800/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products list area */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2 max-h-[64vh] overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="col-span-4 text-center py-12 bg-slate-900 border border-dashed border-slate-800 rounded-xl space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-slate-400 text-xs">არცერთი აქტიური პროდუქტი არ მოიძებნა</p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const inStock = p.stock > 0;
              const cartItem = cart.find((item) => item.product.id === p.id);
              const qtyInCart = cartItem ? cartItem.quantity : 0;
              const isFullySelected = qtyInCart >= p.stock;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    if (inStock && !isFullySelected) {
                      addToCart(p);
                    }
                  }}
                  className={`bg-slate-900 border rounded-lg overflow-hidden flex flex-col justify-between transition-all cursor-pointer relative ${
                    qtyInCart > 0 ? 'ring-2 ring-amber-500 border-amber-500/50' : 'border-slate-800 hover:border-slate-705'
                  }`}
                  title={inStock ? `${p.name} • დააჭირეთ დასამატებლად` : `${p.name} (ამოიწურა)`}
                >
                  {/* Photo area */}
                  <div className="h-20 w-full bg-slate-950 relative overflow-hidden flex items-center justify-center border-b border-slate-850">
                    {p.photoUrl ? (
                      <img
                        src={p.photoUrl}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-[10px] text-slate-700 font-bold uppercase select-none">ფოტო</span>
                    )}

                    {/* Quantity in cart badge */}
                    {qtyInCart > 0 && (
                      <div className="absolute top-1 right-1 bg-amber-500 text-slate-950 font-black font-mono text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center shadow">
                        {qtyInCart}
                      </div>
                    )}
                    
                    {!inStock && (
                      <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
                        <span className="text-[9px] font-black text-rose-500 bg-rose-950/80 px-1.5 py-0.5 rounded uppercase">
                          ამოიწურა
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body text area */}
                  <div className="p-2 flex-1 flex flex-col justify-between">
                    <h4 className="text-[10.5px] font-bold text-slate-200 line-clamp-2 leading-tight select-none">
                      {p.name}
                    </h4>

                    <div className="mt-1 pt-1 border-t border-slate-850 flex items-center justify-between">
                      <span className="text-[11px] font-black font-mono text-emerald-400">
                        {p.salePrice.toLocaleString()} ₾
                      </span>
                      {inStock && !isFullySelected && (
                        <span className="text-[10px] text-amber-500 font-bold leading-none select-none">
                          ➕
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Active Cart - 5 cols */}
      <div className="lg:col-span-5 flex flex-col bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden h-[74vh] justify-between">
        {/* Cart Header */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-200">
            <ShoppingCart className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider">POS კალათა</span>
            <span className="bg-slate-900 px-2 py-0.5 rounded-md text-[10px] text-slate-400 font-mono">
              {cart.reduce((sum, i) => sum + i.quantity, 0)}
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-[10px] text-rose-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> გაწმენდა
            </button>
          )}
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-2 p-6">
              <div className="w-12 h-12 rounded-full bg-slate-950/60 border border-slate-850 flex items-center justify-center text-slate-600">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <p className="text-slate-400 text-xs font-sans">კალათა ცარიელია</p>
              <p className="text-slate-600 text-[10px] max-w-[200px] leading-relaxed">
                დააწკაპუნეთ პროდუქტის ბარათებზე მულტი-შეკვეთის გასაფორმებლად
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 flex items-center gap-2.5 justify-between"
              >
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-slate-100 truncate">{item.product.name}</h5>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-slate-500 font-mono bg-slate-900 px-1 py-0.5 rounded">
                      SKU: {item.product.code}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.product.salePrice.toLocaleString()}₾
                    </span>
                  </div>
                </div>

                {/* Counter controls */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800">
                    <button
                      onClick={() => updateCartQuantity(item.product.id, -1)}
                      className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-xs font-black text-slate-100 w-6 text-center select-none">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.product.id, 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-md cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Dynamic Cart Options Summary Block */}
        {cart.length > 0 && (
          <form onSubmit={handleCheckout} className="border-t border-slate-850 bg-slate-950/90 p-3 space-y-3">
            {/* 1. Client Bind Selector */}
            <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide">კლიენტის მიბმა</span>
                <div className="flex gap-2">
                  <button
                    id="client-type-new-btn"
                    type="button"
                    onClick={() => setClientType('new')}
                    className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      clientType === 'new' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/40' : 'text-slate-500'
                    }`}
                  >
                    ახალი
                  </button>
                  <button
                    id="client-type-existing-btn"
                    type="button"
                    onClick={() => setClientType('existing')}
                    className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      clientType === 'existing' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/40' : 'text-slate-500'
                    }`}
                  >
                    არსებული სერვისიდან
                  </button>
                </div>
              </div>

              {clientType === 'existing' ? (
                <div className="space-y-1.5 mt-1.5">
                  <select
                    id="pos-existing-client"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none"
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    required
                  >
                    <option value="">-- აირჩიეთ კლიენტი დაფებიდან --</option>
                    {orders
                      .filter((o) => o.status !== 'completed' || o.paymentStatus === 'unpaid')
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.clientFullName} ({o.carBrand} -- {o.carNumber})
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <input
                    id="pos-new-client-name"
                    type="text"
                    placeholder="კლიენტის სახელი (არჩევითი)..."
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-[11px] text-slate-200 placeholder-slate-700"
                  />
                  <input
                    id="pos-new-client-phone"
                    type="text"
                    placeholder="ტელეფონი..."
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-[11px] text-slate-200 placeholder-slate-700"
                  />
                  <input
                    id="pos-new-client-car"
                    type="text"
                    placeholder="მანქანის მარკა..."
                    value={newCarBrand}
                    onChange={(e) => setNewCarBrand(e.target.value)}
                    className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-[11px] text-slate-200 placeholder-slate-700"
                  />
                  <input
                    id="pos-new-client-number"
                    type="text"
                    placeholder="სახელმწიფო ნომერი..."
                    value={newCarNumber}
                    onChange={(e) => setNewCarNumber(e.target.value)}
                    className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-[11px] text-slate-200 placeholder-slate-700"
                  />
                </div>
              )}
            </div>

            {/* 2. Discounts Input */}
            <div className="flex items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
              <div className="flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[9px] text-slate-400 font-black uppercase">ფასდაკლების დამატება</span>
              </div>
              <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setDiscountType('flat')}
                  className={`px-2 py-0.5 text-[10px] font-black rounded ${
                    discountType === 'flat' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  GEL
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('percent')}
                  className={`px-2 py-0.5 text-[10px] font-black rounded ${
                    discountType === 'percent' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  %
                </button>
                <input
                  id="pos-discount-input"
                  type="number"
                  min="0"
                  max={discountType === 'percent' ? 100 : cartSubtotal}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                  className="w-14 bg-transparent text-center text-xs font-mono font-bold text-amber-400 outline-none"
                />
              </div>
            </div>

            {/* 3. Payment Method & Status selector */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                <span className="text-[9px] text-slate-550 uppercase font-black block mb-1">გადახდის სტატუსი:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    id="pos-status-paid"
                    type="button"
                    onClick={() => setPaymentStatus('paid')}
                    className={`py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      paymentStatus === 'paid'
                        ? 'bg-emerald-500 text-white shadow font-extrabold'
                        : 'bg-slate-950 text-slate-500'
                    }`}
                  >
                    გადახდილია
                  </button>
                  <button
                    id="pos-status-unpaid"
                    type="button"
                    onClick={() => setPaymentStatus('unpaid')}
                    className={`py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      paymentStatus === 'unpaid'
                        ? 'bg-rose-500 text-white shadow font-extrabold'
                        : 'bg-slate-950 text-slate-500'
                    }`}
                  >
                    გადაუხდელი
                  </button>
                </div>
              </div>

              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                <span className="text-[9px] text-slate-505 uppercase font-black block mb-1">გადახდის ტიპი:</span>
                <select
                  id="pos-payment-method-select"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-[11px] text-slate-300 focus:outline-none"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                >
                  <option value="cash">💵 ნაღდი</option>
                  <option value="transfer">📇 გადარიცხვა</option>
                </select>
              </div>
            </div>

            {/* 5. Checkout final button */}
            <div className="pt-2.5 border-t border-slate-850 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">შესყიდვის ჯამი:</span>
                <span className="font-mono text-slate-400 font-semibold">{cartSubtotal.toLocaleString()} ₾</span>
              </div>
              {calculatedDiscount > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-500">ფასდაკლება ({discountType === 'percent' ? `${discountValue}%` : 'ბრტყელი'}):</span>
                  <span className="font-mono text-amber-500 font-bold">-{calculatedDiscount.toLocaleString()} ₾</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-slate-850 pt-1.5">
                <span className="text-sm font-black text-slate-100 font-sans uppercase">საბოლოო დასტური:</span>
                <span className="font-mono text-base font-black text-emerald-400">{cartTotal.toLocaleString()} ₾</span>
              </div>

              <button
                id="pos-finalize-sale-btn"
                type="submit"
                className="w-full py-2.5 mt-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black font-sans uppercase text-xs rounded-lg shadow-lg shadow-amber-500/10 cursor-pointer text-center"
              >
                შეკვეთის დაფიქსირება • {paymentStatus === 'paid' ? 'გადახდილია' : 'კრედიტი / დავალიანება'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* SUCCESS POPUP RECEIPT MODAL */}
      {successSale && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white text-slate-900 border border-slate-300 w-full max-w-sm rounded-xl p-5 shadow-2xl relative">
            {/* Header POS slip details */}
            <div className="text-center space-y-1">
              <Sparkles className="w-8 h-8 text-amber-400 mx-auto" aria-hidden="true" />
              <h3 className="text-sm font-black leading-none uppercase tracking-widest font-mono">ავტოსერვისი / მაღაზია</h3>
              <p className="text-[10px] text-slate-500 font-mono">მისამართი: თბილისი, საქართველო</p>
              <p className="text-[9px] text-slate-400 font-mono">ოპერატორი: {successSale.createdBy}</p>
            </div>

            {/* Dash border sep */}
            <div className="border-b border-dashed border-slate-300 my-4" />

            <div className="space-y-1 text-xs">
              <p className="font-mono text-[10px] text-slate-500">გადახდის რეპორტი #POS-{Date.now().toString().slice(-6)}</p>
              <p className="font-bold flex justify-between">
                <span>კლიენტი:</span> <span>{successSale.clientName}</span>
              </p>
              {successSale.clientPhone && (
                <p className="flex justify-between text-[11px] text-slate-600">
                  <span>ტელეფონი:</span> <span>{successSale.clientPhone}</span>
                </p>
              )}
              {successSale.carBrand && (
                <p className="flex justify-between text-[11px] text-slate-600">
                  <span>მანქანა:</span> <span>{successSale.carBrand} [{successSale.carNumber}]</span>
                </p>
              )}
            </div>

            <div className="border-b border-dashed border-slate-300 my-4" />

            {/* Cart products breakdown list table */}
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">პროდუქტების სია</span>
              {successSale.items.map((it: any, idx: number) => (
                <div key={idx} className="flex justify-between text-xs font-mono">
                  <div className="flex-1 pr-4">
                    <span className="block font-sans font-semibold leading-tight">{it.productName}</span>
                    <span className="text-[10px] text-slate-500">
                      {it.quantity} ცალი x {it.salePrice} ₾
                    </span>
                  </div>
                  <span className="font-bold shrink-0">{(it.quantity * it.salePrice).toLocaleString()} ₾</span>
                </div>
              ))}
            </div>

            <div className="border-b border-dashed border-slate-300 my-4" />

            {/* Calculations summaries */}
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span>ჯამური თანხა:</span> <span>{successSale.totalAmount.toLocaleString()} ₾</span>
              </div>
              {successSale.discount > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>ფასდაკლება:</span> <span>-{successSale.discount.toLocaleString()} ₾</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black border-t border-slate-200 pt-1.5">
                <span>საბოლოო ჯამი:</span> <span>{successSale.finalAmount.toLocaleString()} ₾</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>გადახდილია:</span> <span>{successSale.paymentStatus === 'paid' ? `${successSale.finalAmount.toLocaleString()} ₾` : '0 ₾ (დავალიანება)'}</span>
              </div>
              <div className="flex justify-between text-[11.5px] font-semibold text-slate-700">
                <span>ტიპი / მეთოდი:</span>
                <span className="uppercase">
                  {successSale.paymentMethod === 'mixed' ? 'შერეული' : successSale.paymentMethod}
                </span>
              </div>
            </div>

            <div className="border-t-2 border-slate-900 my-4 pt-1 text-center">
              <p className="text-[9.5px] font-bold font-sans">გმადლობთ შენაძენისთვის! • გისურვებთ მშვიდობიან მგზავრობას!</p>
            </div>

            {/* Actions overlay panel */}
            <div className="flex gap-2 mt-5 select-none print:hidden">
              <button
                onClick={handleReceiptPrint}
                className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black rounded-lg cursor-pointer text-center"
              >
                ბეჭდვა / POS
              </button>
              <button
                id="success-receipt-close"
                onClick={() => setSuccessSale(null)}
                className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-black rounded-lg cursor-pointer text-center"
              >
                დახურვა
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
