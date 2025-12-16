import React, { useState, useRef, useEffect } from 'react';
import { XCircle } from 'lucide-react';

export interface PayeeInfo {
  收款单位: string;
  银行账号: string;
  开户行: string;
}

export interface PaymentFormData {
  dept: string;
  year: string;
  month: string;
  day: string;
  serial: string;
  payee: string;
  bankAccount: string;
  bankName: string;
  amountChinese: string;
  reason: string;
  attachments: string;
  amountNumeric: string;
  leader: string;
  financeManager: string;
  deptManager: string;
  operator: string;
  accountant: string;
  bookkeeper: string;
  reviewer: string;
  cashier: string;
  maker: string;
  receiver: string;
}

export const initialFormData: PaymentFormData = {
  dept: '',
  year: '',
  month: '',
  day: '',
  serial: '',
  payee: '',
  bankAccount: '',
  bankName: '',
  amountChinese: '',
  reason: '',
  attachments: '',
  amountNumeric: '',
  leader: '',
  financeManager: '',
  deptManager: '',
  operator: '',
  accountant: '',
  bookkeeper: '',
  reviewer: '',
  cashier: '',
  maker: '',
  receiver: '',
};

interface PaymentFormProps {
  data: PaymentFormData;
  onChange: (key: keyof PaymentFormData, value: string) => void;
  payeeOptions?: PayeeInfo[];
  onPayeeSelect?: (payee: PayeeInfo) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ data, onChange, payeeOptions = [], onPayeeSelect }) => {
  // State for Dropdown
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<PayeeInfo[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePayeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onChange('payee', value);
    
    if (value && payeeOptions.length > 0) {
      const matches = payeeOptions.filter(p => 
        p.收款单位 && p.收款单位.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(matches);
      setShowDropdown(matches.length > 0);
    } else {
      setShowDropdown(false);
    }
  };

  const handlePayeeFocus = () => {
    if (data.payee && payeeOptions.length > 0) {
       const matches = payeeOptions.filter(p => 
        p.收款单位 && p.收款单位.toLowerCase().includes(data.payee.toLowerCase())
      );
      setFilteredOptions(matches);
      setShowDropdown(matches.length > 0);
    }
  };

  const handleOptionClick = (option: PayeeInfo) => {
    if (onPayeeSelect) {
      onPayeeSelect(option);
    } else {
      onChange('payee', option.收款单位);
    }
    setShowDropdown(false);
  };

  const containerStyle = {
    width: '240mm',
    height: '140mm',
    padding: '10mm',
    boxSizing: 'border-box' as const,
    position: 'relative' as const,
  };

  // Base input class for main table
  const inputClass = "w-full h-full bg-transparent outline-none text-blue-700 print:text-black transition-colors";
  
  // Style for Footer Inputs (distinct from main table)
  const footerInputClass = "w-20 bg-white border-b border-gray-400 text-center text-sm px-1 outline-none text-blue-700 print:text-black h-7";

  // Label Cell Style - Unified for perfect centering
  const labelCellStyle = "w-24 flex items-center justify-center border-r border-black font-medium text-lg p-1 flex-shrink-0 text-black";

  // Helper Component for Top Row Inputs
  // Reduced height from h-14 to h-12 to save vertical space
  const TopInput = ({ width, value, fieldName }: { width: string, value: string, fieldName: keyof PaymentFormData }) => (
    <div style={{ width }} className="flex flex-col justify-end border-b border-gray-400 h-12 px-1">
      <input 
        type="text" 
        className="w-full bg-transparent outline-none text-center text-blue-700 print:text-black pb-1 text-xl leading-normal font-medium"
        value={value}
        onChange={(e) => onChange(fieldName, e.target.value)}
      />
    </div>
  );

  return (
    <div style={containerStyle} className="relative bg-white text-black text-sm">
      {/* Sidebar Text */}
      <div className="absolute left-2 top-0 bottom-0 flex items-center justify-center w-8">
        <div 
          className="text-[10px] text-gray-500 tracking-widest whitespace-nowrap transform -rotate-90 origin-center"
          style={{ fontFamily: 'sans-serif' }}
        >
          金蝶统一会计凭证系列 (SX103-F) &nbsp;&nbsp;&nbsp; 金蝶妙想互联公司承印
        </div>
      </div>

      <div className="ml-6 h-full flex flex-col justify-between">
        
        {/* Header - Reduced padding to save space */}
        <div className="flex flex-col items-center mb-2">
          <h1 className="text-3xl font-bold tracking-[1rem] border-b-2 border-black pb-4 mb-1">付款申请单</h1>
          <div className="w-64 h-[2px] bg-black"></div>
        </div>

        {/* Date and Meta Row */}
        <div className="flex justify-between items-end mb-1 px-1 whitespace-nowrap">
          <div className="flex items-end gap-1">
            <span className="text-lg font-medium flex-shrink-0 mb-2">申请部门：</span>
            <TopInput width="10rem" value={data.dept} fieldName="dept" />
          </div>
          
          <div className="flex items-end gap-1 mx-2">
            <TopInput width="4rem" value={data.year} fieldName="year" />
            <span className="text-lg mb-2">年</span>
            <TopInput width="3rem" value={data.month} fieldName="month" />
            <span className="text-lg mb-2">月</span>
            <TopInput width="3rem" value={data.day} fieldName="day" />
            <span className="text-lg mb-2">日</span>
          </div>

          <div className="flex items-end gap-1">
            <span className="text-lg font-medium flex-shrink-0 mb-2">编号：</span>
            <TopInput width="6rem" value={data.serial} fieldName="serial" />
          </div>
        </div>

        {/* Main Table */}
        <div className="border-2 border-black flex-grow flex flex-col">
          
          {/* Row 1: Payee Info - 58% height */}
          <div className="flex border-b border-black h-[58%]">
            
            <div className="w-[65%] flex flex-col border-r border-black">
              
              {/* Payee Row */}
              <div className="flex h-1/4 border-b border-black relative" ref={dropdownRef}>
                <div className={labelCellStyle}>
                  收款单位
                </div>
                <div className="flex-1 p-1 relative flex items-center group">
                  <input 
                    type="text" 
                    className={`${inputClass} text-lg px-2 pr-8`}
                    value={data.payee}
                    onChange={handlePayeeChange}
                    onFocus={handlePayeeFocus}
                    autoComplete="off"
                  />
                  
                  {/* Clear Button (X) */}
                  {data.payee && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent closing dropdown if open
                            onChange('payee', ''); // Clear payee, triggers parent cleanup of bank info
                            setShowDropdown(false);
                        }}
                        className="absolute right-2 text-gray-300 hover:text-red-500 no-print transition-colors p-1"
                        title="一键清空收款信息"
                    >
                        <XCircle size={18} />
                    </button>
                  )}

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div className="absolute top-full left-0 w-full bg-white border border-gray-300 shadow-lg z-50 max-h-40 overflow-y-auto no-print">
                      {filteredOptions.map((option, idx) => (
                        <div 
                          key={idx}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 text-sm"
                          onClick={() => handleOptionClick(option)}
                        >
                          <div className="font-bold text-gray-800">{option.收款单位}</div>
                          <div className="text-xs text-gray-500">{option.开户行} - {option.银行账号}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bank Account */}
              <div className="flex h-1/4 border-b border-black">
                <div className={labelCellStyle}>
                  银行账号
                </div>
                <div className="flex-1 p-1 flex items-center">
                   <input 
                    type="text" 
                    className={`${inputClass} text-lg px-2 tracking-wide`}
                    value={data.bankAccount}
                    onChange={(e) => onChange('bankAccount', e.target.value)}
                   />
                </div>
              </div>

              {/* Bank Name */}
              <div className="flex h-1/4 border-b border-black">
                <div className={labelCellStyle}>
                  <span className="tracking-[0.5em]">开户行</span>
                </div>
                <div className="flex-1 p-1 flex items-center">
                   <input 
                    type="text" 
                    className={`${inputClass} text-lg px-2`}
                    value={data.bankName}
                    onChange={(e) => onChange('bankName', e.target.value)}
                   />
                </div>
              </div>

               {/* Amount (Chinese) */}
               <div className="flex h-1/4 relative">
                <div className={`${labelCellStyle} bg-white z-10`}>
                  <span className="tracking-[1em] mr-[-1em]">金额</span>
                </div>
                <div className="flex-1 relative flex items-center">
                  <input 
                    type="text" 
                    className={`${inputClass} text-lg px-2 relative z-20`} 
                    placeholder="自动生成大写金额"
                    value={data.amountChinese}
                    onChange={(e) => onChange('amountChinese', e.target.value)}
                  />
                </div>
              </div>

            </div>

            {/* Reason */}
            <div className="flex-1 flex flex-col">
              <div className="h-12 flex items-center justify-center font-medium text-lg tracking-widest border-b-0 pt-2 flex-shrink-0">
                付款原因
              </div>
              <textarea 
                className={`flex-1 ${inputClass} p-2 resize-none text-base leading-relaxed text-center`}
                value={data.reason}
                onChange={(e) => onChange('reason', e.target.value)}
              ></textarea>
            </div>

          </div>

          {/* Row 2: Attachments - 15% height */}
          <div className="flex border-b border-black h-[15%]">
            <div className={labelCellStyle}>
              <span className="tracking-[1em] mr-[-1em]">附件</span>
            </div>
            <div className="w-32 flex items-center border-r border-black p-1 relative flex-shrink-0">
                <input 
                  type="text" 
                  className={`${inputClass} text-right px-6 text-lg`}
                  value={data.attachments}
                  onChange={(e) => onChange('attachments', e.target.value)}
                />
                <span className="absolute right-2 text-lg text-black">张</span>
            </div>
            <div className="w-12 flex items-center justify-center border-r border-black font-bold text-2xl bg-gray-50 flex-shrink-0">
              ¥
            </div>
            <div className="flex-1 striped-bg relative flex items-center">
               <input 
                type="text" 
                className={`${inputClass} text-xl px-2 tracking-widest font-mono font-bold`}
                value={data.amountNumeric}
                onChange={(e) => onChange('amountNumeric', e.target.value)}
                placeholder="在此输入数字"
               />
            </div>
          </div>

          {/* Row 3: Unit Leader Headers - Increased to 12% height to fit text */}
          <div className="flex border-b border-black h-[12%]">
             <div className="flex-1 border-r border-black flex items-center justify-center text-lg font-medium">
               单位领导
             </div>
             <div className="flex-1 border-r border-black flex items-center justify-center text-lg font-medium">
               财务主管
             </div>
             <div className="flex-1 border-r border-black flex items-center justify-center text-lg font-medium">
               部门主管
             </div>
             <div className="flex-1 flex items-center justify-center text-lg font-medium">
               经 办 人
             </div>
          </div>

          {/* Row 4: Signatures - Remaining height (approx 15%) */}
          <div className="flex flex-1">
             <div className="flex-1 border-r border-black p-1 flex items-center">
                <input 
                  type="text" 
                  className={`${inputClass} text-center font-cursive text-xl`}
                  value={data.leader}
                  onChange={(e) => onChange('leader', e.target.value)}
                />
             </div>
             <div className="flex-1 border-r border-black p-1 flex items-center">
                <input 
                  type="text" 
                  className={`${inputClass} text-center text-xl`}
                  value={data.financeManager}
                  onChange={(e) => onChange('financeManager', e.target.value)}
                />
             </div>
             <div className="flex-1 border-r border-black p-1 flex items-center">
                <input 
                  type="text" 
                  className={`${inputClass} text-center text-xl`}
                  value={data.deptManager}
                  onChange={(e) => onChange('deptManager', e.target.value)}
                />
             </div>
             <div className="flex-1 p-1 flex items-center">
                <input 
                  type="text" 
                  className={`${inputClass} text-center text-xl`}
                  value={data.operator}
                  onChange={(e) => onChange('operator', e.target.value)}
                />
             </div>
          </div>

        </div>

        {/* Footer - Reduced height to h-10 to save space */}
        <div className="mt-1 h-10 hatched-bg flex items-center text-sm border-t border-gray-300">
           <div className="flex-1 flex justify-center items-center gap-1">
             <span className="font-medium flex-shrink-0 text-base">会计主管</span>
             <input 
              type="text" 
              className={footerInputClass}
              value={data.accountant}
              onChange={(e) => onChange('accountant', e.target.value)}
            />
           </div>
           <div className="flex-1 flex justify-center items-center gap-1">
             <span className="font-medium flex-shrink-0 text-base">记账</span>
             <input 
              type="text" 
              className={footerInputClass}
              value={data.bookkeeper}
              onChange={(e) => onChange('bookkeeper', e.target.value)}
             />
           </div>
           <div className="flex-1 flex justify-center items-center gap-1">
             <span className="font-medium flex-shrink-0 text-base">复核</span>
             <input 
              type="text" 
              className={footerInputClass}
              value={data.reviewer}
              onChange={(e) => onChange('reviewer', e.target.value)}
             />
           </div>
           <div className="flex-1 flex justify-center items-center gap-1">
             <span className="font-medium flex-shrink-0 text-base">出纳</span>
             <input 
              type="text" 
              className={footerInputClass}
              value={data.cashier}
              onChange={(e) => onChange('cashier', e.target.value)}
             />
           </div>
           <div className="flex-1 flex justify-center items-center gap-1">
             <span className="font-medium flex-shrink-0 text-base">制单</span>
             <input 
              type="text" 
              className={footerInputClass}
              value={data.maker}
              onChange={(e) => onChange('maker', e.target.value)}
             />
           </div>
           <div className="flex-1 flex justify-center items-center gap-1">
             <span className="font-medium flex-shrink-0 text-base">签收</span>
             <input 
              type="text" 
              className={footerInputClass}
              value={data.receiver}
              onChange={(e) => onChange('receiver', e.target.value)}
             />
           </div>
        </div>

      </div>
    </div>
  );
};

export default PaymentForm;