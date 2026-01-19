
import React, { useState } from 'react';
import { Pencil, Loader2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

interface AddressSectionProps {
  title: string;
  address: Address;
  setAddress: (address: Address) => void;
  showSameAsBilling?: boolean;
  onSameAsBilling?: () => void;
  isSaving?: boolean;
}

export const AddressSection: React.FC<AddressSectionProps> = ({ 
  title, 
  address, 
  setAddress,
  showSameAsBilling = false,
  onSameAsBilling,
  isSaving = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempAddress, setTempAddress] = useState<Address>({ ...address });
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!tempAddress.street.trim()) {
      newErrors.street = "Street address is required";
    }
    
    if (!tempAddress.city.trim()) {
      newErrors.city = "City is required";
    }
    
    if (!tempAddress.state.trim()) {
      newErrors.state = "State is required";
    }
    
    if (!tempAddress.zip.trim()) {
      newErrors.zip = "ZIP code is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (sameAsBilling && showSameAsBilling && onSameAsBilling) {
      onSameAsBilling();
      setIsEditing(false);
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setAddress(tempAddress);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setTempAddress({ ...address });
    setSameAsBilling(false);
    setErrors({});
    setIsEditing(false);
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium">{title}</h2>
          {!isEditing && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              disabled={isSaving}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            {showSameAsBilling && (
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox 
                  id="sameAsBilling" 
                  checked={sameAsBilling}
                  onCheckedChange={(checked) => {
                    setSameAsBilling(checked as boolean);
                  }}
                />
                <label 
                  htmlFor="sameAsBilling" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Same as billing address
                </label>
              </div>
            )}
            
            <div>
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={tempAddress.street}
                onChange={(e) => setTempAddress({...tempAddress, street: e.target.value})}
                disabled={(showSameAsBilling && sameAsBilling) || isSaving}
                className={errors.street ? "border-red-500" : ""}
              />
              {errors.street && (
                <p className="text-sm text-red-500 mt-1">{errors.street}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={tempAddress.city}
                  onChange={(e) => setTempAddress({...tempAddress, city: e.target.value})}
                  disabled={(showSameAsBilling && sameAsBilling) || isSaving}
                  className={errors.city ? "border-red-500" : ""}
                />
                {errors.city && (
                  <p className="text-sm text-red-500 mt-1">{errors.city}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={tempAddress.state}
                  onChange={(e) => setTempAddress({...tempAddress, state: e.target.value})}
                  disabled={(showSameAsBilling && sameAsBilling) || isSaving}
                  className={errors.state ? "border-red-500" : ""}
                />
                {errors.state && (
                  <p className="text-sm text-red-500 mt-1">{errors.state}</p>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                value={tempAddress.zip}
                onChange={(e) => setTempAddress({...tempAddress, zip: e.target.value})}
                disabled={(showSameAsBilling && sameAsBilling) || isSaving}
                className={errors.zip ? "border-red-500" : ""}
              />
              {errors.zip && (
                <p className="text-sm text-red-500 mt-1">{errors.zip}</p>
              )}
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : 'Save Address'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-1">
            {address.street ? (
              <>
                <p>{address.street}</p>
                <p>{address.city}, {address.state} {address.zip}</p>
                {address.country && <p>{address.country}</p>}
              </>
            ) : (
              <p className="text-gray-500">No address provided</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
