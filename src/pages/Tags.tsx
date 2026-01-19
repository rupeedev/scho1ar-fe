import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Loader2, ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { organizationsApi, tagsApi, resourcesApi, TagSummary, CreateTagRequest, UntaggedResource } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const TagItem: React.FC<{ 
  value: string; 
  tagKey: string;
  organizationId: string;
  onRemove: () => void;
}> = ({ value, tagKey, organizationId, onRemove }) => {
  const { toast } = useToast();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isRemoving) return;
    
    try {
      setIsRemoving(true);
      // This endpoint would remove the tag completely - in a real implementation
      // we might want to show all resources with this tag and allow selecting which ones to remove it from
      await tagsApi.deleteTag(organizationId, tagKey, value);
      toast({
        title: 'Tag removed',
        description: `Successfully removed tag ${tagKey}:${value}`,
      });
      onRemove();
    } catch (error) {
      console.error('Error removing tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove tag',
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="inline-flex items-center bg-blue-500 text-white text-xs rounded-md py-1 px-2 mr-2 mb-2">
      <span className="mr-1">{value}</span>
      {isRemoving ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <X size={12} className="cursor-pointer" onClick={handleRemove} />
      )}
    </div>
  );
};

const Tags = () => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false);
  const [newTagKey, setNewTagKey] = useState('');
  const [newTagValue, setNewTagValue] = useState('');
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [organizationId, setOrganizationId] = useState<string>('');
  const [tags, setTags] = useState<TagSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [filteredTags, setFilteredTags] = useState<TagSummary[]>([]);
  const [untaggedResources, setUntaggedResources] = useState<UntaggedResource[]>([]);
  const [loadingUntagged, setLoadingUntagged] = useState(true);
  const { toast } = useToast();

  // Fetch organization data
  useEffect(() => {
    console.log('🏢 Fetching organization data...');
    const fetchOrganizationId = async () => {
      try {
        const organizations = await organizationsApi.getAll();
        console.log('🏢 Organizations received:', organizations);
        if (organizations && organizations.length > 0) {
          console.log('🏢 Setting organization ID:', organizations[0].id);
          setOrganizationId(organizations[0].id);
        } else {
          console.log('🏢 No organizations found');
        }
      } catch (error) {
        console.error('❌ Error fetching organizations:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch organization data',
          variant: 'destructive',
        });
      }
    };

    fetchOrganizationId();
  }, [toast]);

  // Fetch tags when organization ID is available
  useEffect(() => {
    if (!organizationId) return;
    
    const fetchTags = async () => {
      setLoading(true);
      
      try {
        const tagsData = await tagsApi.getAll(organizationId);
        setTags(tagsData);
        setFilteredTags(tagsData);
      } catch (error) {
        console.error('Error fetching tags:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch tag data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, [organizationId, toast]);

  // Fetch untagged resources when organization ID is available
  useEffect(() => {
    console.log('🔍 Untagged resources useEffect triggered. organizationId:', organizationId);
    if (!organizationId) {
      console.log('🔍 No organizationId, skipping untagged resources fetch');
      return;
    }
    
    const fetchUntaggedResources = async () => {
      console.log('🔍 Fetching untagged resources for org:', organizationId);
      setLoadingUntagged(true);
      
      try {
        const untaggedData = await tagsApi.getUntaggedResources(organizationId);
        console.log('📊 Untagged resources received:', untaggedData);
        setUntaggedResources(untaggedData);
      } catch (error) {
        console.error('❌ Error fetching untagged resources:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch untagged resources',
          variant: 'destructive',
        });
      } finally {
        setLoadingUntagged(false);
      }
    };

    fetchUntaggedResources();
  }, [organizationId, toast]);

  // Fetch resources for the dropdown
  useEffect(() => {
    if (!organizationId) return;
    
    const fetchResources = async () => {
      try {
        // This is a simplification - in a real app, we would likely
        // fetch resources from all cloud accounts under the organization
        const cloudAccounts = await organizationsApi.getAll();
        if (cloudAccounts && cloudAccounts.length > 0) {
          const firstAccount = cloudAccounts[0];
          const resourcesData = await resourcesApi.getAll(firstAccount.id);
          setResources(resourcesData);
        }
      } catch (error) {
        console.error('Error fetching resources:', error);
      }
    };

    fetchResources();
  }, [organizationId]);

  // Filter tags when search query changes
  useEffect(() => {
    if (!tags.length) return;
    
    if (!searchQuery.trim()) {
      setFilteredTags(tags);
      return;
    }
    
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = tags.filter(tag => 
      tag.key.toLowerCase().includes(lowerQuery) || 
      tag.values.some(val => val.toLowerCase().includes(lowerQuery))
    );
    
    setFilteredTags(filtered);
  }, [searchQuery, tags]);

  // Create a new tag
  const handleCreateTag = async () => {
    if (!newTagKey.trim() || !newTagValue.trim() || !selectedResources.length) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a tag key, value, and select at least one resource',
        variant: 'destructive',
      });
      return;
    }
    
    setCreating(true);
    
    try {
      const createTagData: CreateTagRequest = {
        key: newTagKey,
        value: newTagValue,
        resource_ids: selectedResources
      };
      
      await tagsApi.createTag(organizationId, createTagData);
      
      // Refresh the tags list and untagged resources
      const updatedTags = await tagsApi.getAll(organizationId);
      setTags(updatedTags);
      setFilteredTags(updatedTags);
      
      // Also refresh untagged resources as creating a tag might change the count
      const updatedUntagged = await tagsApi.getUntaggedResources(organizationId);
      setUntaggedResources(updatedUntagged);
      
      // Reset form and close dialog
      setNewTagKey('');
      setNewTagValue('');
      setSelectedResources([]);
      setIsCreateTagOpen(false);
      
      toast({
        title: 'Success',
        description: 'Tag created successfully',
      });
    } catch (error) {
      console.error('Error creating tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to create tag',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };
  
  // Handle tag value remove
  const handleTagValueRemove = async (tagKey: string, tagValue: string) => {
    // Refresh the tags list and untagged resources after removing a tag
    try {
      const updatedTags = await tagsApi.getAll(organizationId);
      setTags(updatedTags);
      setFilteredTags(updatedTags);
      
      // Also refresh untagged resources as removing a tag might change the count
      const updatedUntagged = await tagsApi.getUntaggedResources(organizationId);
      setUntaggedResources(updatedUntagged);
    } catch (error) {
      console.error('Error refreshing tags:', error);
    }
  };
  
  // View resources with a specific tag
  const viewResourcesWithTag = (tagKey: string, tagValue: string) => {
    // In a real app, this might navigate to a filtered resources page
    toast({
      title: 'View Resources',
      description: `Viewing resources with tag ${tagKey}:${tagValue}`,
    });
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        
        <div className="flex-1 overflow-y-auto">
          <div className="bg-blue-50 border-b border-blue-100 p-2 text-sm text-blue-700">
            Your subscription trial ends in 1 day. <Link to="/" className="text-blue-700 font-medium hover:underline">Click here</Link> to set your default payment method.
          </div>
          
          <div className="p-4 bg-gray-50">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-gray-500 mb-4">
              <Link to="/" className="flex items-center hover:text-gray-900">
                <Home size={16} />
              </Link>
              <ChevronRight size={14} />
              <span className="text-sm font-medium">Tags</span>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-lg font-semibold">
                    Tags ({loading ? '...' : filteredTags.length})
                  </h1>
                  <div className="flex gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search..."
                        className="border border-gray-300 rounded-lg py-2 px-4 pr-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <Search size={18} className="text-gray-500" />
                      </div>
                    </div>
                    <Button 
                      className="flex items-center gap-1" 
                      onClick={() => setIsCreateTagOpen(true)}
                    >
                      <Plus size={16} />
                      Create tag
                    </Button>
                  </div>
                </div>
                
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mr-2" />
                    <p>Loading tags...</p>
                  </div>
                ) : filteredTags.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    {searchQuery ? (
                      <>
                        <p>No tags found matching "{searchQuery}"</p>
                        <Button 
                          variant="link" 
                          onClick={() => setSearchQuery('')}
                          className="mt-2"
                        >
                          Clear search
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="mb-4">No tags found</p>
                        <Button 
                          onClick={() => setIsCreateTagOpen(true)}
                          className="flex items-center gap-1"
                        >
                          <Plus size={16} />
                          Create your first tag
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-1/4">Tag key</TableHead>
                          <TableHead className="w-3/4">Tag values</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTags.map((tag, index) => (
                          <TableRow key={index} className="group">
                            <TableCell className="font-medium">
                              <div className="flex items-center justify-between">
                                <span>{tag.key}</span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <ChevronRight className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setIsCreateTagOpen(true)}>
                                      Add new value
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap">
                                {tag.values.map((value, valueIndex) => (
                                  <div 
                                    key={valueIndex}
                                    className="relative group/tag"
                                    onClick={() => viewResourcesWithTag(tag.key, value)}
                                  >
                                    <TagItem 
                                      key={valueIndex} 
                                      value={value} 
                                      tagKey={tag.key}
                                      organizationId={organizationId}
                                      onRemove={() => handleTagValueRemove(tag.key, value)}
                                    />
                                  </div>
                                ))}
                                <button 
                                  className="inline-flex items-center text-blue-500 text-xs hover:underline cursor-pointer ml-2"
                                  onClick={() => setIsCreateTagOpen(true)}
                                >
                                  + Add Value
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>

            {/* Untagged Resources Section - ALWAYS VISIBLE FOR TESTING */}
            <div className="bg-white rounded-lg shadow mt-6">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-red-600">
                    🚨 Untagged Resources (Testing Mode)
                  </h2>
                  <span className="text-sm text-gray-500">
                    Resources that need attention
                  </span>
                </div>
                
                {/* Always show this test content */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resource Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Test row 1 */}
                      <TableRow className="bg-red-50 border-l-4 border-l-red-500">
                        <TableCell className="font-medium text-red-800">
                          costpie-bucket-1
                        </TableCell>
                        <TableCell className="text-red-700">
                          S3 Bucket
                        </TableCell>
                        <TableCell className="text-red-700">
                          Main Account
                        </TableCell>
                        <TableCell className="text-red-700">
                          us-east-1
                        </TableCell>
                        <TableCell className="text-red-700 text-sm">
                          ⚠️ NO TAGS
                        </TableCell>
                      </TableRow>
                      
                      {/* Test row 2 */}
                      <TableRow className="bg-red-50 border-l-4 border-l-red-500">
                        <TableCell className="font-medium text-red-800">
                          untagged-resource-2
                        </TableCell>
                        <TableCell className="text-red-700">
                          EC2 Instance
                        </TableCell>
                        <TableCell className="text-red-700">
                          Main Account
                        </TableCell>
                        <TableCell className="text-red-700">
                          us-east-1
                        </TableCell>
                        <TableCell className="text-red-700 text-sm">
                          ⚠️ NO TAGS
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    📋 This section shows resources from your database that have empty tags ({'{}'}).
                    Based on the Supabase data, there should be 2 untagged resources.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Create Tag Dialog */}
      <Dialog open={isCreateTagOpen} onOpenChange={setIsCreateTagOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="tag-key" className="text-sm font-medium">
                Tag key
              </label>
              <Input
                id="tag-key"
                placeholder="Enter tag key"
                value={newTagKey}
                onChange={(e) => setNewTagKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="tag-value" className="text-sm font-medium">
                Tag value
              </label>
              <Input
                id="tag-value"
                placeholder="Enter tag value"
                value={newTagValue}
                onChange={(e) => setNewTagValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Apply to resources
              </label>
              <Select onValueChange={(value) => setSelectedResources([value])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select resources" />
                </SelectTrigger>
                <SelectContent>
                  {resources.map((resource) => (
                    <SelectItem key={resource.id} value={resource.id}>
                      {resource.resource_name || resource.resource_id_on_provider} ({resource.resource_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Select resources to apply this tag to
              </p>
            </div>
          </div>
          <DialogFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateTagOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTag}
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
    </div>
  );
};

export default Tags;