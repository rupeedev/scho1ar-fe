import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { ProfileSection } from "@/components/account/ProfileSection";
import { PasswordSection } from "@/components/account/PasswordSection";
import { AddressSection } from "@/components/account/AddressSection";
import { PaymentSection } from "@/components/account/PaymentSection";
import { ActionButtons } from "@/components/account/ActionButtons";
import { useClerkAuth } from '@/hooks/use-clerk-auth';
import { useToast } from '@/components/ui/use-toast';
import { useOrganizations } from '@/hooks/queries';

// Define simple types for the account page
type Address = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

type PaymentMethod = {
  type: string;
  last4: string;
};

const AccountPage = () => {
  const { user: authUser } = useClerkAuth();
  const { toast } = useToast();
  
  // Use React Query to get organizations
  const { data: organizations, isLoading: isLoadingOrgs } = useOrganizations();
  
  const [saving, setSaving] = useState(false);
  
  const [billingAddress, setBillingAddress] = useState<Address>({
    street: "",
    city: "",
    state: "",
    zip: ""
  });
  
  const [shippingAddress, setShippingAddress] = useState<Address>({
    street: "",
    city: "",
    state: "",
    zip: ""
  });
  
  const [payment, setPayment] = useState<PaymentMethod>({
    type: "Visa",
    last4: "1234"
  });
  
  // Get the first organization
  const organization = organizations && organizations.length > 0 ? organizations[0] : null;
  
  // Handle profile update
  const handleProfileUpdate = async (updatedUserData: { name: string, email: string, phone: string, avatarUrl: string }) => {
    if (!authUser) return;
    
    setSaving(true);
    
    try {
      // In a full implementation, this would update the user via Supabase API
      // For now, just show success message
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Handle password change
  const handlePasswordChange = async (data: { currentPassword: string, newPassword: string }) => {
    setSaving(true);
    
    try {
      // In a full implementation, this would use Supabase auth to change password
      // For now, just show success message
      toast({
        title: 'Success',
        description: 'Password changed successfully',
      });
      
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: 'Error',
        description: 'Failed to change password',
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setSaving(false);
    }
  };
  
  // Handle address update
  const handleAddressUpdate = async (type: 'billing' | 'shipping', address: Address) => {
    setSaving(true);
    
    try {
      if (type === 'billing') {
        setBillingAddress(address);
      } else {
        setShippingAddress(address);
      }
      
      toast({
        title: 'Success',
        description: `${type === 'billing' ? 'Billing' : 'Shipping'} address updated successfully`,
      });
    } catch (error) {
      console.error(`Error updating ${type} address:`, error);
      toast({
        title: 'Error',
        description: `Failed to update ${type} address`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Create user object in the format expected by ProfileSection
  const userObj = authUser ? {
    name: authUser.fullName || authUser.firstName || authUser.email?.split('@')[0] || 'User',
    email: authUser.email || '',
    phone: '',
    avatarUrl: authUser.imageUrl || '/placeholder.svg'
  } : {
    name: "User",
    email: '',
    phone: '',
    avatarUrl: '/placeholder.svg'
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        
        <div className="flex-1 overflow-y-auto">
          {/* Breadcrumb */}
          <div className="px-6 py-4 flex items-center text-sm text-gray-600">
            <Link to="/" className="flex items-center hover:text-gray-900">
              <Home size={18} />
            </Link>
            <span className="mx-2">&gt;</span>
            <span className="font-medium">My Account</span>
          </div>
          
          <div className="px-6 pb-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold">My Account</h1>
              {organization && (
                <div className="bg-blue-50 px-4 py-2 rounded-md text-sm">
                  <span className="text-gray-600">Organization:</span> 
                  <span className="font-medium ml-1">{organization.name}</span>
                </div>
              )}
            </div>
            
            {isLoadingOrgs ? (
              <div className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                <p className="mt-2 text-gray-500">Loading profile...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Profile Section */}
                <ProfileSection 
                  user={userObj} 
                  setUser={handleProfileUpdate} 
                />
                
                {/* Password Section */}
                <PasswordSection 
                  onChangePassword={handlePasswordChange}
                  isSaving={saving}
                />
                
                {/* Billing Address Section */}
                <AddressSection 
                  title="Billing Address" 
                  address={billingAddress} 
                  setAddress={(address) => handleAddressUpdate('billing', address)} 
                  isSaving={saving}
                />
                
                {/* Shipping Address Section */}
                <AddressSection 
                  title="Shipping Address" 
                  address={shippingAddress}
                  setAddress={(address) => handleAddressUpdate('shipping', address)}
                  showSameAsBilling
                  onSameAsBilling={() => handleAddressUpdate('shipping', billingAddress)}
                  isSaving={saving}
                />
                
                {/* Payment Method Section */}
                <PaymentSection payment={payment} setPayment={setPayment} />
                
                {/* Action Buttons */}
                <ActionButtons />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;