import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  Trash2, 
  Mail, 
  Loader2, 
  Users as UsersIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  organizationsApi, 
  usersApi, 
  User, 
  UserRole, 
  UserStatus, 
  CreateUserDto,
  UpdateUserDto,
  UserFilters
} from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

const Users = () => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');
  const [submitting, setSubmitting] = useState(false);
  
  // New user form state
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('member');
  const [sendInvitation, setSendInvitation] = useState(true);
  
  // Edit user form state
  const [editUserName, setEditUserName] = useState('');
  const [editUserRole, setEditUserRole] = useState<UserRole>('member');
  const [editUserActive, setEditUserActive] = useState(true);
  
  const { toast } = useToast();
  const totalPages = Math.max(1, Math.ceil(totalUsers / limit));

  // Fetch organization ID
  useEffect(() => {
    const fetchOrganizationId = async () => {
      try {
        const organizations = await organizationsApi.getAll();
        if (organizations && organizations.length > 0) {
          setOrganizationId(organizations[0].id);
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
        setError('Failed to fetch organization data. Please try again later.');
        toast({
          title: 'Error',
          description: 'Failed to fetch organization data',
          variant: 'destructive',
        });
      }
    };

    fetchOrganizationId();
  }, [toast]);

  // Fetch users with filters
  useEffect(() => {
    if (!organizationId) return;
    
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Build filters
        const filters: UserFilters = {};
        
        if (searchQuery) {
          filters.search = searchQuery;
        }
        
        if (roleFilter) {
          filters.role = roleFilter as UserRole;
        }
        
        if (statusFilter) {
          filters.status = statusFilter as UserStatus;
        }
        
        const response = await usersApi.getOrganizationUsers(
          organizationId,
          filters,
          currentPage,
          limit
        );
        
        setUsers(response.data);
        setTotalUsers(response.total);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to fetch users. Please try again later.');
        toast({
          title: 'Error',
          description: 'Failed to fetch users',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [organizationId, currentPage, limit, searchQuery, roleFilter, statusFilter, toast]);

  // Format last active time
  const formatLastActive = (lastActiveAt?: string) => {
    if (!lastActiveAt) return 'Never';
    
    try {
      return formatDistanceToNow(new Date(lastActiveAt), { addSuffix: true });
    } catch (error) {
      return 'Unknown';
    }
  };

  // Format user status
  const getUserStatusBadge = (user: User) => {
    let status: UserStatus = user.is_active ? 'active' : 'inactive';
    
    if (!user.is_verified) {
      status = 'invited';
    }
    
    let color = '';
    switch (status) {
      case 'active':
        color = 'bg-green-100 text-green-800';
        break;
      case 'inactive':
        color = 'bg-gray-100 text-gray-800';
        break;
      case 'invited':
        color = 'bg-yellow-100 text-yellow-800';
        break;
      case 'pending':
        color = 'bg-blue-100 text-blue-800';
        break;
    }
    
    return (
      <Badge className={color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Handle add user
  const handleAddUser = async () => {
    if (!newUserEmail || !newUserRole) {
      toast({
        title: 'Validation Error',
        description: 'Please provide an email and role for the new user',
        variant: 'destructive',
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      const createUserData: CreateUserDto = {
        email: newUserEmail,
        display_name: newUserName || undefined,
        role: newUserRole,
        send_invitation: sendInvitation
      };
      
      await usersApi.createUser(organizationId, createUserData);
      
      // Refresh the users list
      const response = await usersApi.getOrganizationUsers(organizationId, {}, currentPage, limit);
      setUsers(response.data);
      setTotalUsers(response.total);
      
      // Reset form and close dialog
      setNewUserEmail('');
      setNewUserName('');
      setNewUserRole('member');
      setSendInvitation(true);
      setIsAddUserDialogOpen(false);
      
      toast({
        title: 'Success',
        description: `User ${newUserEmail} has been added${sendInvitation ? ' and invited' : ''}`,
      });
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: 'Error',
        description: 'Failed to add user',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setSubmitting(true);
    
    try {
      await usersApi.deleteUser(userToDelete.id);
      
      // Refresh the users list
      const response = await usersApi.getOrganizationUsers(organizationId, {}, currentPage, limit);
      setUsers(response.data);
      setTotalUsers(response.total);
      
      // Reset state and close dialog
      setUserToDelete(null);
      setIsDeleteDialogOpen(false);
      
      toast({
        title: 'Success',
        description: 'User has been deleted',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit user
  const handleEditUser = async () => {
    if (!userToEdit) return;
    
    setSubmitting(true);
    
    try {
      const updateUserData: UpdateUserDto = {
        display_name: editUserName || undefined,
        role: editUserRole,
        is_active: editUserActive
      };
      
      await usersApi.updateUser(userToEdit.id, updateUserData);
      
      // Refresh the users list
      const response = await usersApi.getOrganizationUsers(organizationId, {}, currentPage, limit);
      setUsers(response.data);
      setTotalUsers(response.total);
      
      // Reset state and close dialog
      setUserToEdit(null);
      setIsEditDialogOpen(false);
      
      toast({
        title: 'Success',
        description: 'User has been updated',
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle resend invitation
  const handleResendInvitation = async (user: User) => {
    try {
      await usersApi.resendInvitation(user.id);
      
      toast({
        title: 'Success',
        description: `Invitation has been resent to ${user.email}`,
      });
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to resend invitation',
        variant: 'destructive',
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (user: User) => {
    setUserToEdit(user);
    setEditUserName(user.display_name || '');
    setEditUserRole(user.role || 'member');
    setEditUserActive(user.is_active);
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  // Reset filters
  const resetFilters = () => {
    setRoleFilter('');
    setStatusFilter('');
    setSearchQuery('');
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Generate pagination items
  const getPaginationItems = () => {
    const items = [];
    
    // Previous button
    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious 
          onClick={() => handlePageChange(currentPage - 1)}
          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-gray-50 rounded-xl transition-all duration-200'}
        />
      </PaginationItem>
    );
    
    // First page
    items.push(
      <PaginationItem key="1">
        <PaginationLink 
          onClick={() => handlePageChange(1)}
          isActive={currentPage === 1}
          className={`cursor-pointer rounded-xl transition-all duration-200 ${
            currentPage === 1 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'hover:bg-gray-50 text-gray-600'
          }`}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Ellipsis after first page
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages) continue; // Skip first and last pages (added separately)
      
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
            className={`cursor-pointer rounded-xl transition-all duration-200 ${
              currentPage === i 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'hover:bg-gray-50 text-gray-600'
            }`}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Ellipsis before last page
    if (currentPage < totalPages - 2 && totalPages > 3) {
      items.push(
        <PaginationItem key="ellipsis2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Last page (if more than 1 page)
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink 
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
            className={`cursor-pointer rounded-xl transition-all duration-200 ${
              currentPage === totalPages 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'hover:bg-gray-50 text-gray-600'
            }`}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Next button
    items.push(
      <PaginationItem key="next">
        <PaginationNext 
          onClick={() => handlePageChange(currentPage + 1)}
          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-gray-50 rounded-xl transition-all duration-200'}
        />
      </PaginationItem>
    );
    
    return items;
  };
  
  return (
    <div className="flex h-screen bg-gray-50/30">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto bg-gray-50/30">
          <div className="max-w-7xl mx-auto px-6 py-6">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-gray-900">
                  {loading ? 'Loading...' : 
                    totalUsers === 0 ? 'Users' : `Users (${totalUsers})`
                  }
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Search bar */}
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                    <Search className="w-4 h-4 text-gray-500" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search users..."
                    className="ps-12 pr-4 py-3 border border-gray-200 rounded-xl w-80 focus:ring-blue-500 focus:ring-2 focus:border-transparent transition-all duration-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6 py-3 transition-all duration-200"
                  onClick={() => setIsAddUserDialogOpen(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add user
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32 border border-gray-200 rounded-xl focus:ring-blue-500 focus:ring-2 transition-all duration-200">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 border border-gray-200 rounded-xl focus:ring-blue-500 focus:ring-2 transition-all duration-200">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="invited">Invited</SelectItem>
                </SelectContent>
              </Select>
              
              {(roleFilter || statusFilter || searchQuery) && (
                <Button 
                  variant="outline" 
                  className="rounded-xl px-4 py-3 border-gray-200 hover:bg-gray-50 transition-all duration-200"
                  onClick={resetFilters}
                >
                  Clear
                </Button>
              )}
            </div>


            {/* Loading state */}
            {loading ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Loading users...</p>
              </div>
          ) : users.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="inline-flex items-center justify-center bg-blue-100 text-blue-600 rounded-full p-4 mb-6">
                  <UsersIcon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">No users found</h3>
                <p className="text-gray-600 font-normal mb-6 max-w-md mx-auto">
                  {searchQuery || roleFilter || statusFilter
                    ? "No users match your current filters."
                    : "You haven't added any users yet. Add your first user to get started."
                  }
                </p>
                <div className="flex justify-center gap-3">
                  {searchQuery || roleFilter || statusFilter ? (
                    <Button
                      variant="outline"
                      onClick={resetFilters}
                      className="rounded-xl px-6 py-3 border-gray-200 hover:bg-gray-50 transition-all duration-200"
                    >
                      Clear filters
                    </Button>
                  ) : null}
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6 py-3 transition-all duration-200"
                    onClick={() => setIsAddUserDialogOpen(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add user
                  </Button>
                </div>
              </div>
          ) : (
            <>
                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-50">
                        <TableHead className="w-[200px] text-xs font-semibold text-gray-900 uppercase tracking-wider py-4 px-6">Name</TableHead>
                        <TableHead className="w-[250px] text-xs font-semibold text-gray-900 uppercase tracking-wider py-4 px-6">Email</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-900 uppercase tracking-wider py-4 px-6">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-900 uppercase tracking-wider py-4 px-6">Role</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-900 uppercase tracking-wider py-4 px-6">Last active</TableHead>
                        <TableHead className="w-[70px] py-4 px-6"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors duration-150">
                          <TableCell className="py-4 px-6">
                            <span className="font-medium text-gray-900">
                              {user.display_name || 'Not set'}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <span className="text-gray-900">{user.email}</span>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            {getUserStatusBadge(user)}
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <span className="inline-flex items-center justify-center bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full capitalize">
                              {user.role || 'member'}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <span className="text-sm text-gray-900">
                              {formatLastActive(user.last_active_at || user.last_login_at)}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl hover:bg-gray-100 transition-all duration-200">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl border-gray-200 shadow-lg">
                                <DropdownMenuItem
                                  onClick={() => openEditDialog(user)}
                                  className="rounded-lg"
                                >
                                  Edit
                                </DropdownMenuItem>
                                
                                {!user.is_verified && (
                                  <DropdownMenuItem
                                    onClick={() => handleResendInvitation(user)}
                                    className="rounded-lg"
                                  >
                                    <Mail className="mr-2 h-4 w-4" />
                                    Resend Invitation
                                  </DropdownMenuItem>
                                )}
                                
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem
                                  className="text-red-600 rounded-lg"
                                  onClick={() => openDeleteDialog(user)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4">
                    <Pagination>
                      <PaginationContent className="gap-2">
                        {getPaginationItems()}
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
            </>
          )}
          </div>
        </main>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-gray-200 shadow-lg">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-2xl font-semibold text-gray-900">Add User</DialogTitle>
            <DialogDescription className="text-gray-600 font-normal">
              Add a new user to your organization. They will receive an invitation email if you choose to send an invitation.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-2">
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-900">
                  Display Name
                </label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="role" className="block text-sm font-medium text-gray-900">
                  Role <span className="text-red-500">*</span>
                </label>
                <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as UserRole)}>
                  <SelectTrigger id="role" className="rounded-xl border-gray-200 focus:ring-blue-500 focus:ring-2 transition-all duration-200">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Admins can manage all settings, Members can manage resources, Viewers can only view data.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="send-invitation"
                  checked={sendInvitation}
                  onChange={(e) => setSendInvitation(e.target.checked)}
                  className="rounded border-gray-300 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="send-invitation" className="text-sm font-medium text-gray-900">
                  Send invitation email
                </label>
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 pt-4 flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsAddUserDialogOpen(false)}
              disabled={submitting}
              className="rounded-xl px-6 py-3 border-gray-200 hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddUser}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6 py-3 transition-all duration-200"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-gray-200 shadow-lg">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-2xl font-semibold text-gray-900">Edit User</DialogTitle>
            <DialogDescription className="text-gray-600 font-normal">
              Update user details and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-2">
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="edit-email" className="block text-sm font-medium text-gray-900">
                  Email
                </label>
                <Input
                  id="edit-email"
                  type="email"
                  value={userToEdit?.email || ''}
                  disabled
                  className="bg-gray-100 rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-900">
                  Display Name
                </label>
                <Input
                  id="edit-name"
                  placeholder="John Doe"
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-role" className="block text-sm font-medium text-gray-900">
                  Role
                </label>
                <Select 
                  value={editUserRole} 
                  onValueChange={(value) => setEditUserRole(value as UserRole)}
                >
                  <SelectTrigger id="edit-role" className="rounded-xl border-gray-200 focus:ring-blue-500 focus:ring-2 transition-all duration-200">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editUserActive}
                  onChange={(e) => setEditUserActive(e.target.checked)}
                  className="rounded border-gray-300 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="edit-active" className="text-sm font-medium text-gray-900">
                  User is active
                </label>
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 pt-4 flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              disabled={submitting}
              className="rounded-xl px-6 py-3 border-gray-200 hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditUser}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6 py-3 transition-all duration-200"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-gray-200 shadow-lg">
          <AlertDialogHeader className="p-6 pb-4">
            <AlertDialogTitle className="text-2xl font-semibold text-gray-900">Delete User</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 font-normal">
              Are you sure you want to delete the user "{userToDelete?.email}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-6 pt-4 flex justify-end gap-3">
            <AlertDialogCancel 
              disabled={submitting}
              className="rounded-xl px-6 py-3 border-gray-200 hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteUser();
              }}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 py-3 transition-all duration-200"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;