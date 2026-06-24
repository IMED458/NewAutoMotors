import React, { useState } from 'react';
import { Product, Role } from '../types';
import { Plus, Edit3, Trash2, ArrowUpRight, TrendingUp, Sparkles, Image, RefreshCw, AlertTriangle, Eye, X, Check, Search, Filter } from 'lucide-react';

interface ProductsSectionProps {
  products: Product[];
  currentUser: { role: Role; firstName: string; lastName: string };
  onAddProduct: (prod: Omit<Product, 'id' | 'soldQuantity' | 'createdAt'>) => void;
  onEditProduct: (productId: string, prod: Partial<Product>) => void;
  onDeleteProduct: (productId: string) => void;
  onRefillStock: (productId: string, refillQty: number, refillPrice: number, refillNote: string) => void;
}

export default function ProductsSection({
  products,
  currentUser,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onRefillStock,
}: ProductsSectionProps) {
  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ყველა');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modal active states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Refill state
  const [refillTarget, setRefillTarget] = useState<Product | null>(null);
  const [refillQuantity, setRefillQuantity] = useState<number>(0);
  const [refillPrice, setRefillPrice] = useState<number>(0);
  const [refillNote, setRefillNote] = useState('მარაგის დაგეგმილი შევსება და საწყობის განახლება');

  // Photo full preview states
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [previewPhotoError, setPreviewPhotoError] = useState(false);

  // Form states for Add / Edit product
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('ზეთები / ფილტრები');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('ცალი');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(5);
  const [photoUrl, setPhotoUrl] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // Custom Category states
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  // Perms check: ONLY Super Admin can do absolute overrides, edit closed states, delete catalog items
  // Manager can add, edit, or fill. Cashier has POS only. Let's trace role
  const isPrivileged = ['super_admin', 'admin', 'manager'].includes(currentUser.role);
  const isSuper = currentUser.role === 'super_admin';

  // Categories list
  const categories = ['ყველა', ...Array.from(new Set(products.map((p) => p.category)))];

  // Filters logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCat === 'ყველა' || p.category === selectedCat;
    
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = p.stock > 0 && p.stock <= p.minStock;
    } else if (stockFilter === 'out') {
      matchesStock = p.stock === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleOpenAdd = () => {
    // clear fields
    setCode(`P-${100 + products.length + 1}`);
    setName('');
    setCategory('ზეთები / ფილტრები');
    setBrand('');
    setDescription('');
    setUnit('ცალი');
    setPurchasePrice(0);
    setSalePrice(0);
    setStock(10);
    setMinStock(5);
    setPhotoUrl('');
    setStatus('active');
    
    setIsCustomCategory(false);
    setCustomCategory('');
    setEditingProduct(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setCode(p.code);
    setName(p.name);
    setCategory(p.category);
    setBrand(p.brand);
    setDescription(p.description);
    setUnit(p.unit);
    setPurchasePrice(p.purchasePrice);
    setSalePrice(p.salePrice);
    setStock(p.stock);
    setMinStock(p.minStock);
    setPhotoUrl(p.photoUrl);
    setStatus(p.status);

    setIsCustomCategory(false);
    setCustomCategory('');
    setShowAddModal(true);
  };

  const handleSubmitProductForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      category: category.trim(),
      brand: brand.trim(),
      description: description.trim(),
      unit: unit.trim(),
      purchasePrice: Number(purchasePrice),
      salePrice: Number(salePrice),
      stock: Number(stock),
      minStock: Number(minStock),
      photoUrl: photoUrl.trim(),
      status,
    };

    if (editingProduct) {
      onEditProduct(editingProduct.id, payload);
    } else {
      onAddProduct(payload);
    }

    setShowAddModal(false);
    setEditingProduct(null);
  };

  const handleConfirmRefill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refillTarget || refillQuantity <= 0) return;
    onRefillStock(refillTarget.id, refillQuantity, refillTarget.purchasePrice, '');
    setRefillTarget(null);
    setRefillQuantity(0);
  };

  const handleOpenRefill = (p: Product) => {
    setRefillTarget(p);
    setRefillQuantity(1);
    setRefillPrice(p.purchasePrice);
  };

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Search & Statistics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl shadow">
        <div className="md:col-span-2 relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-500" />
          <input
            id="cat-product-search"
            type="text"
            placeholder="მოძებნე სახელით, ბრენდით, კოდით..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-9 pr-3 py-1.5 font-bold text-slate-100 placeholder-slate-600 focus:outline-none"
          />
        </div>

        <select
          id="cat-product-category-sel"
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="bg-slate-950 border border-slate-850 rounded-lg p-1 px-2.5 text-slate-300 font-bold focus:outline-none"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'ყველა' ? '📁 ყველა კატეგორია' : `📁 ${cat}`}
            </option>
          ))}
        </select>

        <div className="flex gap-1 bg-slate-950 p-1 border border-slate-850 rounded-lg select-none">
          <button
            onClick={() => setStockFilter('all')}
            className={`flex-1 text-[10px] font-bold py-1 px-1.5 rounded transition ${
              stockFilter === 'all' ? 'bg-amber-500/15 text-amber-400' : 'text-slate-500'
            }`}
          >
            ყველა
          </button>
          <button
            id="stock-filter-low"
            onClick={() => setStockFilter('low')}
            className={`flex-1 text-[10px] font-bold py-1 px-1.5 rounded transition ${
              stockFilter === 'low' ? 'bg-red-500/15 text-red-400' : 'text-slate-500'
            }`}
          >
            მცირე მარაგი
          </button>
          <button
            id="stock-filter-out"
            onClick={() => setStockFilter('out')}
            className={`flex-1 text-[10px] font-bold py-1 px-1.5 rounded transition ${
              stockFilter === 'out' ? 'bg-rose-500/20 text-rose-500' : 'text-slate-500'
            }`}
          >
            ნული
          </button>
        </div>
      </div>

      {/* Control command button block & summary metrics */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-4 text-slate-400 font-bold">
          <span>
            სულ: <b className="text-slate-200 font-black">{products.length}</b> პროდუქტი
          </span>
          <span>
            მცირე მარაგი:{' '}
            <b className="text-red-400 font-black">
              {products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length}
            </b>
          </span>
          <span>
            ამოწურული:{' '}
            <b className="text-rose-500 font-black">{products.filter((p) => p.stock === 0).length}</b>
          </span>
        </div>

        {isPrivileged && (
          <button
            id="add-new-product-btn"
            onClick={handleOpenAdd}
            className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black tracking-wide rounded-lg cursor-pointer flex items-center justify-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4 font-black" /> პროდუქტის დამატება
          </button>
        )}
      </div>

      {/* Grid displays */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {filteredProducts.map((p) => {
          const isOut = p.stock === 0;
          const isLow = p.stock > 0 && p.stock <= p.minStock;

          return (
            <div
              key={p.id}
              className={`bg-slate-900 border rounded-xl overflow-hidden flex flex-col justify-between transition-all ${
                isOut
                  ? 'border-red-500/20 shadow-red-500/5 shadow-md'
                  : isLow
                  ? 'border-amber-500/20 shadow-amber-500/5 shadow-md'
                  : 'border-slate-800/80 shadow'
              }`}
            >
              {/* Product Info Card */}
              <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-[12px] font-bold text-slate-100 uppercase tracking-wide leading-snug">{p.name}</h4>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[9.5px] text-slate-500 font-mono">კოდი: {p.code}</span>
                    {p.brand && (
                      <span className="text-[9.5px] text-slate-450 italic bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850">
                        {p.brand}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850/80 flex items-center justify-between select-none">
                  <span className="text-[10px] text-slate-400 font-sans font-medium">ნაშთი მარაგში:</span>
                  <span
                    className={`font-mono text-[13px] font-black flex items-center gap-1 ${
                      isOut ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-emerald-400'
                    }`}
                  >
                    {p.stock} {p.unit}
                    {isLow && (
                      <span className="text-[8px] bg-red-950/60 text-red-400 px-1.5 py-0.5 rounded border border-red-900/40">
                        {p.stock === 0 ? 'ცარიელია' : 'მცირე'}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Product buttons actions shelf */}
              {isPrivileged && (
                <div className="p-2.5 bg-slate-950/70 border-t border-slate-850 flex gap-2">
                  <button
                    id={`refill-stock-btn-${p.id}`}
                    onClick={() => handleOpenRefill(p)}
                    className="flex-1 py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-cyan-400 hover:text-cyan-300 font-extrabold rounded-lg text-[10px] cursor-pointer flex items-center justify-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    მარაგის შევსება
                  </button>

                  <button
                    id={`edit-product-btn-${p.id}`}
                    onClick={() => handleOpenEdit(p)}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-amber-500 hover:text-amber-400 rounded-lg cursor-pointer flex items-center justify-center"
                    title="დეტალები / რედაქტირება"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    id={`delete-product-btn-${p.id}`}
                    onClick={() => {
                      if (confirm('ნამდვილად გსურთ პროდუქტის წაშლა კატალოგიდან? (მონაცემები მაინც დარჩება არქივებში)')) {
                        onDeleteProduct(p.id);
                      }
                    }}
                    className="px-2.5 py-1.5 bg-red-950/20 hover:bg-red-950/50 border border-red-500/10 hover:border-red-500/45 text-red-500 rounded-lg cursor-pointer flex items-center justify-center"
                    title="პროდუქტის წაშლა"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL: Add / Edit Product */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
              <h3 className="text-sm font-black text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" />
                {editingProduct ? 'პროდუქტის მოდიფიკაცია' : 'ახალი პროდუქტის დამატება'}
              </h3>
              <button
                id="close-prod-form-modal"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitProductForm} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">პროდუქტის კოდი / SKU</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 text-slate-100 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">სახელწოდება</label>
                  <input
                    type="text"
                    required
                    placeholder="მაგ. ძრავის ზეთი 5W-40"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-400">კატეგორია</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(!isCustomCategory);
                        setCategory('ზეთები / ფილტრები');
                      }}
                      className="text-[9px] text-amber-400 hover:underline cursor-pointer"
                    >
                      {isCustomCategory ? 'არსებულიდან არჩევა' : '+ ახალი კატეგორია'}
                    </button>
                  </div>
                  {isCustomCategory ? (
                    <input
                      type="text"
                      required
                      placeholder="ჩაწერეთ ახალი კატეგორია"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 text-slate-100"
                    />
                  ) : (
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      {Array.from(new Set([
                        'ანთების სისტემა',
                        'ზეთები / ფილტრები',
                        'სამუხრუჭე სისტემა',
                        'გაგრილების სისტემა',
                        'შასი / სავალი ნაწილი',
                        'აქსესუარები / ქიმია',
                        'სხვა სხვადასხვა',
                        ...products.map(p => p.category)
                      ])).map((catVal) => (
                        <option key={catVal} value={catVal}>{catVal}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">ბრენდი</label>
                  <input
                    type="text"
                    placeholder="მაგ. Mobil, Brembo, NGK"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">გასაზომი ერთეული</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 focus:outline-none text-slate-100 text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">მინიმალური მარაგი</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 focus:outline-none text-slate-100 text-center font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">საწყისი მარაგი</label>
                  <input
                    type="number"
                    required
                    min="0"
                    disabled={!!editingProduct && !isSuper} // only superAdmin can directly overwrite database stock totals
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 focus:outline-none text-slate-100 text-center font-mono font-bold disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">შესასყიდი ფასი (₾)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 focus:outline-none text-slate-100 font-mono font-bold text-red-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">გასაყიდი ფასი (₾)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 focus:outline-none text-slate-100 font-mono font-bold text-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">აღწერა</label>
                <textarea
                  placeholder="ჩაწერეთ მოდელების თავსებადობა, დეტალები..."
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded p-2.5 focus:outline-none text-slate-200 text-[11px]"
                />
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-slate-400">პროდუქტის ფოტოს ლინკი (URL)</label>
                <input
                  type="text"
                  placeholder="ჩაწერეთ ფოტოს Google Drive, Unsplash, ან Image URL..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 focus:outline-none text-slate-350 font-mono text-[10px]"
                />
                <p className="text-[9px] text-slate-500">მომხმარებელი თვითონ უთითებს ფოტოს ლინკს. სისტემა აჩვენებს Preview-ს უსაფრთხოდ.</p>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500">სტატუსი:</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setStatus('active')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-950 text-slate-500'
                      }`}
                    >
                      აქტიური
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('inactive')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        status === 'inactive' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-slate-950 text-slate-500'
                      }`}
                    >
                      არააქტიური
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 select-none">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3.5 py-1.5 bg-slate-950 text-slate-400 border border-slate-850 rounded hover:bg-slate-900 cursor-pointer"
                  >
                    გაუქმება
                  </button>
                  <button
                    id="save-product-details-btn"
                    type="submit"
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded cursor-pointer"
                  >
                    შენახვა / დადასტურება
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Stock Refill */}
      {refillTarget && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-xs font-black text-slate-100 flex items-center gap-1 uppercase tracking-wider">
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                მარაგის შევსების ორდერი
              </h3>
              <button
                onClick={() => setRefillTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 flex items-center gap-2.5">
              {refillTarget.photoUrl && (
                <img
                  src={refillTarget.photoUrl}
                  alt="refill"
                  className="w-10 h-10 object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                />
              )}
              <div>
                <span className="text-[9px] text-slate-500 font-mono">SKU: {refillTarget.code}</span>
                <h4 className="text-[11.5px] font-bold text-slate-100 leading-tight">{refillTarget.name}</h4>
                <p className="text-[9.5px] text-slate-400 mt-0.5">
                  არსებული მარაგი: <b className="text-amber-500 font-mono">{refillTarget.stock} {refillTarget.unit}</b>
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmRefill} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                  დასამატებელი რაოდენობა ({refillTarget.unit})
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={refillQuantity}
                  onChange={(e) => setRefillQuantity(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 focus:outline-none focus:border-cyan-500/60 text-slate-100 text-center font-mono font-black text-2xl text-cyan-400"
                  autoFocus
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 flex justify-between items-center">
                <span>მარაგი შევსების შემდეგ:</span>
                <span className="font-mono font-black text-amber-400">
                  {refillTarget.stock} + {refillQuantity} = <span className="text-cyan-400">{refillTarget.stock + refillQuantity}</span> {refillTarget.unit}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRefillTarget(null)}
                  className="py-2.5 bg-slate-950 border border-slate-800 text-slate-400 rounded-xl font-semibold cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  გაუქმება
                </button>
                <button
                  id="submit-refill-qty-btn"
                  type="submit"
                  className="py-2.5 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black rounded-xl cursor-pointer active:scale-[0.98] transition-all"
                >
                  მარაგის შევსება
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHOTO PREVIEW POPUP */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-4 shadow-2xl space-y-3 relative">
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-2 right-2 p-1.5 bg-slate-950/85 hover:bg-slate-950 text-slate-400 hover:text-white rounded-full cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-center font-mono text-[9.5px] select-text">
              <span className="text-slate-500">ფოტოს პირდაპირი URL:</span>
              <p className="text-slate-300 truncate mt-1">{previewPhotoUrl}</p>
            </div>

            {/* Photo preview wrap with error detector */}
            <div className="h-72 w-full bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center relative border border-slate-800">
              {previewPhotoError ? (
                <div className="text-center space-y-1.5">
                  <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
                  <p className="text-slate-400 font-sans text-[11px]">ლინკი არასწორია ან სურათი მიუწვდომელია</p>
                  <p className="text-slate-600 font-mono text-[9px] max-w-[250px] mx-auto">გთხოვთ მიუთითოთ პირდაპირი image URL, Google Drive საჯარო ლინკი ან Unsplash URL</p>
                </div>
              ) : (
                <img
                  src={previewPhotoUrl}
                  alt="preview"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={() => setPreviewPhotoError(true)}
                />
              )}
            </div>

            <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-850">
              <p className="text-[10px] text-slate-400 font-sans">ფოტოზე დაჭერისას წარმოდგენილია სრული რეალური ზომა.</p>
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="px-3.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded cursor-pointer leading-tight text-[10px]"
              >
                გავიგე
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
