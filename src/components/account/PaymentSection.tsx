
import React, { useState } from 'react';
import { Pencil, CreditCard } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Payment {
  type: string;
  last4: string;
}

interface PaymentSectionProps {
  payment: Payment;
  setPayment: React.Dispatch<React.SetStateAction<Payment>>;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({ payment, setPayment }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tempPayment, setTempPayment] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, you would handle the payment update logic here
    setPayment({
      type: 'Visa', // This would be determined by the card number
      last4: tempPayment.cardNumber.slice(-4)
    });
    setIsDialogOpen(false);
    setTempPayment({
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: ''
    });
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium">Payment Method</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsDialogOpen(true)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="h-10 w-14 bg-gray-100 rounded flex items-center justify-center">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <p className="font-medium">{payment.type} •••• {payment.last4}</p>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Payment Method</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={tempPayment.cardNumber}
                  onChange={(e) => setTempPayment({...tempPayment, cardNumber: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="cardName">Name on Card</Label>
                <Input
                  id="cardName"
                  placeholder="John Doe"
                  value={tempPayment.cardName}
                  onChange={(e) => setTempPayment({...tempPayment, cardName: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/YY"
                    value={tempPayment.expiryDate}
                    onChange={(e) => setTempPayment({...tempPayment, expiryDate: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={tempPayment.cvv}
                    onChange={(e) => setTempPayment({...tempPayment, cvv: e.target.value})}
                  />
                </div>
              </div>
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Payment Method
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
