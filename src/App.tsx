import React, { useState, useEffect, useRef } from 'react';
import PaymentForm, { initialFormData } from './components/PaymentForm';
import type { PaymentFormData, PayeeInfo } from './components/PaymentForm';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

// Helper: Convert number to Chinese Financial Characters
const digitUppercase = (n: string | number): string => {
  const fraction = ['角', '分'];
  const digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const unit = [['元', '万', '亿'], ['', '拾', '佰', '仟']];
  
  let num = Math.abs(Number(n));
  let s = '';

  // Handle Decimal Part
  for (let i = 0; i < fraction.length; i++) {
    s += (digit[Math.floor(num * 10 * Math.pow(10, i)) % 10] + fraction[i]).replace(/零./, '');
  }
  s = s || '整';
  
  // Handle Integer Part
  num = Math.floor(num);
  for (let i = 0; i < unit[0].length && num > 0; i++) {
    let p = '';
    for (let j = 0; j < unit[1].length && num > 0; j++) {
      p = digit[num % 10] + unit[1][j] + p;
      num = Math.floor(num / 10);
    }
    s = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + s;
  }
  
  return s.replace(/(零.)*零元/, '元').replace(/(零.)+/g, '零').replace(/^整$/, '零元整');
};

const App: React.FC = () => {
  // Helper to get defaults
  const getDefaults = (): PaymentFormData => {
    // Dates should be empty by default, populated only when Payee is entered
    return {
      ...initialFormData,
      dept: '精机主轴',
      year: '',
      month: '',
      day: '',
      operator: '王宇俊',
    };
  };

  // State now holds an array of TWO forms
  const [formsData, setFormsData] = useState<[PaymentFormData, PaymentFormData]>([getDefaults(), getDefaults()]);
  const [payeeDb, setPayeeDb] = useState<PayeeInfo[]>([]);
  const [saveStatus, setSaveStatus] = useState<string>('已就绪');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Load data on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('paymentFormsData');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed) && parsed.length === 2) {
            setFormsData(parsed as [PaymentFormData, PaymentFormData]);
        }
      }

      const savedPayees = localStorage.getItem('payeeDb');
      if (savedPayees) {
        setPayeeDb(JSON.parse(savedPayees));
      }
    } catch (error) {
      console.error("Failed to load saved data", error);
    }
  }, []);

  // Auto-Save Effect
  useEffect(() => {
    setSaveStatus('保存中...');
    const timer = setTimeout(() => {
      localStorage.setItem('paymentFormsData', JSON.stringify(formsData));
      setSaveStatus('☁️ 已自动保存');
    }, 800);

    return () => clearTimeout(timer);
  }, [formsData]);

  // Logic to auto-save new payee info
  const checkAndSavePayee = (formData: PaymentFormData) => {
    const { payee, bankAccount, bankName } = formData;
    
    if (payee && bankAccount && bankName) {
      const exists = payeeDb.some(p => 
        p.收款单位 === payee && p.银行账号 === bankAccount
      );

      if (!exists) {
        const newPayee: PayeeInfo = {
          收款单位: payee,
          银行账号: bankAccount,
          开户行: bankName
        };
        const newDb = [...payeeDb, newPayee];
        setPayeeDb(newDb);
        localStorage.setItem('payeeDb', JSON.stringify(newDb));
        return true;
      }
    }
    return false;
  };

  // Handle "Generate Image" (Save to local)
  const handleGenerateImage = async () => {
    if (!printRef.current) return;
    
    // Check and save payees for both forms
    let savedNew = false;
    if (checkAndSavePayee(formsData[0])) savedNew = true;
    if (checkAndSavePayee(formsData[1])) savedNew = true;
    
    if (savedNew) {
      setSaveStatus('💾 已自动记录新收款人');
    }

    setSaveStatus('🚀 正在生成图片...');
    
    // BACKUP & CLEAR PLACEHOLDERS
    const inputs = printRef.current.querySelectorAll('input, textarea');
    const placeholders: { el: HTMLInputElement | HTMLTextAreaElement, val: string }[] = [];
    
    inputs.forEach((node) => {
        const el = node as HTMLInputElement | HTMLTextAreaElement;
        if (el.placeholder) {
            placeholders.push({ el, val: el.placeholder });
            el.placeholder = '';
        }
    });

    // BACKUP & HIDE NO-PRINT ELEMENTS (like the X button)
    // We strictly hide anything marked as 'no-print' before capturing
    const noPrintNodes = printRef.current.querySelectorAll('.no-print');
    const noPrintRestores: { el: HTMLElement, originalDisplay: string }[] = [];
    noPrintNodes.forEach((node) => {
        const el = node as HTMLElement;
        noPrintRestores.push({ el, originalDisplay: el.style.display });
        el.style.display = 'none';
    });

    try {
      // Capture the container that holds BOTH forms
      const canvas = await html2canvas(printRef.current, {
        scale: 3, 
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      // To make it print-ready for A4, we want to ensure the output image width maps to 210mm.
      const scale = 3; 
      const a4WidthPx = Math.floor(210 * 3.78 * scale);
      const a4HeightPx = Math.floor(297 * 3.78 * scale);

      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = a4WidthPx;
      finalCanvas.height = a4HeightPx;
      const ctx = finalCanvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");

      // Fill white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, a4WidthPx, a4HeightPx);

      // Scale to fit A4 width with margins
      const marginMm = 5;
      const marginPx = marginMm * 3.78 * scale;
      const usableWidthPx = a4WidthPx - (marginPx * 2);
      
      const sourceWidth = canvas.width;
      const sourceHeight = canvas.height;
      
      const drawScale = usableWidthPx / sourceWidth;
      const drawHeight = sourceHeight * drawScale;

      const yOffset = (a4HeightPx - drawHeight) / 2;

      ctx.drawImage(canvas, marginPx, yOffset, usableWidthPx, drawHeight);

      // Save
      const imgData = finalCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      
      // Construct filename with payee info
      const payeeStr = formsData[0].payee ? `_${formsData[0].payee.trim()}` : '';
      const dateStr = `${formsData[0].year}${formsData[0].month}${formsData[0].day}`;
      link.download = `付款申请单_A4双联${payeeStr}_${dateStr}.png`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSaveStatus('✅ 图片下载成功');
      setTimeout(() => setSaveStatus('已就绪'), 3000);
      
    } catch (error) {
      console.error('Image Generation Error:', error);
      setSaveStatus('❌ 生成失败');
      alert('图片生成遇到问题，请重试。');
    } finally {
        // RESTORE PLACEHOLDERS
        placeholders.forEach(({ el, val }) => {
            el.placeholder = val;
        });

        // RESTORE NO-PRINT ELEMENTS
        noPrintRestores.forEach(({ el, originalDisplay }) => {
            el.style.display = originalDisplay;
        });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<PayeeInfo>(sheet);

      if (jsonData.length > 0 && ('收款单位' in jsonData[0])) {
        setPayeeDb(jsonData);
        localStorage.setItem('payeeDb', JSON.stringify(jsonData));
        alert(`✅ 成功导入 ${jsonData.length} 条收款人信息！`);
      } else {
        alert('⚠️ Excel 格式不正确，缺少“收款单位”列');
      }
    } catch (error) {
      console.error("Error reading excel", error);
      alert('❌ 读取 Excel 失败');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFormChange = (index: 0 | 1, key: keyof PaymentFormData, value: string) => {
    setFormsData(prev => {
      const newForms = [...prev] as [PaymentFormData, PaymentFormData];
      const currentForm = newForms[index];
      const newData = { ...currentForm, [key]: value };
      
      if (key === 'amountNumeric') {
        const numVal = parseFloat(value);
        if (!isNaN(numVal) && value !== '') {
          newData.amountChinese = digitUppercase(numVal);
        } else if (value === '') {
           newData.amountChinese = '';
        }
      }

      // Logic for Payee interaction
      if (key === 'payee') {
          if (value && value.trim() !== '') {
              // Auto-fill date if it's currently empty
              if (!newData.year && !newData.month && !newData.day) {
                  const now = new Date();
                  newData.year = now.getFullYear().toString();
                  newData.month = (now.getMonth() + 1).toString();
                  newData.day = now.getDate().toString();
              }
          } else {
              // If Payee is cleared (empty), also clear Bank Info, Date, Amounts, Reason and Attachments
              newData.bankAccount = '';
              newData.bankName = '';
              newData.year = '';
              newData.month = '';
              newData.day = '';
              newData.amountChinese = '';
              newData.amountNumeric = '';
              newData.reason = '';
              newData.attachments = '';
          }
      }
      
      newForms[index] = newData;
      return newForms;
    });
  };

  const handlePayeeSelect = (index: 0 | 1, payee: PayeeInfo) => {
    setFormsData(prev => {
        const newForms = [...prev] as [PaymentFormData, PaymentFormData];
        const now = new Date();
        newForms[index] = {
            ...newForms[index],
            payee: payee.收款单位 || '',
            bankAccount: payee.银行账号 || '',
            bankName: payee.开户行 || '',
            year: now.getFullYear().toString(),
            month: (now.getMonth() + 1).toString(),
            day: now.getDate().toString(),
        };
        return newForms;
    });
  };
  
  const copyToSecond = () => {
      if(window.confirm("确定将第一张单据的内容复制到第二张吗？")) {
          setFormsData(prev => [prev[0], {...prev[0]}]);
      }
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-10 print:py-0 print:items-start print:justify-center">
      
      {/* Controls */}
      <div className="no-print mb-8 flex flex-col items-center gap-4 text-center w-full max-w-4xl relative z-50">
        <div className="flex items-center gap-4">
           <h1 className="text-2xl font-bold text-gray-800">付款申请单生成器 (A4双联版)</h1>
           <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full animate-pulse">
             {saveStatus}
           </span>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm text-blue-800 flex flex-col gap-2 w-full text-left shadow-sm">
            <p><strong>💡 双联模式：</strong>界面现在显示两张独立的表格。填写后可生成一张包含两份单据的 A4 图片。</p>
            <p><strong>💾 另存为图片：</strong>将当前两张单据保存为一张 A4 大小的图片，方便打印。<b>（提示语不会出现在图片中）</b></p>
            <p><strong>❌ 一键清除：</strong>点击“收款单位”输入框内的“❌”图标，可快速清除收款人、银行账号、日期、金额及附件信息。</p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".xlsx, .xls" 
            className="hidden" 
          />
          <button onClick={triggerFileUpload} className="control-btn bg-yellow-600 hover:bg-yellow-700">
            📂 导入库
          </button>
          
          <button onClick={copyToSecond} className="control-btn bg-green-600 hover:bg-green-700">
            ⬇️ 复制第一张到第二张
          </button>
          
           <button onClick={handleGenerateImage} className="control-btn bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-300">
            💾 另存为图片
          </button>

        </div>
      </div>

      {/* The Form Container - Displays 2 forms vertically */}
      <div className="print-container bg-white shadow-2xl print:shadow-none mb-10">
        <div ref={printRef} className="flex flex-col items-center bg-white p-8 gap-8">
            
            {/* Form 1 */}
            <div className="relative group/form">
                <div className="absolute -left-12 top-0 bottom-0 flex flex-col justify-between py-2 no-print">
                   <div className="text-gray-300 font-bold text-4xl opacity-50">1</div>
                </div>
                <PaymentForm 
                    data={formsData[0]} 
                    onChange={(k, v) => handleFormChange(0, k, v)} 
                    payeeOptions={payeeDb}
                    onPayeeSelect={(p) => handlePayeeSelect(0, p)}
                />
            </div>

            {/* Cut Line */}
            <div className="w-full border-t-2 border-dashed border-gray-400 relative my-2">
                 <div className="absolute left-0 -top-3 text-gray-400 text-xs flex items-center gap-1">
                    ✂️ <span className="tracking-widest">裁剪线</span>
                 </div>
                 <div className="absolute right-0 -top-3 text-gray-400 text-xs flex items-center gap-1">
                    <span className="tracking-widest">裁剪线</span> ✂️
                 </div>
            </div>

            {/* Form 2 */}
            <div className="relative group/form">
                <div className="absolute -left-12 top-0 bottom-0 flex flex-col justify-between py-2 no-print">
                   <div className="text-gray-300 font-bold text-4xl opacity-50">2</div>
                </div>
                <PaymentForm 
                    data={formsData[1]} 
                    onChange={(k, v) => handleFormChange(1, k, v)} 
                    payeeOptions={payeeDb}
                    onPayeeSelect={(p) => handlePayeeSelect(1, p)}
                />
            </div>

        </div>
      </div>
      
      <style>{`
        .control-btn {
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1.5rem;
            color: white;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transition: all 0.2s;
            font-weight: bold;
        }
        .control-btn:active {
            transform: scale(0.95);
        }
      `}</style>
    </div>
  );
};

export default App;