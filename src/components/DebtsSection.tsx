import React, { useState } from 'react';
import { ProductSale } from '../types';
import { Landmark, Phone, Car, CreditCard, Coins, Check, AlertCircle, Sparkles, ChevronRight, CheckCircle } from 'lucide-react';

interface DebtsSectionProps {
  productSales: ProductSale[];
  onMarkAsPaid: (saleId: string, method: 'cash' | 'card' | 'tbc' | 'bog' | 'transfer') => void;
  currentUser: any;
}

export default function DebtsSection({ productSales, onMarkAsPaid, currentUser }: DebtsSectionProps) {
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'tbc' | 'bog' | 'transfer'>('cash');

  // get all unpaid product sales
  const unpaidSales = productSales.filter((s) => s.paymentStatus === 'unpaid');

  const totalOutstandingDebtsValue = unpaidSales.reduce((sum, s) => sum + s.finalAmount, 0);

  const handleConfirmPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleId) return;

    onMarkAsPaid(selectedSaleId, payMethod);
    setSelectedSaleId(null);
  };

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Debt dashboard stats header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase">ჯამური კლიენტების დავალიანება</span>
            <p className="text-xl font-black font-mono text-rose-400">
              {totalOutstandingDebtsValue.toLocaleString()} ₾
            </p>
            <p className="text-[9.5px] text-slate-400 font-sans">ნივთები, რომლებიც გაიცა კრედიტით / ნისიად</p>
          </div>
          <div className="bg-rose-500/10 p-2.5 rounded-full border border-rose-500/20 text-rose-500">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase">აქტიური მოვალეები</span>
            <p className="text-xl font-black font-mono text-amber-500">
              {unpaidSales.length} პირი
            </p>
            <p className="text-[9.5px] text-slate-400 font-sans">დაუყოვნებლივ დასაკავშირებელი კლიენტები</p>
          </div>
          <div className="bg-amber-500/10 p-2.5 rounded-full border border-amber-500/20 text-amber-550">
            <Phone className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Debt List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="p-3 bg-slate-950/80 border-b border-slate-850 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-200">დავალიანებების სააღრიცხვო ჟურნალი</span>
          <span className="bg-slate-900 px-2 py-0.5 rounded text-[9.5px] text-slate-400 font-mono">აკუმულირებული სარდაფი</span>
        </div>

        <div className="overflow-x-auto">
          {unpaidSales.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <CheckCircle className="w-9 h-9 text-emerald-500 mx-auto" />
              <p className="text-slate-400 text-xs font-sans">ამჟამად მაღაზიას აქტიური მოვალეები არ ჰყავს!</p>
              <p className="text-slate-650 text-[10px]">ყველა კლიენტის ჩეკი და სათდარიგო ნაწილი სრულად ანაზღაურებულია</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 border-b border-slate-850 text-slate-500 font-bold text-[9.5px] uppercase">
                  <th className="p-3">კლიენტი / ტელეფონი</th>
                  <th className="p-3">ავტომობილი / ნომერი</th>
                  <th className="p-3">გაცემული პროდუქტები</th>
                  <th className="p-3 text-right">დავალიანება</th>
                  <th className="p-3 text-center">ოპერატორი</th>
                  <th className="p-3 text-right">ქმედება</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {unpaidSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-950/20 transition-colors">
                    <td className="p-3 font-semibold text-slate-200">
                      <div>{sale.clientName}</div>
                      {sale.clientPhone && (
                        <div className="text-[10px] text-slate-450 flex items-center gap-1 mt-0.5 font-mono">
                          <Phone className="w-3 h-3 text-slate-500" /> {sale.clientPhone}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      {sale.carBrand ? (
                        <div className="flex items-center gap-1 text-slate-350 font-sans">
                          <Car className="w-3.5 h-3.5 text-slate-500" />
                          <span>{sale.carBrand}</span>
                          <span className="font-mono text-[9px] bg-slate-950 px-1 py-0.5 rounded text-slate-400 border border-slate-850/60 ml-1">
                            {sale.carNumber || '---'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600">---</span>
                      )}
                    </td>
                    <td className="p-3 max-w-xs">
                      <div className="space-y-0.5">
                        {sale.items.map((it, idx) => (
                          <div key={idx} className="text-slate-400 text-[10px] truncate leading-tight">
                            • {it.productName} (x{it.quantity})
                          </div>
                        ))}
                      </div>
                      <span className="text-[8.5px] text-slate-500 font-mono mt-1 block">თარიღი: {sale.date}</span>
                    </td>
                    <td className="p-3 text-right font-black font-mono text-rose-400 text-[12px]">
                      {sale.finalAmount.toLocaleString()} ₾
                    </td>
                    <td className="p-3 text-center font-bold text-slate-400">
                      {sale.createdBy}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        id={`pay-debt-btn-${sale.id}`}
                        onClick={() => setSelectedSaleId(sale.id)}
                        className="py-1 px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-sans font-black tracking-wide rounded-md text-[10.5px] transition cursor-pointer"
                      >
                        დაფარვა / გადახდა
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CONFIRM PAY DIALOG MODAL */}
      {selectedSaleId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="pb-2 border-b border-slate-800">
              <h3 className="text-xs font-black uppercase text-slate-100 flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                დავალიანების მიღება / განაღდება
              </h3>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-1">
              <span className="text-[9px] text-slate-550 uppercase font-black">კლიენტის საკუთრება დავალიანებით</span>
              {(() => {
                const s = unpaidSales.find((item) => item.id === selectedSaleId);
                return s ? (
                  <>
                    <p className="text-xs font-bold text-slate-100">{s.clientName}</p>
                    <p className="text-[12px] font-mono text-emerald-405 font-black mt-1">
                      თანხა მისაღებია: {s.finalAmount.toLocaleString()} ₾
                    </p>
                  </>
                ) : null;
              })()}
            </div>

            <form onSubmit={handleConfirmPay} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-slate-400">აირჩიეთ ნავაჭრი შემოსვლის სალარო მეთოდი:</label>
                <select
                  id="debt-payment-method-select"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                >
                  <option value="cash">💵 სალარო ნაღდი ფული</option>
                  <option value="card">💳 საბანკო ტერმინალი</option>
                  <option value="tbc">🏦 ბანკი: TBC ბანკი</option>
                  <option value="bog">🏦 ბანკი: საქართველოს ბანკი (BOG)</option>
                  <option value="transfer">📇 ოფიციალური გადარიცხვა</option>
                </select>
              </div>

              <p className="text-[10px] text-slate-500 leading-snug">
                როდესაც თანხას დაადასტურებთ, მონაცემები გადაიწერება "Paid" სტატუსზე და აისახება <b>დღევანდელ ნადავლში</b> იმ მეთოდით რასაც ახლა აირჩევთ.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 font-sans select-none">
                <button
                  type="button"
                  onClick={() => setSelectedSaleId(null)}
                  className="px-3.5 py-1.5 bg-slate-950 border border-slate-850 text-slate-400 rounded hover:bg-slate-900 cursor-pointer"
                >
                  დახურვა
                </button>
                <button
                  id="confirm-debt-payment-btn"
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> გადახდის დადასტურება
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
