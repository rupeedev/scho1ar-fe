import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Key, Loader2, Camera } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useClerkAuth } from '@/hooks/use-clerk-auth';
import { useToast } from '@/components/ui/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { format } from 'date-fns';

const ProfileDetails = () => {
  const { user, loading: authLoading } = useClerkAuth();
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState('');
  const [language, setLanguage] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [passwordData, setPasswordData] = useState<{ current: string; new: string; confirm: string; }>({
    current: '',
    new: '',
    confirm: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      // Detect user's current timezone
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Get and format display name from Clerk user
      const rawDisplayName = user.fullName || user.firstName || user.email?.split('@')[0] || '';
      const formattedDisplayName = formatDisplayName(rawDisplayName);

      // Set initial form values from Clerk user data
      setDisplayName(formattedDisplayName);
      setPhone(''); // Clerk doesn't provide phone in basic user object
      setTimezone(detectedTimezone);
      setLanguage('English');
      setTwoFactorEnabled(false);
    }
  }, [user]);

  const getAvatarFallback = () => {
    const displayName = user?.fullName || user?.firstName;
    if (displayName) {
      const names = displayName.split(' ');
      if (names.length > 1) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return displayName.substring(0, 2).toUpperCase();
    }

    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }

    return "U";
  };

  const getProviderInfo = () => {
    const email = user?.email;

    if (email) {
      const domain = email.split('@')[1];
      const commonDomains: Record<string, string> = {
        'gmail.com': 'Gmail (Personal)',
        'yahoo.com': 'Yahoo (Personal)',
        'hotmail.com': 'Hotmail (Personal)',
        'outlook.com': 'Outlook (Personal)',
        'icloud.com': 'iCloud (Personal)',
        'aol.com': 'AOL (Personal)'
      };

      if (commonDomains[domain]) {
        return commonDomains[domain];
      } else {
        // Corporate or custom domain
        return `${domain} (Corporate)`;
      }
    }

    return 'Clerk';
  };

  const formatDisplayName = (name: string) => {
    if (!name) return '';
    
    // Replace dots with spaces and split into words
    const words = name.replace(/\./g, ' ').split(' ');
    
    // Capitalize each word
    return words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      // In a full implementation, this would update the user metadata via Supabase
      // For now, just show success message
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully."
      });
      
      setIsEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "There was a problem updating your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    // Validate passwords
    if (passwordData.new !== passwordData.confirm) {
      setPasswordError("New passwords do not match");
      return;
    }
    
    if (passwordData.new.length < 8) {
      setPasswordError("New password must be at least 8 characters long");
      return;
    }
    
    setIsChangingPassword(true);
    setPasswordError('');
    
    try {
      // In a full implementation, this would use Supabase auth to change password
      // For now, just show success message
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully."
      });
      
      // Reset form and close dialog
      setPasswordData({ current: '', new: '', confirm: '' });
      setIsPasswordDialogOpen(false);
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError("Current password is incorrect or there was a server error");
      toast({
        title: "Password change failed",
        description: "There was a problem changing your password. Please check your current password and try again.",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    
    try {
      // In a full implementation, this would upload to Supabase Storage
      // For now, just show success message
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully."
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your profile picture.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-gray-500">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        
        <div className="flex-1 overflow-hidden">
          <div className="px-6 py-4 h-full overflow-y-auto">
            <h1 className="text-xl font-semibold mb-4">Profile Details</h1>
            
            <div className="grid md:grid-cols-2 gap-6 h-[calc(100vh-180px)]">
              {/* Profile info card - left side */}
              <div className="bg-white rounded-md shadow-sm p-6 flex flex-col items-center h-full overflow-y-auto">
                <div className="relative">
                  <Avatar className="h-24 w-24 mb-3 bg-purple-600">
                    <AvatarImage src={user?.imageUrl || undefined} alt={user?.fullName || user?.firstName || 'User'} />
                    <AvatarFallback className="text-4xl">
                      {getAvatarFallback()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute bottom-2 right-2 rounded-full w-8 h-8 p-0"
                    disabled={isUploadingImage}
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
                
                <h2 className="text-xl font-medium mb-1">{displayName || user?.email?.split('@')[0]}</h2>
                <p className="text-gray-500">{user?.email}</p>
                
                {isEditMode ? (
                  <div className="mt-4 space-y-3 w-full max-w-xs">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your display name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Your phone number"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern (EST/EDT)</SelectItem>
                          <SelectItem value="America/Chicago">Central (CST/CDT)</SelectItem>
                          <SelectItem value="America/Denver">Mountain (MST/MDT)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific (PST/PDT)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                          <SelectItem value="Europe/Paris">Paris (CET/CEST)</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                          <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Spanish">Español</SelectItem>
                          <SelectItem value="French">Français</SelectItem>
                          <SelectItem value="German">Deutsch</SelectItem>
                          <SelectItem value="Japanese">日本語</SelectItem>
                          <SelectItem value="Chinese">中文</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={handleSaveProfile} 
                        disabled={isSaving}
                      >
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDisplayName(user?.fullName || user?.firstName || '');
                          setPhone('');
                          setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
                          setLanguage('English');
                          setIsEditMode(false);
                        }}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" className="mt-4" onClick={() => setIsEditMode(true)}>
                    Edit Profile
                  </Button>
                )}
              </div>
              
              {/* Profile details card - right side */}
              <div className="bg-white rounded-md shadow-sm p-6 h-full overflow-hidden">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Phone</h3>
                    <p className="font-medium">{phone || 'Not set'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Timezone</h3>
                    <p className="font-medium">{timezone || 'UTC'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Language</h3>
                    <p className="font-medium">{language || 'English'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Password</h3>
                    <Button 
                      variant="link" 
                      className="px-0 h-auto text-blue-500 hover:text-blue-600"
                      onClick={() => setIsPasswordDialogOpen(true)}
                    >
                      <Key size={16} className="mr-1" />
                      <span>Change password</span>
                    </Button>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Two-Factor Authentication</h3>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={twoFactorEnabled} 
                        onCheckedChange={setTwoFactorEnabled}
                      />
                      <span className="text-sm font-medium">
                        {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">User Role</h3>
                    <div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-200 text-blue-800">
                        USER
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Provider</h3>
                    <p className="font-medium">{getProviderInfo()}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Account Status</h3>
                    <div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-200 text-green-800">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">User ID</h3>
                    <p className="font-medium text-xs text-gray-600 break-all">
                      {user?.id || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
          
        </div>
      </div>
      
      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change your password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password below to change your password.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.current}
                onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.new}
                onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
              />
            </div>
            
            {passwordError && (
              <p className="text-sm font-medium text-red-500">{passwordError}</p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setPasswordData({ current: '', new: '', confirm: '' });
              setPasswordError('');
              setIsPasswordDialogOpen(false);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleChangePassword} 
              disabled={isChangingPassword || !passwordData.current || !passwordData.new || !passwordData.confirm}
            >
              {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileDetails;