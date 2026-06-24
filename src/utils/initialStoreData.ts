import { Product, ProductSale, InventoryMovement, DailyClosing } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    code: 'P-101',
    name: 'ანთების სანთელი (NGK Spark Plug)',
    category: 'ანთების სისტემა',
    brand: 'NGK',
    description: 'ორიგინალი იაპონური ანთების სანთლები Toyota, Lexus, Honda თავსებადობისთვის',
    unit: 'ცალი',
    purchasePrice: 12,
    salePrice: 22,
    stock: 45,
    minStock: 10,
    photoUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
    status: 'active',
    soldQuantity: 18,
    createdAt: '2026-05-10T11:00:00Z'
  },
  {
    id: 'prod-2',
    code: 'P-102',
    name: 'ძრავის ზეთი (Mobil 1 5W-30 4L)',
    category: 'ზეთები / ფილტრები',
    brand: 'Mobil 1',
    description: 'სინთეტიკური ძრავის ზეთი 5W-30 უმაღლესი ხარისხის ძრავის დასაცავად',
    unit: 'კანისტრა',
    purchasePrice: 85,
    salePrice: 140,
    stock: 22,
    minStock: 5,
    photoUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=400&q=80',
    status: 'active',
    soldQuantity: 34,
    createdAt: '2026-05-10T12:00:00Z'
  },
  {
    id: 'prod-3',
    code: 'P-103',
    name: 'უკანა სამუხრუჭე ხუნდები (Brembo Pads)',
    category: 'სამუხრუჭე სისტემა',
    brand: 'Brembo',
    description: 'უკანა სამუხრუჭე ხუნდების ნაკრები მაღალი კოეფიციენტით',
    unit: 'წყვილი',
    purchasePrice: 65,
    salePrice: 110,
    stock: 4,
    minStock: 6,
    photoUrl: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=400&q=80',
    status: 'active',
    soldQuantity: 12,
    createdAt: '2026-05-11T14:30:00Z'
  },
  {
    id: 'prod-4',
    code: 'P-104',
    name: 'ანტიფრიზი G12+ კოცენტრატი (HEPU 1.5L)',
    category: 'გაგრილების სისტემა',
    brand: 'HEPU',
    description: 'გაგრილების სითხის კონცენტრატი, წითელი G12+, დამზადებულია გერმანიაში',
    unit: 'ცალი',
    purchasePrice: 15,
    salePrice: 28,
    stock: 35,
    minStock: 8,
    photoUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=400&q=80',
    status: 'active',
    soldQuantity: 7,
    createdAt: '2026-05-12T10:00:00Z'
  },
  {
    id: 'prod-5',
    code: 'P-105',
    name: 'ზეთის ფილტრი (MANN Filter 712)',
    category: 'ზეთები / ფილტრები',
    brand: 'MANN-FILTER',
    description: 'ორიგინალი MANN ზეთის ფილტრი გერმანული ხარისხით',
    unit: 'ცალი',
    purchasePrice: 11,
    salePrice: 20,
    stock: 3,
    minStock: 10,
    photoUrl: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=400&q=80',
    status: 'active',
    soldQuantity: 42,
    createdAt: '2026-05-12T10:15:00Z'
  }
];

