// Seed script for BuildStock ERP
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting BuildStock ERP Seeding ---');

  // 1. Company Profile
  const company = await prisma.company.upsert({
    where: { id: 'default-company' },
    update: {},
    create: {
      id: 'default-company',
      name: 'BuildStock ERP',
      legalName: 'Shivom Construction & Hardware Supplies Pvt Ltd',
      gstin: '27AABCS1429B1Z8',
      pan: 'AABCS1429B',
      email: 'sales@buildstockerp.com',
      phone: '+91 98200 12345',
      altPhone: '+91 98200 67890',
      address: 'Plot No. 42, Industrial Area, Ring Road Phase 2',
      city: 'Pune',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '411028',
      bankName: 'HDFC Bank',
      bankAccountNo: '50200012345678',
      bankIfsc: 'HDFC0001234',
      bankBranch: 'Industrial Estate Branch',
      upiId: 'shivomhardware@hdfcbank',
      invoicePrefix: 'INV-26/',
      quotationPrefix: 'QTN-26/',
      purchasePrefix: 'PO-26/',
      paymentPrefix: 'REC-26/',
      invoiceTerms: `1. Goods once sold will not be accepted back after 7 days.
2. Interest @ 18% p.a. will be levied on overdue payments.
3. Quality disputes must be reported within 24 hours of delivery.
4. Subject to Pune jurisdiction only.`,
    },
  });
  console.log('✓ Company profile initialized:', company.legalName);

  // 2. Settings
  const defaultSettings = [
    { key: 'allow_negative_stock', value: 'false', category: 'INVENTORY', description: 'Allow billing when stock is zero' },
    { key: 'default_gst_rate', value: '18', category: 'TAX', description: 'Standard GST rate percentage' },
    { key: 'currency_symbol', value: '₹', category: 'GENERAL', description: 'Currency symbol' },
    { key: 'invoice_due_days', value: '15', category: 'SALES', description: 'Default invoice payment due days' },
    { key: 'enable_sms_alerts', value: 'false', category: 'NOTIFICATION', description: 'Send SMS on invoice generation' },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log('✓ System settings initialized');

  // 3. Default Users
  const passwordHash = await bcrypt.hash('admin123', 10);
  const billingHash = await bcrypt.hash('billing123', 10);
  const storeHash = await bcrypt.hash('store123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@buildstock.com' },
    update: {},
    create: {
      name: 'Owner Admin',
      email: 'admin@buildstock.com',
      passwordHash,
      role: 'ADMIN',
      phone: '9820011111',
    },
  });

  const billingUser = await prisma.user.upsert({
    where: { email: 'billing@buildstock.com' },
    update: {},
    create: {
      name: 'Billing Desk',
      email: 'billing@buildstock.com',
      passwordHash: billingHash,
      role: 'BILLING',
      phone: '9820022222',
    },
  });

  const storeUser = await prisma.user.upsert({
    where: { email: 'store@buildstock.com' },
    update: {},
    create: {
      name: 'Store Manager',
      email: 'store@buildstock.com',
      passwordHash: storeHash,
      role: 'STORE',
      phone: '9820033333',
    },
  });
  console.log('✓ Default users seeded: Admin, Billing, Store');

  // 4. Units
  const unitsData = [
    { name: 'Pieces', code: 'PCS', isDefault: true },
    { name: 'Bags', code: 'BAG', isDefault: false },
    { name: 'Kilograms', code: 'KG', isDefault: false },
    { name: 'Metric Ton', code: 'TON', isDefault: false },
    { name: 'Meters', code: 'METER', isDefault: false },
    { name: 'Feet', code: 'FEET', isDefault: false },
    { name: 'Boxes', code: 'BOX', isDefault: false },
    { name: 'Litres', code: 'LITRE', isDefault: false },
    { name: 'Sets', code: 'SET', isDefault: false },
    { name: 'Dozens', code: 'DOZEN', isDefault: false },
  ];

  const unitsMap = {};
  for (const u of unitsData) {
    const unit = await prisma.unit.upsert({
      where: { code: u.code },
      update: {},
      create: u,
    });
    unitsMap[u.code] = unit.id;
  }
  console.log('✓ Units seeded');

  // 5. Categories
  const categoriesData = [
    { name: 'Cement & Aggregates', description: 'PPC, OPC Cement, White Cement & Sand' },
    { name: 'Steel & TMT Rebars', description: 'TMT Bars, Binding Wire, Structural Steel' },
    { name: 'Plumbing & Pipes', description: 'CPVC, UPVC, PVC Pipes and Fittings' },
    { name: 'Electrical & Lighting', description: 'Wires, Switches, Conduit, MCB' },
    { name: 'Paints & Chemicals', description: 'Emulsions, Primers, Waterproofing' },
    { name: 'Hardware & Fasteners', description: 'Screws, Nails, Bolts, Hinges, Door locks' },
    { name: 'Power Tools & Safety', description: 'Drills, Cutters, Safety Helmets, Gloves' },
  ];

  const categoriesMap = {};
  for (const c of categoriesData) {
    const cat = await prisma.category.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
    categoriesMap[c.name] = cat.id;
  }
  console.log('✓ Categories seeded');

  // 6. Brands
  const brandsData = [
    { name: 'UltraTech Cement' },
    { name: 'Tata Tiscon' },
    { name: 'Astral Pipes' },
    { name: 'Asian Paints' },
    { name: 'Finolex Cables' },
    { name: 'Godrej Locks' },
    { name: 'Bosch Power Tools' },
    { name: 'Dr. Fixit' },
  ];

  const brandsMap = {};
  for (const b of brandsData) {
    const brand = await prisma.brand.upsert({
      where: { name: b.name },
      update: {},
      create: b,
    });
    brandsMap[b.name] = brand.id;
  }
  console.log('✓ Brands seeded');

  // 7. Godown / Warehouses
  const mainGodown = await prisma.warehouse.upsert({
    where: { code: 'MAIN-01' },
    update: {},
    create: {
      name: 'Central Godown (Ring Road)',
      code: 'MAIN-01',
      address: 'Plot 42, Ring Road Industrial Area',
      isDefault: true,
    },
  });

  const siteGodown = await prisma.warehouse.upsert({
    where: { code: 'DEPOT-02' },
    update: {},
    create: {
      name: 'City Depot & Retail Yard',
      code: 'DEPOT-02',
      address: 'Shop 12-14, City Hardware Market',
      isDefault: false,
    },
  });
  console.log('✓ Warehouses seeded');

  // 8. Products
  const productsData = [
    {
      name: 'UltraTech Super Cement 50kg',
      sku: 'CEM-UT-50',
      barcode: '890100010001',
      description: 'UltraTech Super Weather Plus PPC Cement 50kg bag',
      hsnCode: '2523',
      purchasePrice: 340,
      salePrice: 390,
      minSalePrice: 375,
      gstRate: 28,
      minStockLevel: 100,
      openingStock: 500,
      currentStock: 500,
      categoryId: categoriesMap['Cement & Aggregates'],
      brandId: brandsMap['UltraTech Cement'],
      unitId: unitsMap['BAG'],
    },
    {
      name: 'Tata Tiscon 550D TMT Bar 12mm',
      sku: 'STEEL-TT-12MM',
      barcode: '890100020002',
      description: 'High strength 12mm Fe-550D primary steel rebar',
      hsnCode: '7214',
      purchasePrice: 62,
      salePrice: 72,
      minSalePrice: 69,
      gstRate: 18,
      minStockLevel: 500,
      openingStock: 2500,
      currentStock: 2500,
      categoryId: categoriesMap['Steel & TMT Rebars'],
      brandId: brandsMap['Tata Tiscon'],
      unitId: unitsMap['KG'],
    },
    {
      name: 'Tata Tiscon 550D TMT Bar 16mm',
      sku: 'STEEL-TT-16MM',
      barcode: '890100020003',
      description: 'Fe-550D TMT rebar 16mm standard lengths',
      hsnCode: '7214',
      purchasePrice: 61,
      salePrice: 71,
      minSalePrice: 68,
      gstRate: 18,
      minStockLevel: 400,
      openingStock: 1800,
      currentStock: 1800,
      categoryId: categoriesMap['Steel & TMT Rebars'],
      brandId: brandsMap['Tata Tiscon'],
      unitId: unitsMap['KG'],
    },
    {
      name: 'Astral CPVC Pro Pipe 1" (3 Meter)',
      sku: 'PIPE-AST-1IN-3M',
      barcode: '890100030001',
      description: 'Astral CPVC Pro SDR 11 hot & cold water pipe 1 inch',
      hsnCode: '3917',
      purchasePrice: 280,
      salePrice: 360,
      minSalePrice: 330,
      gstRate: 18,
      minStockLevel: 50,
      openingStock: 140,
      currentStock: 140,
      categoryId: categoriesMap['Plumbing & Pipes'],
      brandId: brandsMap['Astral Pipes'],
      unitId: unitsMap['PCS'],
    },
    {
      name: 'Asian Paints Apex Ultima White 20L',
      sku: 'PNT-AP-ULT-20L',
      barcode: '890100040001',
      description: 'Exterior weather-proof emulsion 20 Litre bucket',
      hsnCode: '3209',
      purchasePrice: 4200,
      salePrice: 5100,
      minSalePrice: 4800,
      gstRate: 28,
      minStockLevel: 10,
      openingStock: 25,
      currentStock: 25,
      categoryId: categoriesMap['Paints & Chemicals'],
      brandId: brandsMap['Asian Paints'],
      unitId: unitsMap['LITRE'],
    },
    {
      name: 'Dr. Fixit Pidiproof LW+ 5L',
      sku: 'CHEM-FIX-LW-5L',
      barcode: '890100040002',
      description: 'Integral liquid waterproofing compound for concrete and mortar',
      hsnCode: '3824',
      purchasePrice: 520,
      salePrice: 680,
      minSalePrice: 630,
      gstRate: 18,
      minStockLevel: 15,
      openingStock: 45,
      currentStock: 45,
      categoryId: categoriesMap['Paints & Chemicals'],
      brandId: brandsMap['Dr. Fixit'],
      unitId: unitsMap['LITRE'],
    },
    {
      name: 'Finolex 2.5 sq mm FR Wire (90m Red)',
      sku: 'ELEC-FIN-2.5-RD',
      barcode: '890100050001',
      description: 'Flame retardant PVC insulated copper building wire 90m roll',
      hsnCode: '8544',
      purchasePrice: 2150,
      salePrice: 2650,
      minSalePrice: 2450,
      gstRate: 18,
      minStockLevel: 20,
      openingStock: 60,
      currentStock: 60,
      categoryId: categoriesMap['Electrical & Lighting'],
      brandId: brandsMap['Finolex Cables'],
      unitId: unitsMap['BOX'],
    },
    {
      name: 'Godrej Navtal 7 Levers Brass Padlock',
      sku: 'HRD-GOD-NAV7',
      barcode: '890100060001',
      description: 'High security brass padlock with 3 brass keys',
      hsnCode: '8301',
      purchasePrice: 410,
      salePrice: 550,
      minSalePrice: 500,
      gstRate: 18,
      minStockLevel: 25,
      openingStock: 75,
      currentStock: 75,
      categoryId: categoriesMap['Hardware & Fasteners'],
      brandId: brandsMap['Godrej Locks'],
      unitId: unitsMap['PCS'],
    },
    {
      name: 'MS Binding Wire 18 Gauge',
      sku: 'HRD-BIND-WIRE-18G',
      barcode: '890100070001',
      description: 'Annealed mild steel wire for rebar tying and construction',
      hsnCode: '7217',
      purchasePrice: 68,
      salePrice: 85,
      minSalePrice: 78,
      gstRate: 18,
      minStockLevel: 100,
      openingStock: 650,
      currentStock: 650,
      categoryId: categoriesMap['Hardware & Fasteners'],
      unitId: unitsMap['KG'],
    },
    {
      name: 'Bosch GWS 600 Angle Grinder (100mm)',
      sku: 'TOOL-BOS-GWS600',
      barcode: '890100080001',
      description: 'Compact 670W 4-inch angle grinder for cutting and grinding',
      hsnCode: '8467',
      purchasePrice: 2300,
      salePrice: 2950,
      minSalePrice: 2750,
      gstRate: 18,
      minStockLevel: 5,
      openingStock: 12,
      currentStock: 12,
      categoryId: categoriesMap['Power Tools & Safety'],
      brandId: brandsMap['Bosch Power Tools'],
      unitId: unitsMap['PCS'],
    },
  ];

  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });

    // Create warehouse stock
    await prisma.stock.upsert({
      where: {
        productId_warehouseId: {
          productId: product.id,
          warehouseId: mainGodown.id,
        },
      },
      update: {},
      create: {
        productId: product.id,
        warehouseId: mainGodown.id,
        quantity: p.currentStock,
        minStock: p.minStockLevel,
      },
    });

    // Create opening stock movement
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        warehouseId: mainGodown.id,
        type: 'OPENING',
        quantity: p.openingStock,
        balanceAfter: p.currentStock,
        reason: 'Initial Opening Stock Setup',
        createdById: admin.id,
      },
    });
  }
  console.log('✓ Products & Stock movements seeded');

  // 9. Customers
  const customersData = [
    {
      name: 'Sharma Builders & Infra Developers',
      contactPerson: 'Rajesh Sharma',
      mobile: '9822014567',
      whatsapp: '9822014567',
      email: 'rajesh@sharmabuilders.in',
      address: 'Tower A, Royal Commercial Complex, Baner',
      city: 'Pune',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '411045',
      gstin: '27AAACS8912K1ZT',
      pan: 'AAACS8912K',
      creditLimit: 1000000,
      openingBalance: 125000,
      currentBalance: 125000,
      totalSales: 125000,
      totalPaid: 0,
      notes: 'Premier contractor - 30-day payment cycle',
    },
    {
      name: 'Krishna Constructions & Civil Works',
      contactPerson: 'Suresh Patil',
      mobile: '9823198765',
      whatsapp: '9823198765',
      email: 'patil@krishnaconstructions.com',
      address: 'Plot 88, Near Toll Plaza, Hadapsar',
      city: 'Pune',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '411028',
      gstin: '27BBLCP4432M1ZG',
      creditLimit: 500000,
      openingBalance: 48500,
      currentBalance: 48500,
      totalSales: 48500,
      totalPaid: 0,
      notes: 'Residential and commercial villa contractor',
    },
    {
      name: 'Omkar Interiors & Hardware Contractor',
      contactPerson: 'Omkar Joshi',
      mobile: '9765432109',
      whatsapp: '9765432109',
      email: 'omkar@interiors.in',
      address: 'Shop 4, Kothrud Main Road',
      city: 'Pune',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '411038',
      creditLimit: 150000,
      openingBalance: 14200,
      currentBalance: 14200,
      totalSales: 14200,
      totalPaid: 0,
      notes: 'Interior, plumbing and electrical contractor',
    },
    {
      name: 'Cash Counter / Walk-in Customer',
      contactPerson: 'Counter Sales',
      mobile: '9999999999',
      city: 'Pune',
      state: 'Maharashtra',
      stateCode: '27',
      creditLimit: 0,
      openingBalance: 0,
      currentBalance: 0,
      totalSales: 0,
      totalPaid: 0,
      notes: 'Immediate payment walk-in customers',
    },
  ];

  for (const cust of customersData) {
    const createdCust = await prisma.customer.create({
      data: cust,
    });

    if (cust.openingBalance > 0) {
      await prisma.ledgerEntry.create({
        data: {
          entityType: 'CUSTOMER',
          customerId: createdCust.id,
          transactionType: 'OPENING_BALANCE',
          referenceNo: 'OB-2026',
          debit: cust.openingBalance,
          credit: 0,
          runningBalance: cust.openingBalance,
          notes: 'Opening receivable balance',
          createdById: admin.id,
        },
      });
    }
  }
  console.log('✓ Customers seeded');

  // 10. Suppliers
  const suppliersData = [
    {
      name: 'Apex Cement & Building Materials Distributors',
      contactPerson: 'Vikas Agarwal',
      mobile: '9890123456',
      whatsapp: '9890123456',
      email: 'sales@apexmaterials.com',
      address: 'Survey 104, Godown Zone, Wagholi',
      city: 'Pune',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '412207',
      gstin: '27AAHCA9014L1ZM',
      openingBalance: 85000,
      currentBalance: 85000,
      totalPurchase: 85000,
      totalPaid: 0,
      notes: 'Authorized UltraTech cement and aggregates C&F',
    },
    {
      name: 'Maharashtra Steel Syndicate',
      contactPerson: 'Mahesh Kulkarni',
      mobile: '9890789012',
      whatsapp: '9890789012',
      email: 'msteel@syndicate.in',
      address: 'Loha Bhavan, Timber Market',
      city: 'Pune',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '411002',
      gstin: '27AALPM7810J1ZP',
      openingBalance: 140000,
      currentBalance: 140000,
      totalPurchase: 140000,
      totalPaid: 0,
      notes: 'Tata Tiscon direct dealer',
    },
    {
      name: 'Metro Hardware Wholesale Mart',
      contactPerson: 'Deepak Shah',
      mobile: '9822334455',
      whatsapp: '9822334455',
      email: 'info@metrohardware.com',
      address: 'Ganesh Peth, Wholesale Hardware Market',
      city: 'Pune',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '411002',
      gstin: '27AAICD3344F1ZX',
      openingBalance: 24500,
      currentBalance: 24500,
      totalPurchase: 24500,
      totalPaid: 0,
      notes: 'Fasteners, locks, tools and general hardware',
    },
  ];

  for (const sup of suppliersData) {
    const createdSup = await prisma.supplier.create({
      data: sup,
    });

    if (sup.openingBalance > 0) {
      await prisma.ledgerEntry.create({
        data: {
          entityType: 'SUPPLIER',
          supplierId: createdSup.id,
          transactionType: 'OPENING_BALANCE',
          referenceNo: 'OB-2026',
          debit: 0,
          credit: sup.openingBalance,
          runningBalance: sup.openingBalance,
          notes: 'Opening payable balance',
          createdById: admin.id,
        },
      });
    }
  }
  console.log('✓ Suppliers seeded');

  // 11. Expense Categories
  const expenseCategories = [
    { name: 'Freight & Transportation', description: 'Tempo, truck and loading freight' },
    { name: 'Godown Rent & Utilities', description: 'Godown rent, electricity, water' },
    { name: 'Staff Salary & Wages', description: 'Labour daily wages and staff salaries' },
    { name: 'Vehicle Fuel & Maintenance', description: 'Delivery truck diesel and service' },
    { name: 'Office & Tea Expenses', description: 'Office supplies, printing, guest tea' },
  ];

  for (const exp of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { name: exp.name },
      update: {},
      create: exp,
    });
  }
  console.log('✓ Expense categories seeded');

  // 12. Create sample Sale and Purchase transaction to populate Dashboard & Charts
  const sampleCustomer = await prisma.customer.findFirst({ where: { name: { contains: 'Sharma' } } });
  const sampleSupplier = await prisma.supplier.findFirst({ where: { name: { contains: 'Apex' } } });
  const cementProduct = await prisma.product.findFirst({ where: { sku: 'CEM-UT-50' } });
  const steelProduct = await prisma.product.findFirst({ where: { sku: 'STEEL-TT-12MM' } });

  if (sampleCustomer && cementProduct && steelProduct) {
    const subtotal = 100 * cementProduct.salePrice + 200 * steelProduct.salePrice; // 39000 + 14400 = 53400
    const taxAmount = (100 * cementProduct.salePrice * 0.28) + (200 * steelProduct.salePrice * 0.18); // 10920 + 2592 = 13512
    const grandTotal = subtotal + taxAmount; // 66912

    const sampleSale = await prisma.sale.create({
      data: {
        invoiceNumber: 'INV-26/0001',
        customerId: sampleCustomer.id,
        date: new Date(),
        subtotal,
        discount: 0,
        taxableAmount: subtotal,
        cgstAmount: taxAmount / 2,
        sgstAmount: taxAmount / 2,
        taxAmount,
        grandTotal,
        paidAmount: 20000,
        balanceAmount: grandTotal - 20000,
        paymentMode: 'BANK_TRANSFER',
        status: 'PARTIAL',
        createdById: admin.id,
        items: {
          create: [
            {
              productId: cementProduct.id,
              warehouseId: mainGodown.id,
              description: cementProduct.name,
              hsnCode: cementProduct.hsnCode,
              unit: 'BAG',
              quantity: 100,
              rate: cementProduct.salePrice,
              taxableAmount: 100 * cementProduct.salePrice,
              gstRate: 28,
              cgstAmount: (100 * cementProduct.salePrice * 0.14),
              sgstAmount: (100 * cementProduct.salePrice * 0.14),
              totalAmount: 100 * cementProduct.salePrice * 1.28,
            },
            {
              productId: steelProduct.id,
              warehouseId: mainGodown.id,
              description: steelProduct.name,
              hsnCode: steelProduct.hsnCode,
              unit: 'KG',
              quantity: 200,
              rate: steelProduct.salePrice,
              taxableAmount: 200 * steelProduct.salePrice,
              gstRate: 18,
              cgstAmount: (200 * steelProduct.salePrice * 0.09),
              sgstAmount: (200 * steelProduct.salePrice * 0.09),
              totalAmount: 200 * steelProduct.salePrice * 1.18,
            }
          ]
        }
      }
    });

    // Create payment entry for ₹20,000
    await prisma.payment.create({
      data: {
        paymentNumber: 'REC-26/0001',
        type: 'CUSTOMER',
        customerId: sampleCustomer.id,
        saleId: sampleSale.id,
        amount: 20000,
        paymentMode: 'BANK_TRANSFER',
        referenceNo: 'HDFC-NEFT-99128',
        notes: 'Advance part payment for INV-26/0001',
        createdById: admin.id,
      }
    });

    // Stock movement for sale
    await prisma.stockMovement.create({
      data: {
        productId: cementProduct.id,
        warehouseId: mainGodown.id,
        type: 'SALE',
        quantity: -100,
        balanceAfter: 400,
        referenceType: 'SALE',
        referenceId: 'INV-26/0001',
        reason: 'Customer Invoice Sale',
        createdById: admin.id,
      }
    });

    await prisma.stockMovement.create({
      data: {
        productId: steelProduct.id,
        warehouseId: mainGodown.id,
        type: 'SALE',
        quantity: -200,
        balanceAfter: 2300,
        referenceType: 'SALE',
        referenceId: 'INV-26/0001',
        reason: 'Customer Invoice Sale',
        createdById: admin.id,
      }
    });

    // Update customer balance
    await prisma.customer.update({
      where: { id: sampleCustomer.id },
      data: {
        totalSales: sampleCustomer.totalSales + grandTotal,
        totalPaid: sampleCustomer.totalPaid + 20000,
        currentBalance: sampleCustomer.currentBalance + (grandTotal - 20000),
      }
    });

    // Ledger entries
    await prisma.ledgerEntry.create({
      data: {
        entityType: 'CUSTOMER',
        customerId: sampleCustomer.id,
        transactionType: 'INVOICE',
        referenceNo: 'INV-26/0001',
        saleId: sampleSale.id,
        debit: grandTotal,
        credit: 0,
        runningBalance: sampleCustomer.currentBalance + (grandTotal - 20000),
        notes: 'Tax Invoice INV-26/0001',
        createdById: admin.id,
      }
    });

    await prisma.ledgerEntry.create({
      data: {
        entityType: 'CUSTOMER',
        customerId: sampleCustomer.id,
        transactionType: 'PAYMENT',
        referenceNo: 'REC-26/0001',
        saleId: sampleSale.id,
        debit: 0,
        credit: 20000,
        runningBalance: sampleCustomer.currentBalance + (grandTotal - 20000),
        notes: 'Payment received via Bank Transfer',
        createdById: admin.id,
      }
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userName: 'Owner Admin',
        action: 'CREATE',
        module: 'SALE',
        recordId: sampleSale.id,
        recordTitle: 'INV-26/0001',
        details: 'Invoice created for Sharma Builders (Total: ₹66,912, Paid: ₹20,000)',
      }
    });

    console.log('✓ Sample sale, payments and ledger entries created');
  }

  console.log('=== BuildStock ERP Database Successfully Seeded! ===');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
