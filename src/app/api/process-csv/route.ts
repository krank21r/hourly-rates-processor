import { NextRequest, NextResponse } from 'next/server';

interface CSVRow {
  [key: string]: string;
}

interface CategoryConfig {
  name: string;
  code: string;
  designations: string[];
}

interface ShopConfig {
  shopName: string;
  payGroup: string;
  payGroupNumeric: string;
}

const SHOPS: ShopConfig[] = [
  { shopName: "MILLWRIGHT", payGroup: "915101", payGroupNumeric: "0915101" },
  { shopName: "MACHINE", payGroup: "915103", payGroupNumeric: "0915103" },
  { shopName: "COMPONENT", payGroup: "915104", payGroupNumeric: "0915104" },
  { shopName: "SMITHY", payGroup: "915105", payGroupNumeric: "0915105" },
  { shopName: "WELDING", payGroup: "915107", payGroupNumeric: "0915107" },
  { shopName: "TOOL ROOM", payGroup: "915108", payGroupNumeric: "0915108" },
  { shopName: "CARRIAGE", payGroup: "915109&11", payGroupNumeric: "0915109" },
  { shopName: "WTS (tinsmith)", payGroup: "915112", payGroupNumeric: "0915112" },
  { shopName: "CORROSION", payGroup: "915113", payGroupNumeric: "0915113" },
  { shopName: "C&B & UF", payGroup: "915115&16", payGroupNumeric: "0915115" },
  { shopName: "Power car", payGroup: "915117", payGroupNumeric: "0915117" },
  { shopName: "TRIMMING", payGroup: "915119", payGroupNumeric: "0915119" },
  { shopName: "PAINT", payGroup: "915120&21", payGroupNumeric: "0915120" }
];

const CATEGORIES: CategoryConfig[] = [
  {
    name: "CATEGORY I",
    code: "4200",
    designations: [
      "SR. TECH", "Sr.TECH(FITTER)", "Sr.MACHINE OPTR.", "STDMECH", 
      "SR.TECH(WELD)", "SR.TECH(MECH)", "Sr.TINSMITH", "Sr.TECH.(POWER)", "Sr.TECH(PAINTER)"
    ]
  },
  {
    name: "CATEGORY II",
    code: "2800",
    designations: ["TECH-I", "FITTER-I", "MECHANIC-I"]
  },
  {
    name: "CATEGORY III",
    code: "2400",
    designations: ["TECH-II", "FITTER-II"]
  },
  {
    name: "CATEGORY IV",
    code: "2000 & 1900/1800",
    designations: ["TECH-III", "ASST(WS)", "B.PEON", "HELPER", "KHALASI HELPER", "FITTER-III"]
  }
];

function countifs(data: CSVRow[], payGroupCol: string, payGroupValue: string, designationCol: string, designations: string[]): number {
  return data.filter(row => {
    const rowPayGroup = row[payGroupCol]?.trim();
    const rowDesignation = row[designationCol]?.trim();
    
    // More flexible pay group matching - try exact match, partial match, and with/without leading zero
    const payGroupMatch = rowPayGroup === payGroupValue || 
                         rowPayGroup === payGroupValue.replace(/^0/, '') ||
                         rowPayGroup === '0' + payGroupValue ||
                         rowPayGroup?.includes(payGroupValue) ||
                         payGroupValue?.includes(rowPayGroup);
    
    const designationMatch = designations.some(designation => 
      rowDesignation?.includes(designation) || designation?.includes(rowDesignation)
    );
    
    return payGroupMatch && designationMatch;
  }).length;
}

function sumifs(data: CSVRow[], sumCol: string, payGroupCol: string, payGroupValue: string, designationCol: string, designations: string[]): number {
  return data.reduce((sum, row) => {
    const rowPayGroup = row[payGroupCol]?.trim();
    const rowDesignation = row[designationCol]?.trim();
    const rowSumValue = parseFloat(row[sumCol]) || 0;
    
    // More flexible pay group matching - try exact match, partial match, and with/without leading zero
    const payGroupMatch = rowPayGroup === payGroupValue || 
                         rowPayGroup === payGroupValue.replace(/^0/, '') ||
                         rowPayGroup === '0' + payGroupValue ||
                         rowPayGroup?.includes(payGroupValue) ||
                         payGroupValue?.includes(rowPayGroup);
    
    if (payGroupMatch && designations.some(designation => 
      rowDesignation?.includes(designation) || designation?.includes(rowDesignation)
    )) {
      return sum + rowSumValue;
    }
    return sum;
  }, 0);
}