export const INITIAL_PRODUCT_SALES: ProductSale[] = [
  {
    id: 'psale-1',
    clientName: 'ირაკლი გელაშვილი',
    clientPhone: '599123456',
    carBrand: 'Toyota Prius',
    carNumber: 'GE-777-ZZ',
    date: '2026-05-26',
    totalAmount: 40,
    discount: 5,
    finalAmount: 35,
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    items: [
      {
        productId: 'prod-1',
        productName: 'ანთების სანთელი (NGK Spark Plug)',
        quantity: 2,
        purchasePrice: 12,
        salePrice: 20
      }
    ],
    createdBy: 'ლაშა კალანდაძე',
    createdAt: '2026-05-26T14:45:00Z'
  },
  {
    id: 'psale-2',
    clientName: 'გიორგი მეტრეველი',
    clientPhone: '555203040',
    carBrand: 'BMW X5',
    carNumber: 'AA-100-BB',
    date: '2026-05-26',
    totalAmount: 250,
    discount: 10,
    finalAmount: 240,
    paymentStatus: 'unpaid',
    paymentMethod: 'mixed',
    mixedPaymentDetails: {
      cash: 0,
      card: 0,
      tbc: 0,
      bog: 0,
      transfer: 0
    }, // completely unpaid debt
    items: [
      {
        productId: 'prod-2',
        productName: 'ძრავის ზეთი (Mobil 1 5W-30 4L)',
        quantity: 1,
        purchasePrice: 85,
        salePrice: 140
      },
      {
        productId: 'prod-3',
        productName: 'უკანა სამუხრუჭე ხუნდები (Brembo Pads)',
        quantity: 1,
        purchasePrice: 65,
        salePrice: 110
      }
    ],
    createdBy: 'დავით აკობია',
    createdAt: '2026-05-26T16:15:00Z'
  },
  {
    id: 'psale-3',
    clientName: 'ოთარ რატიანი',
    clientPhone: '591998877',
    carBrand: 'Opel Astra',
    carNumber: 'OP-044-EL',
    date: '2026-05-27',
    totalAmount: 180,
    discount: 0,
    finalAmount: 180,
    paymentStatus: 'paid',
    paymentMethod: 'mixed',
    mixedPaymentDetails: {
      cash: 50,
      card: 0,
      tbc: 130,
      bog: 0,
      transfer: 0
    },
    items: [
      {
        productId: 'prod-2',
        productName: 'ძრავის ზეთი (Mobil 1 5W-30 4L)',
        quantity: 1,
        purchasePrice: 85,
        salePrice: 140
      },
      {
        productId: 'prod-5',
        productName: 'ზეთის ფილტრი (MANN Filter 712)',
        quantity: 2,
        purchasePrice: 11,
        salePrice: 20
      }
    ],
    createdBy: 'სალომე გეგეჭკორი',
    createdAt: '2026-05-27T10:30:00Z'
  }
];

export const INITIAL_INVENTORY_MOVEMENTS: InventoryMovement[] = [
  {
    id: 'm-1',
    productId: 'prod-1',
    productName: 'ანთების სანთელი (NGK Spark Plug)',
    type: 'refill',
    quantity: 50,
    purchasePrice: 12,
    date: '2026-05-10',
    note: 'პირველადი საწყისი მარაგის შეტანა',
    operatorName: 'დავით აკობია',
    createdAt: '2026-05-10T11:05:00Z'
  },
  {
    id: 'm-2',
    productId: 'prod-2',
    productName: 'ძრავის ზეთი (Mobil 1 5W-30 4L)',
    type: 'refill',
    quantity: 30,
    purchasePrice: 85,
    date: '2026-05-10',
    note: 'ზეთების მარაგის შევსება',
    operatorName: 'დავით აკობია',
    createdAt: '2026-05-10T12:05:00Z'
  },
  {
    id: 'm-3',
    productId: 'prod-1',
    productName: 'ანთების სანთელი (NGK Spark Plug)',
    type: 'sale',
    quantity: -2,
    purchasePrice: 12,
    date: '2026-05-26',
    note: 'გაყიდვა POS ჩეკით #psale-1',
    operatorName: 'ლაშა კალანდაძე',
    createdAt: '2026-05-26T14:45:00Z'
  }
];

export const INITIAL_DAILY_CLOSINGS: DailyClosing[] = [
  {
    id: 'close-1',
    date: '2026-05-25',
    startTime: '09:00',
    closingTime: '20:30',
    totalReceived: 620,
    totalOutstanding: 0,
    productSalesCount: 1,
    servicesCount: 3,
    productRevenue: 120,
    serviceRevenue: 500,
    productProfit: 50,
    totalCash: 320,
    totalCard: 300,
    totalTbc: 0,
    totalBog: 0,
    totalTransfer: 0,
    itemsSold: [
      { name: 'ძრავის ზეთი (Mobil 1 5W-30 4L)', quantity: 1, amount: 120 }
    ],
    servicesDone: [
      { description: 'ძრავის შეკეთება და დეკომპრესია', price: 300 },
      { description: 'ზეთის შეცვლა', price: 50 },
      { description: 'ელექტროობის გამართვა', price: 150 }
    ],
    closedBy: 'ლაშა კალანდაძე',
    note: 'ყველაფერი ემთხვევა, წარმატებული დღეა.',
    createdAt: '2026-05-25T20:45:00Z'
  }
];
