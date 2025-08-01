'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, Download, FileSpreadsheet } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Extend jsPDF interface to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable: { finalY: number };
  }
}

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  isProcessing: boolean;
}

function FileUpload({ onFileSelect, selectedFile, isProcessing }: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
    setIsDragActive(false);
  }, [onFileSelect]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    disabled: isProcessing,
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload CSV File
        </CardTitle>
        <CardDescription>
          Upload a CSV file containing hourly rates data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : isProcessing
              ? 'border-muted-foreground/25 cursor-not-allowed'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          {selectedFile ? (
            <div className="space-y-2">
              <p className="text-lg font-medium">{selectedFile.name}</p>
              <Badge variant="secondary" className="text-xs">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </Badge>
              <p className="text-sm text-muted-foreground">
                Click or drag to replace file
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {isDragActive ? 'Drop your CSV file here' : 'Drag & drop your CSV file here'}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse files
              </p>
              <p className="text-xs text-muted-foreground">
                Only CSV files are accepted
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ProcessingControlsProps {
  selectedFile: File | null;
  isProcessing: boolean;
  onProcess: () => void;
  error: string | null;
  success: boolean;
}

function ProcessingControls({ selectedFile, isProcessing, onProcess, error, success }: ProcessingControlsProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Process File</CardTitle>
        <CardDescription>
          Process the uploaded CSV file to retrieve hourly rates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={onProcess}
          disabled={!selectedFile || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Run Processing'
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              File processed successfully!
            </AlertDescription>
          </Alert>
        )}

        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Processing file...</span>
              <span>50%</span>
            </div>
            <Progress value={50} className="w-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DataDisplayProps {
  data: any[] | null;
  isLoading: boolean;
}

interface HourlyRateData {
  shopName: string;
  payGroup: string;
  categories: {
    name: string;
    code: string;
    noOfStaff: string;
    payment: string;
    avgPay: string;
    hrlyRate: string;
  }[];
}

function DataDisplay({ data, isLoading }: DataDisplayProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  const generatePDF = useCallback(async () => {
    if (!data || !data.shops || data.shops.length === 0) {
      console.error('No data available for PDF generation');
      alert('No data available for PDF generation');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      console.log('Starting PDF generation...');
      console.log('Data structure:', {
        shops: data.shops?.length,
        totals: data.totals,
        fileName: data.fileName
      });
      
      // Test basic PDF generation first - LANDSCAPE ORIENTATION
      const doc = new jsPDF('landscape'); // Changed to landscape orientation
      
      // Add title only - removed unwanted subtitle text
      doc.setFontSize(18);
      doc.text('Average Labour Hourly Rates', 14, 20);
      
      // Add simple text content
      doc.setFontSize(10);
      doc.text(`Number of shops: ${data.shops.length}`, 14, 40);
      
      console.log('Basic PDF generation successful');
      
      // Generate the full PDF with table
      setTimeout(async () => {
        try {
          console.log('Attempting full PDF with table...');
          
          // Dynamically import and initialize autotable
          const { default: autoTablePlugin } = await import('jspdf-autotable');
          
          // Create a new jsPDF instance - LANDSCAPE ORIENTATION
          const fullDoc = new jsPDF('landscape'); // Changed to landscape orientation
          
          // Apply the plugin
          autoTablePlugin(fullDoc);
          
          // Add title only - removed unwanted subtitle text
          fullDoc.setFontSize(18);
          fullDoc.text('Average Labour Hourly Rates', 14, 20);

          // Prepare table data
          const tableData = data.shops.map(shop => {
            const row: any[] = [shop.shopName, shop.payGroup];
            
            shop.categories.forEach(category => {
              row.push(
                category.noOfStaff,
                category.payment,
                category.avgPay,
                category.hrlyRate
              );
            });
            
            return row;
          });

          // Add totals row
          const totalsRow = ['Total Hourly rate', ''];
          if (data.totals.category1) totalsRow.push('', '', '', data.totals.category1);
          if (data.totals.category2) totalsRow.push('', '', '', data.totals.category2);
          if (data.totals.category3) totalsRow.push('', '', '', data.totals.category3);
          if (data.totals.category4) totalsRow.push('', '', '', data.totals.category4);
          tableData.push(totalsRow);

          console.log('Table data prepared:', tableData.length, 'rows');

          // Check if autoTable is available
          if (typeof (fullDoc as any).autoTable !== 'function') {
            throw new Error('jsPDF-autotable plugin not loaded properly even after dynamic import');
          }

          console.log('AutoTable is available, creating table...');

          // Add table
          (fullDoc as any).autoTable({
            head: [['SHOP NAME', 'Pay Group', 'No of staff', 'Payment', 'Avg pay', 'Hrly rate', 'No of staff', 'Payment', 'Avg pay', 'Hrly rate', 'No of staff', 'Payment', 'Avg pay', 'Hrly rate', 'No of staff', 'Payment', 'Avg pay', 'Hrly rate']],
            body: tableData,
            startY: 50,
            styles: {
              fontSize: 8,
              cellPadding: 2,
            },
            headStyles: {
              fillColor: [66, 66, 66],
              textColor: 255,
              fontSize: 9,
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245],
            },
            columnStyles: {
              0: { cellWidth: 25 }, // SHOP NAME
              1: { cellWidth: 20 }, // Pay Group
            },
            didDrawPage: (data: any) => {
              // Add page number
              fullDoc.setFontSize(8);
              fullDoc.text(
                `Page ${fullDoc.getCurrentPageInfo().pageNumber}`,
                data.settings.margin.left,
                fullDoc.internal.pageSize.height - 10
              );
            },
          });

          console.log('AutoTable completed');

          // Add processing details at the bottom
          const finalY = (fullDoc as any).lastAutoTable?.finalY || 50;
          fullDoc.setFontSize(10);
          fullDoc.text('Processing Details:', 14, finalY + 10);
          fullDoc.setFontSize(8);
          fullDoc.text('• No of staff: COUNTIFS based on Pay Group and Designation', 14, finalY + 16);
          fullDoc.text('• Payment: SUMIFS based on Pay Group and Designation', 14, finalY + 22);
          fullDoc.text('• Avg pay: Payment total / No of staff', 14, finalY + 28);
          fullDoc.text('• Hrly rate: Avg pay / 240', 14, finalY + 34);

          // Save the full PDF
          const fullFileName = `hourly-rates-${new Date().toISOString().split('T')[0]}.pdf`;
          fullDoc.save(fullFileName);
          
          console.log('Full PDF with table saved successfully');
          
        } catch (tableError) {
          console.error('Error generating full PDF with table:', tableError);
          
          // Try a simpler approach without autotable as fallback - LANDSCAPE ORIENTATION
          try {
            console.log('Attempting simple table without autotable in landscape...');
            const simpleDoc = new jsPDF('landscape'); // Changed to landscape orientation
            
            // Add title only - removed unwanted subtitle text
            simpleDoc.setFontSize(18);
            simpleDoc.text('Average Labour Hourly Rates', 14, 20);
            
            // Add table with proper formatting - starting closer to top
            simpleDoc.setFontSize(8);
            let yPos = 35; // Reduced from 60 to fit more content
            const pageWidth = simpleDoc.internal.pageSize.width;
            const pageHeight = simpleDoc.internal.pageSize.height;
            const leftMargin = 14;
            const rightMargin = 14;
            
            // Optimized column widths for landscape orientation to ensure all categories fit properly
            // Total width: 45+40+4*(20+30+30+25) = 45+40+4*105 = 45+40+420 = 505
            const colWidths = [45, 40, 20, 30, 30, 25, 20, 30, 30, 25, 20, 30, 30, 25, 20, 30, 30, 25];
            
            // Function to draw table borders with proper styling
            const drawBorders = (startY: number, rows: number) => {
              simpleDoc.setLineWidth(0.3);
              simpleDoc.setDrawColor(0, 0, 0);
              let currentY = startY;
              const rowHeight = 10; // Increased row height for better text visibility
              
              // Draw horizontal lines
              for (let i = 0; i <= rows; i++) {
                simpleDoc.line(leftMargin, currentY, pageWidth - rightMargin, currentY);
                if (i < rows) currentY += rowHeight;
              }
              
              // Draw vertical lines
              let xPos = leftMargin;
              colWidths.forEach(width => {
                simpleDoc.line(xPos, startY, xPos, currentY);
                xPos += width;
              });
              simpleDoc.line(pageWidth - rightMargin, startY, pageWidth - rightMargin, currentY);
            };
            
            // Function to add text with proper alignment and formatting
            const addCellText = (text: string, x: number, y: number, width: number, align: 'left' | 'center' | 'right' = 'left', bold = false) => {
              if (bold) simpleDoc.setFont('helvetica', 'bold');
              else simpleDoc.setFont('helvetica', 'normal');
              
              const textWidth = simpleDoc.getTextWidth(text);
              let textX = x;
              const padding = 2; // Increased padding for better text spacing
              
              if (align === 'center') {
                textX = x + (width - textWidth) / 2;
              } else if (align === 'right') {
                textX = x + width - textWidth - padding;
              } else {
                textX = x + padding;
              }
              
              simpleDoc.text(text, textX, y);
            };
            
            // First header row (main categories) - exactly matching expected format
            const header1Y = yPos;
            addCellText('SHOP NAME', leftMargin, header1Y + 6, colWidths[0], 'left', true);
            addCellText('Pay Group', leftMargin + colWidths[0], header1Y + 6, colWidths[1], 'left', true);
            
            // Category headers - matching the expected format exactly
            const categories = [
              { name: 'CATEGORY I', code: '4200' },
              { name: 'CATEGORY II', code: '2800' },
              { name: 'CATEGORY III', code: '2400' },
              { name: 'CATEGORY IV', code: '2000 & 1900/1800' }
            ];
            
            let catXPos = leftMargin + colWidths[0] + colWidths[1];
            categories.forEach(cat => {
              const categoryWidth = colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5];
              addCellText(cat.name, catXPos, header1Y + 3, categoryWidth, 'center', true);
              addCellText(cat.code, catXPos, header1Y + 8, categoryWidth, 'center', false);
              catXPos += categoryWidth;
            });
            
            yPos += 15; // Proper spacing for header separation
            
            // Second header row (sub-headers) - exactly matching expected format
            addCellText('', leftMargin, yPos + 6, colWidths[0], 'left');
            addCellText('', leftMargin + colWidths[0], yPos + 6, colWidths[1], 'left');
            
            let subXPos = leftMargin + colWidths[0] + colWidths[1];
            for (let i = 0; i < 4; i++) {
              addCellText('No of staff', subXPos, yPos + 6, colWidths[2], 'center', true);
              addCellText('Payment', subXPos + colWidths[2], yPos + 6, colWidths[3], 'center', true);
              addCellText('Avg pay', subXPos + colWidths[2] + colWidths[3], yPos + 6, colWidths[4], 'center', true);
              addCellText('Hrly rate', subXPos + colWidths[2] + colWidths[3] + colWidths[4], yPos + 6, colWidths[5], 'center', true);
              subXPos += colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5];
            }
            
            yPos += 12; // Proper spacing for data rows
            
            // Data rows with improved formatting
            data.shops.forEach((shop) => {
              // Shop name and pay group
              addCellText(shop.shopName, leftMargin, yPos + 6, colWidths[0], 'left', true);
              addCellText(shop.payGroup, leftMargin + colWidths[0], yPos + 6, colWidths[1], 'left');
              
              // Category data
              let dataXPos = leftMargin + colWidths[0] + colWidths[1];
              shop.categories.forEach(category => {
                addCellText(category.noOfStaff, dataXPos, yPos + 6, colWidths[2], 'center');
                addCellText(category.payment, dataXPos + colWidths[2], yPos + 6, colWidths[3], 'right');
                addCellText(category.avgPay, dataXPos + colWidths[2] + colWidths[3], yPos + 6, colWidths[4], 'right');
                addCellText(category.hrlyRate, dataXPos + colWidths[2] + colWidths[3] + colWidths[4], yPos + 6, colWidths[5], 'right', true);
                dataXPos += colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5];
              });
              
              yPos += 10; // Proper row height for data
            });
            
            // Totals row - exactly matching expected format
            addCellText('Total Hourly rate', leftMargin, yPos + 6, colWidths[0] + colWidths[1], 'left', true);
            
            let totalXPos = leftMargin + colWidths[0] + colWidths[1];
            const totals = [data.totals.category1, data.totals.category2, data.totals.category3, data.totals.category4];
            
            totals.forEach(total => {
              addCellText('', totalXPos, yPos + 6, colWidths[2], 'center');
              addCellText('', totalXPos + colWidths[2], yPos + 6, colWidths[3], 'right');
              addCellText('', totalXPos + colWidths[2] + colWidths[3], yPos + 6, colWidths[4], 'right');
              addCellText(total || '', totalXPos + colWidths[2] + colWidths[3] + colWidths[4], yPos + 6, colWidths[5], 'right', true);
              totalXPos += colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5];
            });
            
            yPos += 12;
            
            // Draw all borders with improved styling
            drawBorders(header1Y, data.shops.length + 3); // +3 for headers and totals
            
            // Save simple PDF - removed processing details
            const simpleFileName = `hourly-rates-${new Date().toISOString().split('T')[0]}.pdf`;
            simpleDoc.save(simpleFileName);
            
            console.log('Landscape PDF saved successfully');
            alert('PDF with complete table format in landscape orientation has been saved successfully!');
            
          } catch (simpleError) {
            console.error('Simple PDF also failed:', simpleError);
            alert(`Error generating PDF: ${tableError instanceof Error ? tableError.message : 'Unknown error'}. Basic test PDF was saved successfully.`);
          }
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [data]);

  const generateExcel = useCallback(async () => {
    if (!data || !data.shops || data.shops.length === 0) return;

    setIsGeneratingExcel(true);
    try {
      // Prepare workbook
      const wb = XLSX.utils.book_new();
      
      // Prepare data for Excel
      const excelData: any[] = [];
      
      // Add header row
      const headerRow = ['SHOP NAME', 'Pay Group'];
      data.shops[0]?.categories.forEach((category, index) => {
        headerRow.push(
          `No of staff`,
          'Payment',
          'Avg pay',
          'Hrly rate'
        );
      });
      excelData.push(headerRow);
      
      // Add shop data
      data.shops.forEach(shop => {
        const row: any[] = [shop.shopName, shop.payGroup];
        shop.categories.forEach(category => {
          row.push(
            category.noOfStaff,
            category.payment,
            category.avgPay,
            category.hrlyRate
          );
        });
        excelData.push(row);
      });
      
      // Add totals row
      const totalsRow = ['Total Hourly rate', ''];
      if (data.totals.category1) totalsRow.push('', '', '', data.totals.category1);
      if (data.totals.category2) totalsRow.push('', '', '', data.totals.category2);
      if (data.totals.category3) totalsRow.push('', '', '', data.totals.category3);
      if (data.totals.category4) totalsRow.push('', '', '', data.totals.category4);
      excelData.push(totalsRow);
      
      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Hourly Rates');
      
      // Generate and download Excel file
      const fileName = `hourly-rates-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Error generating Excel file. Please try again.');
    } finally {
      setIsGeneratingExcel(false);
    }
  }, [data]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Data Results</CardTitle>
          <CardDescription>
            Hourly rates data will appear here after processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.shops || data.shops.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Data Results</CardTitle>
          <CardDescription>
            Hourly rates data will appear here after processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-4" />
            <p>No data to display</p>
            <p className="text-sm">Upload and process a CSV file to see results</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { shops, totals, columnsFound } = data;
  
  // Debug logging
  console.log('DataDisplay component data:', {
    data,
    shops,
    totals,
    columnsFound,
    hasShops: shops && shops.length > 0
  });

  return (
    <Card className="w-full shadow-lg border-2">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-800">Average Labour Hourly Rates</CardTitle>
            <CardDescription className="text-base mt-2">
              Processed hourly rates data ({shops.length} shops)
              {columnsFound && (
                <div className="text-sm text-muted-foreground mt-2 bg-white/50 p-2 rounded">
                  Columns found: Pay Group ({columnsFound.payGroup}), Designation ({columnsFound.designation}), Payment ({columnsFound.payment})
                </div>
              )}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={(isGeneratingPDF || isGeneratingExcel) || !shops || shops.length === 0}
                variant="default"
                size="lg"
                className="shadow-md"
              >
                {(isGeneratingPDF || isGeneratingExcel) ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Download
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={generatePDF} disabled={isGeneratingPDF} className="text-sm">
                <FileText className="mr-2 h-4 w-4" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={generateExcel} disabled={isGeneratingExcel} className="text-sm">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Download Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                <th className="border border-gray-300 p-4 text-left font-bold text-gray-800">SHOP NAME</th>
                <th className="border border-gray-300 p-4 text-left font-bold text-gray-800">Pay Group</th>
                <th className="border border-gray-300 p-4 text-center font-bold text-gray-800" colSpan={4}>
                  CATEGORY I<br />
                  <span className="font-normal text-sm text-gray-600">4200</span>
                </th>
                <th className="border border-gray-300 p-4 text-center font-bold text-gray-800" colSpan={4}>
                  CATEGORY II<br />
                  <span className="font-normal text-sm text-gray-600">2800</span>
                </th>
                <th className="border border-gray-300 p-4 text-center font-bold text-gray-800" colSpan={4}>
                  CATEGORY III<br />
                  <span className="font-normal text-sm text-gray-600">2400</span>
                </th>
                <th className="border border-gray-300 p-4 text-center font-bold text-gray-800" colSpan={4}>
                  CATEGORY IV<br />
                  <span className="font-normal text-sm text-gray-600">2000 & 1900/1800</span>
                </th>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-3"></th>
                <th className="border border-gray-300 p-3"></th>
                <th className="border border-gray-300 p-3 text-sm font-semibold text-gray-700">No of staff</th>
                <th className="border border-gray-300 p-3 text-sm font-semibold text-gray-700">Payment</th>
                <th className="border border-gray-300 p-3 text-sm font-semibold text-gray-700">Avg pay</th>
                <th className="border border-gray-300 p-3 text-sm font-semibold text-gray-700">Hrly rate</th>
                <th className="border border-gray-300 p-3 text-sm font-semibold text-gray-700">No of staff</th>
                <th className="border border-gray-300 p-3 text-sm font-semibold text-gray-700">Payment</th>
                <th className="border border-gray-300 p-3 text-sm font-semibold text-gray-700">Avg pay</th>
                <th className="border border-gray-300 p-3 text-sm font-semibold text-gray-700">Hrly rate</th>
                <th className="border border-gray-300 p-3 text-sm font-semibold text-gray-700">No of staff</th>
                <th className="border border-gray-300 p-3 text-sm font-semibold text-gray-700">Payment</th>
                <th className="border border-gray-300 p-3 text-sm font-semibold text-gray-700">Avg pay</th>
                <th className="border border-gray-300 p-3 text-sm font-semibold text-gray-700">Hrly rate</th>
                <th className="border border-gray-300 p-3 text-sm font-semibold text-gray-700">No of staff</th>
                <th className="border border-gray-300 p-3 text-sm font-semibold text-gray-700">Payment</th>
                <th className="border border-gray-300 p-3 text-sm font-semibold text-gray-700">Avg pay</th>
                <th className="border border-gray-300 p-3 text-sm font-semibold text-gray-700">Hrly rate</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((shop, index) => (
                <tr key={index} className="hover:bg-blue-50 transition-colors">
                  <td className="border border-gray-300 p-4 font-semibold text-gray-800">{shop.shopName}</td>
                  <td className="border border-gray-300 p-4 text-gray-700">{shop.payGroup}</td>
                  {shop.categories.map((category, catIndex) => (
                    <React.Fragment key={catIndex}>
                      <td className="border border-gray-300 p-4 text-center text-gray-700">{category.noOfStaff}</td>
                      <td className="border border-gray-300 p-4 text-right text-gray-700">{category.payment}</td>
                      <td className="border border-gray-300 p-4 text-right text-gray-700">{category.avgPay}</td>
                      <td className="border border-gray-300 p-4 text-right font-bold text-blue-600">{category.hrlyRate}</td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
              <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 font-bold">
                <td className="border border-gray-300 p-4 text-gray-800" colSpan={2}>Total Hourly rate</td>
                <td className="border border-gray-300 p-4 text-center"></td>
                <td className="border border-gray-300 p-4 text-right"></td>
                <td className="border border-gray-300 p-4 text-right"></td>
                <td className="border border-gray-300 p-4 text-right font-bold text-blue-700">{totals.category1}</td>
                <td className="border border-gray-300 p-4 text-center"></td>
                <td className="border border-gray-300 p-4 text-right"></td>
                <td className="border border-gray-300 p-4 text-right"></td>
                <td className="border border-gray-300 p-4 text-right font-bold text-blue-700">{totals.category2}</td>
                <td className="border border-gray-300 p-4 text-center"></td>
                <td className="border border-gray-300 p-4 text-right"></td>
                <td className="border border-gray-300 p-4 text-right"></td>
                <td className="border border-gray-300 p-4 text-right font-bold text-blue-700">{totals.category3}</td>
                <td className="border border-gray-300 p-4 text-center"></td>
                <td className="border border-gray-300 p-4 text-right"></td>
                <td className="border border-gray-300 p-4 text-right"></td>
                <td className="border border-gray-300 p-4 text-right font-bold text-blue-700">{totals.category4}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-800 mb-3"><strong>Processing Details:</strong></p>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
            <li className="flex items-start"><span className="text-blue-600 mr-2">•</span>No of staff: COUNTIFS based on Pay Group and Designation</li>
            <li className="flex items-start"><span className="text-blue-600 mr-2">•</span>Payment: SUMIFS based on Pay Group and Designation</li>
            <li className="flex items-start"><span className="text-blue-600 mr-2">•</span>Avg pay: Payment total / No of staff</li>
            <li className="flex items-start"><span className="text-blue-600 mr-2">•</span>Hrly rate: Avg pay / 240</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<any[] | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setSuccess(false);
    setData(null);
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(false);
    setData(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/process-csv', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process file');
      }

      setData(result.data);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the file');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Hourly Rates Processor</h1>
          <p className="text-xl text-muted-foreground">
            Upload and process CSV files to retrieve hourly rates data
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-6">
            <FileUpload
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              isProcessing={isProcessing}
            />
            <ProcessingControls
              selectedFile={selectedFile}
              isProcessing={isProcessing}
              onProcess={handleProcess}
              error={error}
              success={success}
            />
          </div>
          <div className="lg:col-span-2">
            <DataDisplay data={data} isLoading={isProcessing} />
          </div>
        </div>
      </div>
    </div>
  );
}