function processShopData(data: CSVRow[], shop: ShopConfig, payGroupCol: string, designationCol: string, paymentCol: string) {
  const categories = CATEGORIES.map(category => {
    const noOfStaff = countifs(data, payGroupCol, shop.payGroupNumeric, designationCol, category.designations);
    const payment = sumifs(data, paymentCol, payGroupCol, shop.payGroupNumeric, designationCol, category.designations);
    const avgPay = noOfStaff > 0 ? payment / noOfStaff : 0;
    const hrlyRate = avgPay / 240;

    return {
      name: category.name,
      code: category.code,
      noOfStaff: noOfStaff.toString(),
      payment: `${payment.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
      avgPay: `${avgPay.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
      hrlyRate: `${hrlyRate.toFixed(2)}`
    };
  });

  return {
    shopName: shop.shopName,
    payGroup: shop.payGroup,
    categories
  };
}

function calculateTotals(shopsData: any[]) {
  if (shopsData.length === 0) {
    return {
      category1: "0.00",
      category2: "0.00", 
      category3: "0.00",
      category4: "0.00"
    };
  }

  const totals = {
    category1: { hrlyRate: 0, count: 0 },
    category2: { hrlyRate: 0, count: 0 },
    category3: { hrlyRate: 0, count: 0 },
    category4: { hrlyRate: 0, count: 0 }
  };

  shopsData.forEach(shop => {
    if (shop.categories[0] && parseFloat(shop.categories[0].hrlyRate) > 0) {
      totals.category1.hrlyRate += parseFloat(shop.categories[0].hrlyRate);
      totals.category1.count++;
    }
    if (shop.categories[1] && parseFloat(shop.categories[1].hrlyRate) > 0) {
      totals.category2.hrlyRate += parseFloat(shop.categories[1].hrlyRate);
      totals.category2.count++;
    }
    if (shop.categories[2] && parseFloat(shop.categories[2].hrlyRate) > 0) {
      totals.category3.hrlyRate += parseFloat(shop.categories[2].hrlyRate);
      totals.category3.count++;
    }
    if (shop.categories[3] && parseFloat(shop.categories[3].hrlyRate) > 0) {
      totals.category4.hrlyRate += parseFloat(shop.categories[3].hrlyRate);
      totals.category4.count++;
    }
  });

  return {
    category1: totals.category1.count > 0 ? `${(totals.category1.hrlyRate / totals.category1.count).toFixed(2)}` : "0.00",
    category2: totals.category2.count > 0 ? `${(totals.category2.hrlyRate / totals.category2.count).toFixed(2)}` : "0.00",
    category3: totals.category3.count > 0 ? `${(totals.category3.hrlyRate / totals.category3.count).toFixed(2)}` : "0.00",
    category4: totals.category4.count > 0 ? `${(totals.category4.hrlyRate / totals.category4.count).toFixed(2)}` : "0.00"
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are accepted' },
        { status: 400 }
      );
    }

    // Read file content
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file must contain at least a header and one data row' },
        { status: 400 }
      );
    }

    // Parse CSV
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      const row: CSVRow = {};
      headers.forEach((header, colIndex) => {
        row[header] = values[colIndex] || '';
      });
      return row;
    });

    // Find required columns - more specific detection
    const payGroupCol = headers.find(h => h.toLowerCase() === 'billunit') || 
                         headers.find(h => h.toLowerCase().includes('billunit')) || 
                         headers.find(h => h.toLowerCase().includes('unit')) || 
                         'BILLUNIT';
    
    const designationCol = headers.find(h => h.toLowerCase() === 'desigshortdesc') || 
                           headers.find(h => h.toLowerCase().includes('desigshortdesc')) ||
                           headers.find(h => h.toLowerCase().includes('desig')) ||
                           headers.find(h => h.toLowerCase().includes('designation')) ||
                           'DESIGSHORTDESC';
    
    const paymentCol = headers.find(h => h.toLowerCase() === 'grosspay') || 
                       headers.find(h => h.toLowerCase().includes('grosspay')) ||
                       headers.find(h => h.toLowerCase() === 'gross') || 
                       headers.find(h => h.toLowerCase().includes('gross')) ||
                       headers.find(h => h.toLowerCase().includes('payment')) ||
                       headers.find(h => h.toLowerCase() === 'basic') || 
                       headers.find(h => h.toLowerCase().includes('basic')) ||
                       'GROSSPAY';

    // Process data for each shop
    const shopsData = SHOPS.map(shop => 
      processShopData(rows, shop, payGroupCol, designationCol, paymentCol)
    ).filter(shop => shop.categories.some(cat => parseInt(cat.noOfStaff) > 0));

    // Calculate totals
    const totals = calculateTotals(shopsData);

    return NextResponse.json({
      success: true,
      data: {
        shops: shopsData,
        totals,
        totalShops: shopsData.length,
        fileName: file.name,
        fileSize: file.size,
        processedAt: new Date().toISOString(),
        columnsFound: {
          payGroup: payGroupCol,
          designation: designationCol,
          payment: paymentCol
        }
      }
    });

  } catch (error) {
    console.error('Error processing CSV:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV file: ' + (error as Error).message },
      { status: 500 }
    );
  }
}