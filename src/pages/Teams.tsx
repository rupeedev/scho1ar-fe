import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Plus, Search, Trash2, Loader2, AlertTriangle, Users, UserPlus, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { organizationsApi, teamsApi, Team, CreateTeamDto, AddTeamMemberDto, TeamRole, TeamMember } from '@/lib/api';
import { usersApi, User } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/utils';

const Teams = () => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isManageMembersDialogOpen, setIsManageMembersDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [removingMember, setRemovingMember] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [selectedTeamForUser, setSelectedTeamForUser] = useState<Team | null>(null);
  const [selectedTeamForManagement, setSelectedTeamForManagement] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [organizationUsers, setOrganizationUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserRole, setSelectedUserRole] = useState<TeamRole>('member');
  const itemsPerPage = 10;
  const { toast } = useToast();

  // Fetch organization data
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

  // Fetch teams when organization ID is available
  useEffect(() => {
    if (!organizationId) return;
    
    const fetchTeams = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const teamsData = await teamsApi.getAll(organizationId);
        setTeams(teamsData);
      } catch (error) {
        console.error('Error fetching teams:', error);
        setError('Failed to fetch teams. Please try again later.');
        toast({
          title: 'Error',
          description: 'Failed to fetch teams',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [organizationId, toast]);

  // Fetch organization users when organization ID is available
  useEffect(() => {
    if (!organizationId) return;
    
    const fetchUsers = async () => {
      try {
        const usersData = await usersApi.getOrganizationUsers(organizationId, {}, 1, 100);
        setOrganizationUsers(usersData.data);
      } catch (error) {
        console.error('Error fetching organization users:', error);
      }
    };

    fetchUsers();
  }, [organizationId]);

  // Filter and paginate teams when search query changes
  useEffect(() => {
    if (!teams.length) {
      setFilteredTeams([]);
      setTotalPages(1);
      return;
    }
    
    const filtered = searchQuery
      ? teams.filter(team => 
          team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (team.description && team.description.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : teams;
    
    setFilteredTeams(filtered);
    setTotalPages(Math.max(1, Math.ceil(filtered.length / itemsPerPage)));
    
    // Reset to first page when search changes
    if (currentPage > 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, teams, currentPage]);

  // Get current page of teams
  const getCurrentPageTeams = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTeams.slice(startIndex, endIndex);
  };

  // Create a new team
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a team name',
        variant: 'destructive',
      });
      return;
    }
    
    setCreating(true);
    
    try {
      const createTeamData: CreateTeamDto = {
        name: newTeamName,
        description: newTeamDescription || undefined
      };
      
      await teamsApi.create(organizationId, createTeamData);
      
      // Refresh the teams list
      const updatedTeams = await teamsApi.getAll(organizationId);
      setTeams(updatedTeams);
      
      // Reset form and close dialog
      setNewTeamName('');
      setNewTeamDescription('');
      setIsCreateDialogOpen(false);
      
      toast({
        title: 'Success',
        description: 'Team created successfully',
      });
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: 'Error',
        description: 'Failed to create team',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (team: Team) => {
    setTeamToDelete(team);
    setIsDeleteDialogOpen(true);
  };

  // Delete a team
  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    
    setDeleting(true);
    
    try {
      await teamsApi.delete(teamToDelete.id);
      
      // Refresh the teams list
      const updatedTeams = await teamsApi.getAll(organizationId);
      setTeams(updatedTeams);
      
      // Reset state and close dialog
      setTeamToDelete(null);
      setIsDeleteDialogOpen(false);
      
      toast({
        title: 'Success',
        description: 'Team deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete team',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Open add user dialog
  const openAddUserDialog = (team: Team) => {
    setSelectedTeamForUser(team);
    setSelectedUserId('');
    setSelectedUserRole('member');
    setIsAddUserDialogOpen(true);
  };

  // Add user to team
  const handleAddUserToTeam = async () => {
    if (!selectedTeamForUser || !selectedUserId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a user',
        variant: 'destructive',
      });
      return;
    }
    
    setAddingUser(true);
    
    try {
      const addMemberData: AddTeamMemberDto = {
        user_id: selectedUserId,
        role: selectedUserRole,
      };
      
      await teamsApi.addMember(selectedTeamForUser.id, addMemberData);
      
      // Refresh the teams list to update member counts
      const updatedTeams = await teamsApi.getAll(organizationId);
      setTeams(updatedTeams);
      
      // Reset state and close dialog
      setSelectedTeamForUser(null);
      setSelectedUserId('');
      setSelectedUserRole('member');
      setIsAddUserDialogOpen(false);
      
      toast({
        title: 'Success',
        description: 'User added to team successfully',
      });
    } catch (error) {
      console.error('Error adding user to team:', error);
      toast({
        title: 'Error',
        description: 'Failed to add user to team',
        variant: 'destructive',
      });
    } finally {
      setAddingUser(false);
    }
  };

  // Open manage members dialog
  const openManageMembersDialog = async (team: Team) => {
    setSelectedTeamForManagement(team);
    setIsManageMembersDialogOpen(true);
    setLoadingMembers(true);
    
    try {
      const members = await teamsApi.getMembers(team.id);
      setTeamMembers(members);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch team members',
        variant: 'destructive',
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  // Remove user from team
  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!selectedTeamForManagement) return;
    
    setRemovingMember(true);
    
    try {
      await teamsApi.removeMember(selectedTeamForManagement.id, userId);
      
      // Refresh the team members list
      const updatedMembers = await teamsApi.getMembers(selectedTeamForManagement.id);
      setTeamMembers(updatedMembers);
      
      // Refresh the teams list to update member counts
      const updatedTeams = await teamsApi.getAll(organizationId);
      setTeams(updatedTeams);
      
      toast({
        title: 'Success',
        description: `${userName} removed from team successfully`,
      });
    } catch (error) {
      console.error('Error removing team member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove team member',
        variant: 'destructive',
      });
    } finally {
      setRemovingMember(false);
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Format date for display
  const formatDateDisplay = (dateString: string) => {
    const { date, time } = formatDate(dateString);
    return (
      <>
        <div>{date}</div>
        <div className="text-xs text-gray-500">{time}</div>
      </>
    );
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
    if (currentPage < totalPages - 2) {
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
                    teams.length === 0 ? 'Teams' : `Teams (${filteredTeams.length})`
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
                    placeholder="Search teams..."
                    className="ps-12 pr-4 py-3 border border-gray-200 rounded-xl w-80 focus:ring-blue-500 focus:ring-2 focus:border-transparent transition-all duration-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6 py-3 transition-all duration-200"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create team
                </Button>
              </div>
            </div>


            {/* Loading state */}
            {loading ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Loading teams...</p>
              </div>
          ) : filteredTeams.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="inline-flex items-center justify-center bg-blue-100 text-blue-600 rounded-full p-4 mb-6">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">No teams found</h3>
                <p className="text-gray-600 font-normal mb-6 max-w-md mx-auto">
                  {searchQuery 
                    ? `No teams matching "${searchQuery}"`
                    : "You haven't created any teams yet. Create your first team to get started."
                  }
                </p>
                <div className="flex justify-center gap-3">
                  {searchQuery ? (
                    <Button
                      variant="outline"
                      onClick={() => setSearchQuery('')}
                      className="rounded-xl px-6 py-3 border-gray-200 hover:bg-gray-50 transition-all duration-200"
                    >
                      Clear search
                    </Button>
                  ) : null}
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6 py-3 transition-all duration-200"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create team
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
                        <TableHead className="w-[250px] text-xs font-semibold text-gray-900 uppercase tracking-wider py-4 px-6">Team Name</TableHead>
                        <TableHead className="text-center text-xs font-semibold text-gray-900 uppercase tracking-wider py-4 px-6">Members</TableHead>
                        <TableHead className="text-center text-xs font-semibold text-gray-900 uppercase tracking-wider py-4 px-6">Resources</TableHead>
                        <TableHead className="text-center text-xs font-semibold text-gray-900 uppercase tracking-wider py-4 px-6">Schedules</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-900 uppercase tracking-wider py-4 px-6">Created</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-900 uppercase tracking-wider py-4 px-6">Updated</TableHead>
                        <TableHead className="w-[120px] py-4 px-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getCurrentPageTeams().map((team) => (
                        <TableRow key={team.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors duration-150">
                          <TableCell className="py-4 px-6">
                            <Link 
                              to={`/teams/${team.id}`} 
                              className="text-blue-600 hover:text-blue-800 flex items-start flex-col transition-colors duration-150"
                            >
                              <span className="font-medium text-gray-900">{team.name}</span>
                              {team.description && (
                                <span className="text-sm text-gray-500 font-normal mt-1 line-clamp-1">
                                  {team.description}
                                </span>
                              )}
                            </Link>
                          </TableCell>
                          <TableCell className="text-center py-4 px-6">
                            <span className="inline-flex items-center justify-center bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                              {team.member_count}
                            </span>
                          </TableCell>
                          <TableCell className="text-center py-4 px-6">
                            <span className="inline-flex items-center justify-center bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                              {team.resource_count}
                            </span>
                          </TableCell>
                          <TableCell className="text-center py-4 px-6">
                            <span className="inline-flex items-center justify-center bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                              {team.schedule_count}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="text-sm text-gray-900">{formatDateDisplay(team.created_at)}</div>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="text-sm text-gray-900">{formatDateDisplay(team.updated_at)}</div>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl h-8 w-8 transition-all duration-200"
                                onClick={() => openAddUserDialog(team)}
                                title="Add user to team"
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl h-8 w-8 transition-all duration-200"
                                onClick={() => openManageMembersDialog(team)}
                                title="Manage team members"
                              >
                                <Users className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl h-8 w-8 transition-all duration-200"
                                onClick={() => openDeleteDialog(team)}
                                title="Delete team"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

      {/* Create Team Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-gray-200 shadow-lg">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-2xl font-semibold text-gray-900">Create Team</DialogTitle>
            <DialogDescription className="text-gray-600 font-normal">
              Create a new team to manage resources and users.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-2">
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="team-name" className="block text-sm font-medium text-gray-900">
                  Team Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="team-name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                  autoFocus
                  placeholder="Enter team name"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="team-description" className="block text-sm font-medium text-gray-900">
                  Description
                </label>
                <Textarea
                  id="team-description"
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                  placeholder="Enter team description (optional)"
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 pt-4 flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={creating}
              className="rounded-xl px-6 py-3 border-gray-200 hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6 py-3 transition-all duration-200" 
              onClick={handleCreateTeam}
              disabled={creating}
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-gray-200 shadow-lg">
          <AlertDialogHeader className="p-6 pb-4">
            <AlertDialogTitle className="text-2xl font-semibold text-gray-900">Delete Team</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 font-normal">
              Are you sure you want to delete the team "{teamToDelete?.name}"? This action cannot be undone.
              {teamToDelete?.member_count > 0 && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-amber-800 font-medium">Warning:</span> This team has {teamToDelete.member_count} member{teamToDelete.member_count !== 1 ? 's' : ''}.
                </div>
              )}
              {teamToDelete?.resource_count > 0 && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-amber-800 font-medium">Warning:</span> This team has {teamToDelete.resource_count} resource{teamToDelete.resource_count !== 1 ? 's' : ''} assigned.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-6 pt-4 flex justify-end gap-3">
            <AlertDialogCancel 
              disabled={deleting}
              className="rounded-xl px-6 py-3 border-gray-200 hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteTeam();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 py-3 transition-all duration-200"
            >
              {deleting ? (
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

      {/* Add User to Team Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-gray-200 shadow-lg">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-2xl font-semibold text-gray-900">Add User to Team</DialogTitle>
            <DialogDescription className="text-gray-600 font-normal">
              Add a user to "{selectedTeamForUser?.name}" team and assign their role.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-2">
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="user-select" className="block text-sm font-medium text-gray-900">
                  Select User <span className="text-red-500">*</span>
                </label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:ring-2 transition-all duration-200">
                    <SelectValue placeholder="Choose a user to add" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200 shadow-lg">
                    {organizationUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id} className="rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{user.display_name}</span>
                            <span className="text-sm text-gray-500">{user.email}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="role-select" className="block text-sm font-medium text-gray-900">
                  Team Role <span className="text-red-500">*</span>
                </label>
                <Select value={selectedUserRole} onValueChange={(value: TeamRole) => setSelectedUserRole(value)}>
                  <SelectTrigger className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:ring-2 transition-all duration-200">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200 shadow-lg">
                    <SelectItem value="admin" className="rounded-lg">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">Admin</span>
                        <span className="text-sm text-gray-500">Can manage team settings and members</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="member" className="rounded-lg">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">Member</span>
                        <span className="text-sm text-gray-500">Can manage team resources and schedules</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="viewer" className="rounded-lg">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">Viewer</span>
                        <span className="text-sm text-gray-500">Can only view team data</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 pt-4 flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsAddUserDialogOpen(false)}
              disabled={addingUser}
              className="rounded-xl px-6 py-3 border-gray-200 hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6 py-3 transition-all duration-200" 
              onClick={handleAddUserToTeam}
              disabled={addingUser || !selectedUserId}
            >
              {addingUser ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Team Members Dialog */}
      <Dialog open={isManageMembersDialogOpen} onOpenChange={setIsManageMembersDialogOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl border-gray-200 shadow-lg">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-2xl font-semibold text-gray-900">Manage Team Members</DialogTitle>
            <DialogDescription className="text-gray-600 font-normal">
              View and manage members of "{selectedTeamForManagement?.name}" team.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            {loadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                <span className="ml-3 text-gray-600">Loading team members...</span>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No team members</h3>
                <p className="text-gray-600">This team doesn't have any members yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {member.user?.display_name || 'Unknown User'}
                        </span>
                        <span className="text-sm text-gray-500">{member.user?.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        member.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : member.role === 'member'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg px-2 py-1 transition-all duration-200"
                        onClick={() => handleRemoveMember(member.user_id, member.user?.display_name || member.user?.email || 'User')}
                        disabled={removingMember}
                        title="Remove from team"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="p-6 pt-0">
            <Button 
              variant="outline" 
              onClick={() => setIsManageMembersDialogOpen(false)}
              className="rounded-xl px-6 py-3 border-gray-200 hover:bg-gray-50 transition-all duration-200"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teams;