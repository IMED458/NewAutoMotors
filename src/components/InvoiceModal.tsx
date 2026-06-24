import { CarServiceOrder, ServiceItem, User } from '../types';
import { Printer, X } from 'lucide-react';

interface InvoiceModalProps {
  order: CarServiceOrder;
  services: ServiceItem[];
  issuedBy: User;
  onClose: () => void;
}

/** A deliberately compact receipt that prints cleanly on A4 and receipt printers. */
export default function InvoiceModal({ order, services, issuedBy, onClose }: InvoiceModalProps) {
  const total = services.reduce((sum, service) => sum + service.price, 0);
  const paymentMethod = {
    cash: 'ნაღდი', card: 'ბარათი', tbc: 'TBC', bog: 'BOG', transfer: 'გადარიცხვა',
  }[order.paymentMethod || 'cash'];

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto print:bg-white print:p-0">
      <section id="print-invoice" className="mx-auto my-4 max-w-md bg-white text-slate-950 rounded-2xl p-6 shadow-2xl print:my-0 print:max-w-none print:rounded-none print:shadow-none">
        <div className="print:hidden flex justify-end mb-3">
          <button onClick={onClose} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <header className="text-center border-b-2 border-slate-900 pb-4">
          <h1 className="font-black text-xl tracking-wide">AUTOMOTORS</h1>
          <p className="text-xs font-bold mt-1">მომსახურების ინვოისი</p>
          <p className="text-[10px] text-slate-500 mt-1">#{order.id} · {order.date}</p>
        </header>
        <div className="grid grid-cols-2 gap-3 py-4 text-xs border-b border-slate-200">
          <div><span className="text-slate-500 block">კლიენტი</span><b>{order.clientFullName}</b><span className="block mt-0.5">{order.clientPhone}</span></div>
          <div className="text-right"><span className="text-slate-500 block">ავტომობილი</span><b>{order.carBrand}</b><span className="block mt-0.5 font-mono">{order.carNumber}</span></div>
        </div>
        <div className="py-3 space-y-2 text-xs">
          {services.map((service, index) => (
            <div key={service.id} className="flex gap-2 justify-between">
              <span className="min-w-0"><b>{index + 1}.</b> {service.description}</span>
              <b className="whitespace-nowrap font-mono">{service.price.toFixed(2)} ₾</b>
            </div>
          ))}
          {services.length === 0 && <p className="text-slate-500">მომსახურება არ არის დამატებული.</p>}
        </div>
        <div className="border-t-2 border-slate-900 pt-3 space-y-1 text-xs">
          <div className="flex justify-between"><span>გადახდის სტატუსი</span><b>{order.paymentStatus === 'paid' ? 'გადახდილია' : 'გადაუხდელია'}</b></div>
          <div className="flex justify-between"><span>მეთოდი</span><b>{paymentMethod}</b></div>
          <div className="flex justify-between text-base mt-2"><b>სულ გადასახდელი</b><b className="font-mono">{total.toFixed(2)} ₾</b></div>
        </div>
        <footer className="border-t border-dashed border-slate-300 mt-5 pt-3 text-[10px] text-slate-500 flex justify-between">
          <span>გენერირებული: {issuedBy.firstName} {issuedBy.lastName}</span><span>{new Date().toLocaleString('ka-GE')}</span>
        </footer>
        <button onClick={() => window.print()} className="print:hidden mt-5 w-full flex justify-center items-center gap-2 py-3 bg-slate-950 text-white rounded-xl text-xs font-black"><Printer className="w-4 h-4" /> ბეჭდვა / PDF</button>
      </section>
    </div>
  );
}
