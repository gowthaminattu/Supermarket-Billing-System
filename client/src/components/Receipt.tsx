import React from 'react';
import type { CartItem, Payment } from '../types';

interface ReceiptProps {
  invoiceNo: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  change: number;
  payments: Payment[];
  cashierName?: string;
  customerName?: string;
  date?: Date;
  branchName?: string;
}

const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({
  invoiceNo, items = [], subtotal = 0, tax = 0, discount = 0, total = 0, change = 0, payments = [],
  cashierName = 'Staff', customerName, date = new Date(), branchName = 'Main Branch'
}, ref) => {
  return (
    <div ref={ref} className="p-4 bg-white text-black font-mono text-sm max-w-[300px] mx-auto hidden print:block" id="printable-receipt">
      <div className="text-center mb-4 border-b border-dashed border-gray-400 pb-2">
        <img src="/logo.png" alt="ShopPOS Logo" className="w-12 h-12 mx-auto mb-2 grayscale" />
        <h2 className="text-xl font-bold uppercase">{branchName}</h2>
        <p className="text-xs">Thank you for shopping with us!</p>
        <p className="text-xs mt-1">Invoice: {invoiceNo}</p>
        <p className="text-xs">Date: {date.toLocaleString()}</p>
        <p className="text-xs">Cashier: {cashierName}</p>
        {customerName && <p className="text-xs mt-1">Customer: {customerName}</p>}
      </div>

      <table className="w-full text-xs mb-4">
        <thead>
          <tr className="border-b border-dashed border-gray-400">
            <th className="text-left py-1 w-1/2">Item</th>
            <th className="text-right py-1 w-1/6">Qty</th>
            <th className="text-right py-1 w-1/3">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-1 truncate pr-1">{item.name}</td>
              <td className="text-right py-1">{item.quantity}</td>
              <td className="text-right py-1">{(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-gray-400 pt-2 space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax (5%):</span>
          <span>{tax.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-{discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm mt-2 border-t border-b border-dashed border-gray-400 py-1">
          <span>Total:</span>
          <span>{total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-2 space-y-1 text-xs">
        <div className="font-bold">Payments:</div>
        {payments.map((p, i) => (
          <div key={i} className="flex justify-between pl-2">
            <span>{p.method}</span>
            <span>{p.amount.toFixed(2)}</span>
          </div>
        ))}
        {change > 0 && (
          <div className="flex justify-between pl-2 font-bold mt-1">
            <span>Change:</span>
            <span>{change.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="text-center mt-6 text-xs text-gray-500">
        <p>*** PLEASE COME AGAIN ***</p>
        <svg id="barcode" className="w-full h-12 mt-2"></svg>
      </div>
    </div>
  );
});

export default Receipt;
