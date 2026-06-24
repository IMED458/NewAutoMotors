import { useMemo, useState } from 'react';
import { CarServiceOrder, ServiceItem, User } from '../types';
import { Printer, X } from 'lucide-react';

interface InvoiceModalProps {
  order: CarServiceOrder;
  services: ServiceItem[];
  issuedBy: User;
  onClose: () => void;
}

const money = (value: number) => `${value.toLocaleString('ka-GE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₾`;

/** Compact, print-first A4 invoice. Service-provider legal details will be configured separately. */
export default function InvoiceModal({ order, services, issuedBy, onClose }: InvoiceModalProps) {
  const [discount, setDiscount] = useState<number | ''>('');
  const invoiceNumber = useMemo(() => `INV-${order.date.replaceAll('-', '')}-${order.id.replace(/[^0-9]/g, '').slice(-6).padStart(6, '0')}`, [order]);
  const subtotal = services.reduce((sum, service) => sum + service.price, 0);
  const discountValue = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const total = subtotal - discountValue;
  const paymentMethod = { cash: 'ნაღდი', card: 'ბარათი', tbc: 'TBC', bog: 'BOG', transfer: 'გადარიცხვა' }[order.paymentMethod || 'cash'];
  const isPaid = order.paymentStatus === 'paid';

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto print:bg-white print:p-0">
      <section id="print-invoice" className="invoice-sheet mx-auto my-4 max-w-3xl bg-white text-slate-950 rounded-xl p-5 md:p-8 shadow-2xl print:my-0 print:max-w-none print:rounded-none print:shadow-none">
        <div className="print:hidden flex items-center justify-end mb-3"><button onClick={onClose} aria-label="ინვოისის დახურვა" className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"><X className="w-4 h-4" /></button></div>

        <header className="invoice-header flex items-start justify-between gap-6 border-b-2 border-slate-900 pb-4">
          <div><h1 className="text-3xl font-black tracking-tight uppercase">ინვოისი</h1><p className="mt-1 text-xs text-slate-600">New Auto Motors</p></div>
          <div className="text-right"><p className="text-[10px] uppercase tracking-widest text-slate-500">ინვოისის ნომერი</p><p className="font-mono text-xl font-black">{invoiceNumber}</p><p className="mt-1 text-xs">თარიღი: <b>{order.date}</b></p></div>
        </header>

        <section className="grid grid-cols-2 gap-5 py-4 text-xs">
          <div className="invoice-card border-l-2 border-slate-900 pl-3"><h2 className="font-black uppercase text-[11px] mb-2">გამყიდველი</h2><p className="font-bold">New Auto Motors</p><p className="text-slate-600 mt-1">იურიდიული/საკონტაქტო მონაცემები დაემატება პარამეტრებიდან.</p></div>
          <div className="invoice-card border-l-2 border-slate-900 pl-3"><h2 className="font-black uppercase text-[11px] mb-2">კლიენტი</h2><p className="font-bold">{order.clientFullName}</p><p className="text-slate-600 mt-1">ტელეფონი: {order.clientPhone}</p></div>
        </section>

        <section className="invoice-vehicle grid grid-cols-3 gap-3 border-y border-slate-300 py-3 text-xs"><p><span className="block text-slate-500">ავტომობილი</span><b>{order.carBrand}</b></p><p><span className="block text-slate-500">სახელმწიფო ნომერი</span><b className="font-mono">{order.carNumber}</b></p><p><span className="block text-slate-500">შეკვეთის ნომერი</span><b className="font-mono">{order.id}</b></p></section>

        <section className="invoice-services mt-4"><table className="w-full border-collapse text-xs"><thead><tr className="border-y-2 border-slate-900"><th className="py-2 text-left w-8">#</th><th className="py-2 text-left">მომსახურება</th><th className="py-2 text-center w-16">რაოდ.</th><th className="py-2 text-right w-28">ფასი</th><th className="py-2 text-right w-28">ჯამი</th></tr></thead><tbody>{services.map((service, index) => <tr key={service.id} className="border-b border-slate-200"><td className="py-2">{index + 1}</td><td className="py-2"><b>{service.serviceType}</b><span className="block text-slate-600">{service.description}</span></td><td className="py-2 text-center">1</td><td className="py-2 text-right font-mono">{money(service.price)}</td><td className="py-2 text-right font-mono font-bold">{money(service.price)}</td></tr>)}{services.length === 0 && <tr><td colSpan={5} className="py-5 text-center text-slate-500">მომსახურება არ არის დამატებული.</td></tr>}</tbody></table></section>

        <section className="mt-5 flex justify-between gap-8 items-start text-xs"><div><p className="text-slate-500">გადახდის მეთოდი</p><b>{paymentMethod}</b>{order.paidTo && <p className="mt-1 text-slate-600">მიღებული: {order.paidTo}</p>}<p className="mt-5 text-slate-500">მომსახურების გამწევის მონაცემები დაემატება შემდგომ.</p></div><div className="invoice-total min-w-56 border-t-2 border-slate-900 pt-2 space-y-1.5"><div className="flex justify-between"><span>შუალედური ჯამი</span><b className="font-mono">{money(subtotal)}</b></div><div className="flex justify-between items-center"><span>ფასდაკლება</span><span className="print:hidden"><input type="number" min="0" max={subtotal} value={discount} onChange={e => setDiscount(e.target.value === '' ? '' : Number(e.target.value))} className="w-20 border border-slate-300 text-right px-1 py-0.5" /> ₾</span><b className="hidden print:block font-mono">{money(discountValue)}</b></div><div className="border-t border-slate-300 pt-2 flex justify-between text-base"><b>სულ გადასახდელი</b><b className="font-mono">{money(total)}</b></div></div></section>

        <section className={`invoice-payment-status mt-5 border-2 px-4 py-3 text-center font-black text-sm ${isPaid ? 'border-slate-900' : 'border-slate-500'}`}>სტატუსი: {isPaid ? 'გადახდილია' : 'გადაუხდელია'}</section>
        <footer className="mt-7 pt-3 border-t border-slate-300 flex justify-between text-[10px] text-slate-500"><span>ინვოისი მომზადებულია: {issuedBy.firstName} {issuedBy.lastName}</span><span>AutoGO / New Auto Motors</span></footer>
        <button onClick={() => window.print()} className="print:hidden mt-5 w-full flex justify-center items-center gap-2 py-3 bg-slate-950 text-white rounded-xl text-xs font-black"><Printer className="w-4 h-4" /> ბეჭდვა / PDF</button>
      </section>
    </div>
  );
}
