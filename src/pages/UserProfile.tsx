import React, { useEffect, useState } from "react";
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usersApi, UserProfile as UserProfileType } from "@/lib/api/users";
import { useToast } from "@/components/ui/use-toast";

const UserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      setLoading(true);
      
      try {
        // Use the API client to get user profile
        const userProfile = await usersApi.getUserProfile();
        setProfile({
          ...userProfile,
          display_name: user.display_name || user.email?.split('@')[0] || 'User',
          email: user.email,
          avatar_url: user.avatar_url
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast({
          title: "Error loading profile",
          description: "There was a problem loading your profile. Please try again.",
          variant: "destructive"
        });
        
        // Fallback to basic user data
        if (user) {
          setProfile({
            display_name: user.display_name || user.email?.split('@')[0] || 'User',
            email: user.email,
            avatar_url: user.avatar_url
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [user, toast]);
  
  const getAvatarFallback = () => {
    if (profile?.display_name) {
      const names = profile.display_name.split(' ');
      if (names.length > 1) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return profile.display_name.substring(0, 2).toUpperCase();
    }
    
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    
    return "U";
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-semibold mb-6">User Profile</h1>
            
            <div className="flex gap-6 lg:flex-row flex-col">
              {/* Left sidebar */}
              <div className="w-full lg:w-64">
                <Card className="mb-4">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-medium mb-1">Account</h2>
                    <p className="text-sm text-gray-500 mb-4">Manage your account info.</p>
                    
                    <Tabs defaultValue="profile" orientation="vertical" className="w-full">
                      <TabsList className="flex flex-col items-stretch h-auto bg-transparent space-y-1">
                        <TabsTrigger 
                          value="profile" 
                          className="justify-start text-left py-2 px-3 data-[state=active]:bg-gray-100"
                        >
                          <UserIcon className="w-4 h-4 mr-2" />
                          Profile
                        </TabsTrigger>
                        <TabsTrigger 
                          value="security" 
                          className="justify-start text-left py-2 px-3 data-[state=active]:bg-gray-100"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Security
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </CardContent>
                </Card>
                
                <div className="rounded-md bg-gray-50 border p-4 text-center text-xs text-gray-500">
                  Powered by
                  <div className="h-4 mx-auto my-1 font-semibold text-sm">API Client</div>
                  <div className="mt-2 text-orange-500 font-medium">Development mode</div>
                </div>
              </div>
              
              {/* Right content area */}
              <div className="flex-1">
                <Card>
                  <CardContent className="p-6">
                    <Tabs defaultValue="profile" className="w-full">
                      <TabsList className="w-full mb-6 bg-gray-100">
                        <TabsTrigger value="profile" className="flex-1">Profile details</TabsTrigger>
                      </TabsList>
                      
                      {loading ? (
                        <div className="py-8 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                          <p className="mt-2 text-gray-500">Loading profile...</p>
                        </div>
                      ) : (
                        <TabsContent value="profile" className="space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-16 w-16">
                                <AvatarImage src={profile?.avatar_url} />
                                <AvatarFallback className="text-lg">
                                  {getAvatarFallback()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-lg font-medium">{profile?.display_name || user?.email}</div>
                              </div>
                            </div>
                            <Button 
                              variant="outline"
                              onClick={() => {
                                toast({
                                  title: "Coming soon",
                                  description: "Profile update functionality is coming soon."
                                });
                              }}
                            >
                              Update profile
                            </Button>
                          </div>
                          
                          <div className="border-t pt-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-3">
                              <div className="font-medium">Username</div>
                              <div className="flex gap-4 items-center">
                                <span>{profile?.display_name || user?.email?.split('@')[0]}</span>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    toast({
                                      title: "Coming soon",
                                      description: "Username update functionality is coming soon."
                                    });
                                  }}
                                >
                                  Update username
                                </Button>
                              </div>
                            </div>
                            
                            <div className="border-t">
                              <div className="py-4">
                                <div className="font-medium mb-2">Email addresses</div>
                                <div className="flex justify-between items-center py-2">
                                  <div className="flex items-center">
                                    <span>{user?.email}</span>
                                    <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                                      Primary
                                    </span>
                                  </div>
                                  <Button variant="ghost" size="sm" className="text-gray-400">
                                    ...
                                  </Button>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="mt-2"
                                  onClick={() => {
                                    toast({
                                      title: "Coming soon",
                                      description: "Adding email addresses functionality is coming soon."
                                    });
                                  }}
                                >
                                  + Add email address
                                </Button>
                              </div>
                            </div>
                            
                            <div className="border-t py-4">
                              <div className="font-medium mb-2">Connected accounts</div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  toast({
                                    title: "Coming soon",
                                    description: "Connect account functionality is coming soon."
                                  });
                                }}
                              >
                                + Connect account
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                      )}
                      
                      <TabsContent value="security">
                        <div className="space-y-4">
                          <h2 className="text-xl font-semibold">Security Settings</h2>
                          <p className="text-gray-500">Manage your security preferences.</p>
                          
                          <div className="border-t pt-4 mt-4">
                            <div className="font-medium mb-2">Password</div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "Coming soon",
                                  description: "Password change functionality is coming soon."
                                });
                              }}
                            >
                              Change password
                            </Button>
                          </div>
                          
                          <div className="border-t pt-4 mt-4">
                            <div className="font-medium mb-2">Two-factor authentication</div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "Coming soon",
                                  description: "2FA functionality is coming soon."
                                });
                              }}
                            >
                              Enable 2FA
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;