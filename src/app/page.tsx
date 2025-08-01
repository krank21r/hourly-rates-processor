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
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, Download, FileSpreadsheet, Database } from 'lucide-react';
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
    <Card className="w-full border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center gap-2 text-lg">
          <Upload className="h-5 w-5 text-blue-600" />
          Upload CSV File
        </CardTitle>
        <CardDescription className="text-sm text-gray-600">
          Select your hourly rates CSV file to process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-blue-500 bg-blue-50 scale-105'
              : isProcessing
              ? 'border-gray-200 cursor-not-allowed opacity-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-4">
            <div className={`p-4 rounded-full ${isDragActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <FileText className={`h-8 w-8 ${isDragActive ? 'text-blue-600' : 'text-gray-500'}`} />
            </div>
            {selectedFile ? (
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-800">{selectedFile.name}</p>
                <Badge variant="secondary" className="text-xs">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </Badge>
                <p className="text-sm text-gray-500">
                  Click or drag to replace file
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700">
                  {isDragActive ? 'Drop your CSV file here' : 'Drag & drop your CSV file here'}
                </p>
                <p className="text-sm text-gray-500">
                  or click to browse files
                </p>
                <p className="text-xs text-gray-400">
                  Only CSV files are accepted
                </p>
              </div>
            )}
          </div>
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
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-green-600" />
          Process Data
        </CardTitle>
        <CardDescription>
          Analyze your CSV file to generate hourly rates report
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={onProcess}
          disabled={!selectedFile || isProcessing}
          className="w-full h-12 text-base font-medium"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing Data...
            </>
          ) : (
            <>
              <Database className="mr-2 h-5 w-5" />
              Generate Report
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Report generated successfully! You can now download it.
            </AlertDescription>
          </Alert>
        )}

        {isProcessing && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Analyzing data...</span>
              <span>Processing</span>
            </div>
            <Progress value={75} className="w-full h-2" />
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

function DataDisplay({ data, isLoading }: DataDisplayProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  const generatePDF = useCallback(async () => {
    if (!data || !data.shops || data.shops.length === 0) {
      alert('No data available for PDF generation');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      // Create PDF in landscape mode
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Set margins
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      
      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Average Labour Hourly Rates Report', pageWidth / 2, 20, { align: 'center' });
      
      // Subtitle with date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });
      
      // Calculate column widths for landscape layout
      const shopNameWidth = 35;
      const payGroupWidth = 25;
      const categoryWidth = (contentWidth - shopNameWidth - payGroupWidth) / 16; // 4 categories × 4 columns each
      
      // Prepare table data
      const tableData = [];
      
      // Add data rows
      data.shops.forEach(shop => {
        const row = [shop.shopName, shop.payGroup];
        shop.categories.forEach(category => {
          row.push(
            category.noOfStaff,
            category.payment,
            category.avgPay,
            category.hrlyRate
          );
        });
        tableData.push(row);
      });
      
      // Add totals row
      const totalsRow = ['Total Hourly Rate', ''];
      const totals = [data.totals.category1, data.totals.category2, data.totals.category3, data.totals.category4];
      totals.forEach(total => {
        totalsRow.push('', '', '', total || '0.00');
      });
      tableData.push(totalsRow);
      
      // Create table with autoTable
      doc.autoTable({
        head: [[
          'SHOP NAME', 'Pay Group',
          'No of staff', 'Payment', 'Avg pay', 'Hrly rate',
          'No of staff', 'Payment', 'Avg pay', 'Hrly rate',
          'No of staff', 'Payment', 'Avg pay', 'Hrly rate',
          'No of staff', 'Payment', 'Avg pay', 'Hrly rate'
        ]],
        body: tableData,
        startY: 35,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 7,
          cellPadding: 1.5,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'center',
        },
        columnStyles: {
          0: { cellWidth: shopNameWidth, halign: 'left' },
          1: { cellWidth: payGroupWidth, halign: 'center' },
          2: { cellWidth: categoryWidth, halign: 'center' },
          3: { cellWidth: categoryWidth, halign: 'right' },
          4: { cellWidth: categoryWidth, halign: 'right' },
          5: { cellWidth: categoryWidth, halign: 'right', fontStyle: 'bold' },
          6: { cellWidth: categoryWidth, halign: 'center' },
          7: { cellWidth: categoryWidth, halign: 'right' },
          8: { cellWidth: categoryWidth, halign: 'right' },
          9: { cellWidth: categoryWidth, halign: 'right', fontStyle: 'bold' },
          10: { cellWidth: categoryWidth, halign: 'center' },
          11: { cellWidth: categoryWidth, halign: 'right' },
          12: { cellWidth: categoryWidth, halign: 'right' },
          13: { cellWidth: categoryWidth, halign: 'right', fontStyle: 'bold' },
          14: { cellWidth: categoryWidth, halign: 'center' },
          15: { cellWidth: categoryWidth, halign: 'right' },
          16: { cellWidth: categoryWidth, halign: 'right' },
          17: { cellWidth: categoryWidth, halign: 'right', fontStyle: 'bold' },
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        didDrawPage: (data) => {
          // Add category headers
          const startX = margin + shopNameWidth + payGroupWidth;
          const headerY = data.settings.startY - 10;
          
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          
          const categories = [
            { name: 'CATEGORY I', code: '4200' },
            { name: 'CATEGORY II', code: '2800' },
            { name: 'CATEGORY III', code: '2400' },
            { name: 'CATEGORY IV', code: '2000 & 1900/1800' }
          ];
          
          categories.forEach((cat, index) => {
            const x = startX + (index * categoryWidth * 4) + (categoryWidth * 2);
            doc.text(cat.name, x, headerY - 5, { align: 'center' });
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.text(cat.code, x, headerY - 1, { align: 'center' });
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
          });
          
          // Add footer
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(`Page 1 of 1`, pageWidth - margin, pageHeight - 5, { align: 'right' });
        },
      });
      
      // Add processing notes at the bottom
      const finalY = doc.lastAutoTable.finalY + 10;
      if (finalY < pageHeight - 30) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Processing Details:', margin, finalY);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const notes = [
          '• No of staff: COUNTIFS based on Pay Group and Designation',
          '• Payment: SUMIFS based on Pay Group and Designation',
          '• Avg pay: Payment total / No of staff',
          '• Hrly rate: Avg pay / 240'
        ];
        
        notes.forEach((note, index) => {
          doc.text(note, margin, finalY + 6 + (index * 4));
        });
      }
      
      // Save the PDF
      const fileName = `hourly-rates-report-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [data]);

  const generateExcel = useCallback(async () => {
    if (!data || !data.shops || data.shops.length === 0) return;

    setIsGeneratingExcel(true);
    try {
      const wb = XLSX.utils.book_new();
      
      const excelData: any[] = [];
      
      // Add header row
      const headerRow = ['SHOP NAME', 'Pay Group'];
      data.shops[0]?.categories.forEach((category, index) => {
        headerRow.push(
          `Cat ${index + 1} - No of staff`,
          `Cat ${index + 1} - Payment`,
          `Cat ${index + 1} - Avg pay`,
          `Cat ${index + 1} - Hrly rate`
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
      
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, 'Hourly Rates');
      
      const fileName = `hourly-rates-report-${new Date().toISOString().split('T')[0]}.xlsx`;
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
          <CardTitle>Processing Results</CardTitle>
          <CardDescription>
            Your hourly rates report will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
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
          <CardTitle>Processing Results</CardTitle>
          <CardDescription>
            Your hourly rates report will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <FileText className="mx-auto h-16 w-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No data to display</p>
            <p className="text-sm">Upload and process a CSV file to see results</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { shops, totals, columnsFound } = data;

  return (
    <Card className="w-full shadow-lg border border-gray-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Average Labour Hourly Rates Report
            </CardTitle>
            <CardDescription className="text-base mt-2 text-gray-600">
              Analysis of {shops.length} shops with hourly rate calculations
              {columnsFound && (
                <div className="text-sm text-gray-500 mt-2 bg-white/70 p-3 rounded-lg">
                  <strong>Data Sources:</strong> Pay Group ({columnsFound.payGroup}), 
                  Designation ({columnsFound.designation}), 
                  Payment ({columnsFound.payment})
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
                className="shadow-md bg-blue-600 hover:bg-blue-700"
              >
                {(isGeneratingPDF || isGeneratingExcel) ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Download Report
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
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                <th className="border border-gray-300 p-3 text-left font-bold text-gray-800 min-w-[120px]">SHOP NAME</th>
                <th className="border border-gray-300 p-3 text-center font-bold text-gray-800 min-w-[100px]">Pay Group</th>
                <th className="border border-gray-300 p-3 text-center font-bold text-gray-800" colSpan={4}>
                  CATEGORY I<br />
                  <span className="font-normal text-xs text-gray-600">4200</span>
                </th>
                <th className="border border-gray-300 p-3 text-center font-bold text-gray-800" colSpan={4}>
                  CATEGORY II<br />
                  <span className="font-normal text-xs text-gray-600">2800</span>
                </th>
                <th className="border border-gray-300 p-3 text-center font-bold text-gray-800" colSpan={4}>
                  CATEGORY III<br />
                  <span className="font-normal text-xs text-gray-600">2400</span>
                </th>
                <th className="border border-gray-300 p-3 text-center font-bold text-gray-800" colSpan={4}>
                  CATEGORY IV<br />
                  <span className="font-normal text-xs text-gray-600">2000 & 1900/1800</span>
                </th>
              </tr>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-2"></th>
                <th className="border border-gray-300 p-2"></th>
                {[1, 2, 3, 4].map(cat => (
                  <React.Fragment key={cat}>
                    <th className="border border-gray-300 p-2 text-xs font-semibold text-gray-700 min-w-[70px]">No of staff</th>
                    <th className="border border-gray-300 p-2 text-xs font-semibold text-gray-700 min-w-[80px]">Payment</th>
                    <th className="border border-gray-300 p-2 text-xs font-semibold text-gray-700 min-w-[80px]">Avg pay</th>
                    <th className="border border-gray-300 p-2 text-xs font-semibold text-gray-700 min-w-[70px]">Hrly rate</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {shops.map((shop, index) => (
                <tr key={index} className="hover:bg-blue-50 transition-colors">
                  <td className="border border-gray-300 p-3 font-semibold text-gray-800">{shop.shopName}</td>
                  <td className="border border-gray-300 p-3 text-center text-gray-700">{shop.payGroup}</td>
                  {shop.categories.map((category, catIndex) => (
                    <React.Fragment key={catIndex}>
                      <td className="border border-gray-300 p-3 text-center text-gray-700">{category.noOfStaff}</td>
                      <td className="border border-gray-300 p-3 text-right text-gray-700">{category.payment}</td>
                      <td className="border border-gray-300 p-3 text-right text-gray-700">{category.avgPay}</td>
                      <td className="border border-gray-300 p-3 text-right font-bold text-blue-600">{category.hrlyRate}</td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
              <tr className="bg-gradient-to-r from-blue-100 to-indigo-100 font-bold">
                <td className="border border-gray-300 p-3 text-gray-800" colSpan={2}>Total Hourly Rate</td>
                <td className="border border-gray-300 p-3 text-center"></td>
                <td className="border border-gray-300 p-3 text-right"></td>
                <td className="border border-gray-300 p-3 text-right"></td>
                <td className="border border-gray-300 p-3 text-right font-bold text-blue-700">{totals.category1}</td>
                <td className="border border-gray-300 p-3 text-center"></td>
                <td className="border border-gray-300 p-3 text-right"></td>
                <td className="border border-gray-300 p-3 text-right"></td>
                <td className="border border-gray-300 p-3 text-right font-bold text-blue-700">{totals.category2}</td>
                <td className="border border-gray-300 p-3 text-center"></td>
                <td className="border border-gray-300 p-3 text-right"></td>
                <td className="border border-gray-300 p-3 text-right"></td>
                <td className="border border-gray-300 p-3 text-right font-bold text-blue-700">{totals.category3}</td>
                <td className="border border-gray-300 p-3 text-center"></td>
                <td className="border border-gray-300 p-3 text-right"></td>
                <td className="border border-gray-300 p-3 text-right"></td>
                <td className="border border-gray-300 p-3 text-right font-bold text-blue-700">{totals.category4}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              Processing Methodology
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>No of staff:</strong> COUNTIFS based on Pay Group and Designation</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Payment:</strong> SUMIFS based on Pay Group and Designation</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Avg pay:</strong> Payment total divided by No of staff</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Hrly rate:</strong> Average pay divided by 240</span>
              </div>
            </div>
          </div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Hourly Rates Processor
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your CSV file to generate comprehensive hourly rates analysis with professional reports
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