
import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface User {
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
}

interface ProfileSectionProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ user, setUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempUser, setTempUser] = useState<User>({ ...user });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUser(tempUser);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setTempUser({ ...user });
    setIsEditing(false);
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium">Profile</h2>
          {!isEditing && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-2">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {isEditing && (
              <Button variant="ghost" size="sm" className="text-blue-600">
                Change Photo
              </Button>
            )}
          </div>
          
          {isEditing ? (
            <form onSubmit={handleSubmit} className="flex-1 space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={tempUser.name}
                  onChange={(e) => setTempUser({...tempUser, name: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={tempUser.email}
                  onChange={(e) => setTempUser({...tempUser, email: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={tempUser.phone}
                  onChange={(e) => setTempUser({...tempUser, phone: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex-1 space-y-2">
              <div>
                <span className="text-sm text-gray-500">Full Name</span>
                <p>{user.name}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Email</span>
                <p>{user.email}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Phone</span>
                <p>{user.phone}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
