import { useMemo, useState } from 'react';
import { CarServiceOrder, ServiceItem, User } from '../types';
import { Printer, X, Building2, FileText } from 'lucide-react';

interface InvoiceModalProps {
  order: CarServiceOrder;
  services: ServiceItem[];
  issuedBy: User;
  onClose: () => void;
}

const money = (value: number) => `${value.toLocaleString('ka-GE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₾`;

/**
 * Printable invoice layout. Legal/company fields are intentionally shown even
 * when their values are not configured yet, so no required document section is
 * silently omitted from a customer-facing invoice.
 */
export default function InvoiceModal({ order, services, issuedBy, onClose }: InvoiceModalProps) {
  const [discount, setDiscount] = useState<number | ''>('');
  const [customerId, setCustomerId] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [dueDate, setDueDate] = useState(order.paymentStatus === 'paid' ? order.date : '');
  const [note, setNote] = useState('მომსახურება გაწეულია ავტომობილის ტექნიკური მდგომარეობის შესაბამისად.');
  const invoiceNumber = useMemo(() => `INV-${order.date.replaceAll('-', '')}-${order.id.replace(/[^0-9]/g, '').slice(-6).padStart(6, '0')}`, [order]);
  const subtotal = services.reduce((sum, service) => sum + service.price, 0);
  const discountValue = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const total = subtotal - discountValue;
  const paymentMethod = { cash: 'ნაღდი', card: 'ბარათი', tbc: 'TBC ბანკი', bog: 'Bank of Georgia', transfer: 'საბანკო გადარიცხვა' }[order.paymentMethod || 'cash'];

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto print:bg-white print:p-0">
      <section id="print-invoice" className="mx-auto my-4 max-w-3xl bg-white text-slate-950 rounded-2xl p-5 md:p-8 shadow-2xl print:my-0 print:max-w-none print:rounded-none print:shadow-none">
        <div className="print:hidden flex items-center justify-between mb-4">
          <p className="text-xs text-slate-500">შეავსეთ არჩევითი რეკვიზიტები ბეჭდვამდე — ისინი მხოლოდ ამ ინვოისში გამოჩნდება.</p>
          <button onClick={onClose} aria-label="ინვოისის დახურვა" className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>

        <header className="grid grid-cols-1 gap-5 border-b-2 border-slate-900 pb-5 md:grid-cols-2">
          <div><div className="flex items-center gap-2"><Building2 className="w-6 h-6" /><h1 className="font-black text-2xl tracking-wide">NEW AUTO MOTORS</h1></div><p className="mt-2 text-xs font-bold">მომსახურების ინვოისი / SERVICE INVOICE</p><div className="mt-3 space-y-0.5 text-[10px] text-slate-600"><p>იურიდიული დასახელება: <b>New Auto Motors</b></p><p>საიდენტიფიკაციო კოდი: <b>შესავსებია</b> · დღგ გადამხდელი: <b>შესავსებია</b></p><p>იურიდიული მისამართი: <b>შესავსებია</b></p><p>ტელეფონი / ელფოსტა / ბანკი / IBAN: <b>შესავსებია</b></p></div></div>
          <div className="md:text-right"><div className="inline-flex items-center gap-2 bg-slate-950 text-white px-3 py-2 rounded-lg"><FileText className="w-4 h-4" /><b className="font-mono text-sm">{invoiceNumber}</b></div><div className={`mt-2 inline-flex px-3 py-1 rounded-full text-xs font-black border ${order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'}`}>სტატუსი: {order.paymentStatus === 'paid' ? 'გადახდილია' : 'გადაუხდელია / გადასახდელია'}</div><div className="mt-3 space-y-0.5 text-xs"><p>გამოცემის თარიღი: <b>{new Date().toLocaleDateString('ka-GE')}</b></p><p>მომსახურების თარიღი: <b>{order.date}</b></p><p>შეკვეთის ნომერი: <b className="font-mono">{order.id}</b></p><p>გადახდის ვადა: <b>{dueDate || 'შესათანხმებელი'}</b></p></div></div>
        </header>

        <section className="grid grid-cols-1 gap-4 py-5 md:grid-cols-2">
          <div className="border border-slate-300 rounded-xl p-3"><h2 className="font-black text-xs uppercase border-b border-slate-200 pb-2">მომწოდებელი / გამყიდველი</h2><div className="pt-2 text-xs space-y-1"><p><span className="text-slate-500">ორგანიზაცია:</span> <b>New Auto Motors</b></p><p><span className="text-slate-500">პასუხისმგებელი პირი:</span> {issuedBy.firstName} {issuedBy.lastName}</p><p><span className="text-slate-500">ინვოისის შემდგენელი:</span> {issuedBy.username}</p></div></div>
          <div className="border border-slate-300 rounded-xl p-3"><h2 className="font-black text-xs uppercase border-b border-slate-200 pb-2">მყიდველი / კლიენტი</h2><div className="pt-2 text-xs space-y-1"><p><span className="text-slate-500">სახელი / კომპანია:</span> <b>{order.clientFullName}</b></p><p><span className="text-slate-500">ტელეფონი:</span> {order.clientPhone}</p><p className="print:hidden"><label className="text-slate-500">პირადი/საიდ. კოდი: </label><input value={customerId} onChange={e => setCustomerId(e.target.value)} className="border-b border-slate-300 outline-none w-40" /></p><p className="print:hidden"><label className="text-slate-500">მისამართი: </label><input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="border-b border-slate-300 outline-none w-48" /></p><p className="print:hidden"><label className="text-slate-500">ელფოსტა: </label><input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="border-b border-slate-300 outline-none w-48" /></p><p className="hidden print:block"><span className="text-slate-500">პირადი/საიდ. კოდი:</span> {customerId || '—'}</p><p className="hidden print:block"><span className="text-slate-500">მისამართი:</span> {customerAddress || '—'}</p><p className="hidden print:block"><span className="text-slate-500">ელფოსტა:</span> {customerEmail || '—'}</p></div></div>
        </section>

        <section className="border border-slate-300 rounded-xl overflow-hidden"><div className="bg-slate-100 px-3 py-2 text-xs font-black uppercase">ავტომობილის მონაცემები</div><div className="grid grid-cols-2 gap-3 p-3 text-xs md:grid-cols-4"><p><span className="block text-slate-500">მარკა / მოდელი</span><b>{order.carBrand}</b></p><p><span className="block text-slate-500">სახელმწიფო ნომერი</span><b className="font-mono">{order.carNumber}</b></p><p><span className="block text-slate-500">შეკვეთის სტატუსი</span><b>{order.status}</b></p><p><span className="block text-slate-500">პრობლემა</span><b>{order.problemDescription || '—'}</b></p></div></section>

        <section className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] border-collapse text-xs"><thead><tr className="bg-slate-950 text-white"><th className="p-2 text-left">#</th><th className="p-2 text-left">მომსახურება / აღწერა</th><th className="p-2 text-left">შემსრულებელი</th><th className="p-2 text-center">რაოდ.</th><th className="p-2 text-right">ერთეულის ფასი</th><th className="p-2 text-right">თანხა</th></tr></thead><tbody>{services.map((service, index) => <tr key={service.id} className="border-b border-slate-200"><td className="p-2">{index + 1}</td><td className="p-2"><b>{service.serviceType}</b><span className="block text-slate-600">{service.description}</span></td><td className="p-2">{service.mechanicId}</td><td className="p-2 text-center">1</td><td className="p-2 text-right font-mono">{money(service.price)}</td><td className="p-2 text-right font-mono font-bold">{money(service.price)}</td></tr>)}{services.length === 0 && <tr><td colSpan={6} className="p-5 text-center text-slate-500">მომსახურება არ არის დამატებული.</td></tr>}</tbody></table></section>

        <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_300px]"><div className="border border-slate-300 rounded-xl p-3 text-xs"><h2 className="font-black uppercase mb-2">გადახდის ინფორმაცია და პირობები</h2><p>სტატუსი: <b>{order.paymentStatus === 'paid' ? 'გადახდილია' : 'გადასახდელია'}</b></p><p className="mt-1">მეთოდი: <b>{paymentMethod}</b>{order.paidTo ? ` · მიღებული: ${order.paidTo}` : ''}</p><p className="mt-3 text-slate-600">მომსახურების მიღების შემდეგ კლიენტი ადასტურებს შესრულებული სამუშაოების მოცულობას. გარანტიისა და დამატებითი პირობების შესახებ ინფორმაცია შეთანხმდება სერვისის წესების შესაბამისად.</p><div className="mt-3 print:hidden"><label className="block text-slate-500 mb-1">შენიშვნა / სპეციალური პირობები</label><textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="w-full border border-slate-300 rounded p-2" /></div><p className="hidden print:block mt-3"><b>შენიშვნა:</b> {note || '—'}</p></div><div className="border-2 border-slate-900 rounded-xl p-4 text-xs space-y-2"><div className="flex justify-between"><span>შუალედური ჯამი</span><b className="font-mono">{money(subtotal)}</b></div><div className="flex justify-between items-center"><span>ფასდაკლება</span><span className="print:hidden"><input type="number" min="0" max={subtotal} value={discount} onChange={e => setDiscount(e.target.value === '' ? '' : Number(e.target.value))} className="w-20 border border-slate-300 text-right px-1" /> ₾</span><b className="hidden print:block font-mono">{money(discountValue)}</b></div><div className="flex justify-between"><span>დღგ</span><b>შესავსებია / N/A</b></div><div className="border-t-2 border-slate-900 pt-2 flex justify-between text-base"><b>სულ გადასახდელი</b><b className="font-mono">{money(total)}</b></div></div></section>

        <footer className="grid grid-cols-2 gap-8 mt-8 pt-4 border-t border-dashed border-slate-400 text-xs"><div><p className="mb-8">გამომწერის ხელმოწერა</p><div className="border-b border-slate-700" /></div><div><p className="mb-8">კლიენტის ხელმოწერა / მიღება</p><div className="border-b border-slate-700" /></div><p className="col-span-2 text-[10px] text-slate-500">დოკუმენტი გენერირებულია AutoGO სისტემით · {new Date().toLocaleString('ka-GE')}</p></footer>
        <div className="mt-5 flex gap-2 print:hidden"><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} aria-label="გადახდის ვადა" className="border border-slate-300 rounded-lg px-2 text-xs" /><button onClick={() => window.print()} className="flex-1 flex justify-center items-center gap-2 py-3 bg-slate-950 text-white rounded-xl text-xs font-black"><Printer className="w-4 h-4" /> ბეჭდვა / PDF</button></div>
      </section>
    </div>
  );
}
