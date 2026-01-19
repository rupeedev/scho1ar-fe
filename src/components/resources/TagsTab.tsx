import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Plus, X, Loader2, ChevronRight, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { organizationsApi, cloudAccountsApi, tagsApi, resourcesApi, TagSummary, CreateTagRequest } from '@/lib/api';
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
    <div className="inline-flex items-center bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white text-xs rounded-lg py-1.5 px-3 mr-2 mb-2 transition-all duration-200 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 shadow-sm">
      <span className="mr-2">{value}</span>
      {isRemoving ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <X size={12} className="cursor-pointer hover:bg-white/20 rounded transition-colors duration-150 p-0.5" onClick={handleRemove} />
      )}
    </div>
  );
};

const TagsTab = () => {
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
  const [resourceSearchQuery, setResourceSearchQuery] = useState('');
  const [untaggedResources, setUntaggedResources] = useState<any[]>([]);
  const [complianceIssues, setComplianceIssues] = useState<any[]>([]);
  const [taggingPatterns, setTaggingPatterns] = useState<any[]>([]);
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
        
        // Analyze tagging patterns
        const patterns = analyzeTaggingPatterns(tagsData);
        setTaggingPatterns(patterns);
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
    fetchUntaggedResources();
  }, [organizationId, toast]);

  // Fetch untagged resources with error handling
  const fetchUntaggedResources = async () => {
    if (!organizationId) return;
    
    try {
      const untaggedData = await tagsApi.getUntaggedResources(organizationId);
      setUntaggedResources(untaggedData);
      
      // Check for compliance issues based on resource naming conventions
      const compliance = checkComplianceIssues(untaggedData);
      setComplianceIssues(compliance);
    } catch (error) {
      console.error('Error fetching untagged resources:', error);
      // Set empty arrays as fallback
      setUntaggedResources([]);
      setComplianceIssues([]);
      
      // Don't show error toast for this as it's not critical
      // The user can still use other tag functionality
    }
  };

  // Memoized tagging patterns analysis for better performance
  const analyzeTaggingPatterns = useCallback((tagsData: TagSummary[]) => {
    const patterns: any[] = [];
    
    // Group tags by common patterns
    const patternGroups: Record<string, any> = {};
    
    tagsData.forEach(tag => {
      const key = tag.key.toLowerCase();
      
      // Define pattern categories
      let category = 'Other';
      let icon = '🏷️';
      let description = 'General purpose tags';
      
      if (['environment', 'env', 'stage'].includes(key)) {
        category = 'Environment';
        icon = '🌍';
        description = 'Environment-based organization (dev, prod, test)';
      } else if (['team', 'owner', 'ownedby', 'ownerteam'].includes(key)) {
        category = 'Ownership';
        icon = '👥';
        description = 'Team and ownership identification';
      } else if (['project', 'application', 'app', 'service'].includes(key)) {
        category = 'Project';
        icon = '📦';
        description = 'Project and application grouping';
      } else if (['costcenter', 'billing', 'department', 'cost'].includes(key)) {
        category = 'Cost Center';
        icon = '💰';
        description = 'Cost allocation and billing';
      } else if (['network', 'vpc', 'subnet', 'security'].includes(key)) {
        category = 'Network';
        icon = '🔗';
        description = 'Network and security configuration';
      } else if (['backup', 'schedule', 'lifecycle', 'retention'].includes(key)) {
        category = 'Lifecycle';
        icon = '⏰';
        description = 'Backup and lifecycle management';
      }
      
      if (!patternGroups[category]) {
        patternGroups[category] = {
          category,
          icon,
          description,
          tags: [],
          totalResources: 0,
          uniqueValues: new Set()
        };
      }
      
      patternGroups[category].tags.push(tag);
      patternGroups[category].totalResources += tag.resource_count;
      tag.values.forEach(value => patternGroups[category].uniqueValues.add(value));
    });
    
    // Convert to array and sort by resource count
    Object.values(patternGroups).forEach((group: any) => {
      patterns.push({
        ...group,
        uniqueValues: group.uniqueValues.size,
        tagCount: group.tags.length
      });
    });
    
    // Sort by total resources (most used patterns first)
    patterns.sort((a, b) => b.totalResources - a.totalResources);
    
    return patterns;
  }, []);

  // Check compliance issues based on naming conventions
  const checkComplianceIssues = (allResources: any[]) => {
    const issues: any[] = [];
    
    // Combine untagged resources and current resources for compliance checking
    const allResourcesForCheck = [...allResources, ...resources];
    
    allResourcesForCheck.forEach(resource => {
      const resourceName = resource.resource_name || resource.name || resource.resource_id_on_provider || '';
      const resourceType = resource.resource_type || resource.type || '';
      
      // Check if resource name suggests it should have environment tag
      if (resourceName.toLowerCase().includes('dev') && 
          !hasRequiredTag(resource, 'environment', 'dev')) {
        issues.push({
          ...resource,
          missingTag: 'Missing "environment":"dev" tag for dev environment',
          suggestedTag: { key: 'environment', value: 'dev' }
        });
      } else if (resourceName.toLowerCase().includes('prod') && 
                 !hasRequiredTag(resource, 'environment', 'production')) {
        issues.push({
          ...resource,
          missingTag: 'Missing "environment":"production" tag for production environment',
          suggestedTag: { key: 'environment', value: 'production' }
        });
      } else if (resourceName.toLowerCase().includes('test') && 
                 !hasRequiredTag(resource, 'environment', 'test')) {
        issues.push({
          ...resource,
          missingTag: 'Missing "environment":"test" tag for test environment',
          suggestedTag: { key: 'environment', value: 'test' }
        });
      }
    });
    
    return issues;
  };

  // Helper function to check if resource has a specific tag
  const hasRequiredTag = (resource: any, tagKey: string, tagValue: string) => {
    // This would need to be implemented based on how tags are stored in resources
    // For now, assume no tags exist if resource is in untagged list
    return false;
  };

  // Optimized resource fetching with pagination and caching
  useEffect(() => {
    if (!organizationId) return;
    
    const fetchResources = async () => {
      try {
        const cloudAccounts = await cloudAccountsApi.getAll(organizationId);
        if (cloudAccounts && cloudAccounts.length > 0) {
          // Fetch resources from first account only initially for performance
          // Users can select different accounts if needed
          const firstAccount = cloudAccounts[0];
          
          // Fetch with basic filtering to reduce payload
          const resourcesData = await resourcesApi.getAll(firstAccount.id, {
            // Add any basic filters to reduce dataset size
          });
          
          // Limit initial resources for better performance
          const limitedResources = resourcesData.slice(0, 500); // Limit to 500 resources initially
          setResources(limitedResources);
          
          console.log(`Loaded ${limitedResources.length} resources for tagging (total: ${resourcesData.length})`);
        }
      } catch (error) {
        console.error('Error fetching resources:', error);
      }
    };

    fetchResources();
  }, [organizationId]);

  // Memoized tag filtering for better performance
  const filteredTagsData = useMemo(() => {
    if (!tags.length || !searchQuery.trim()) {
      return tags;
    }
    
    const lowerQuery = searchQuery.toLowerCase();
    return tags.filter(tag => 
      tag.key.toLowerCase().includes(lowerQuery) || 
      tag.values.some(val => val.toLowerCase().includes(lowerQuery))
    );
  }, [searchQuery, tags]);

  // Update filtered tags when memoized data changes
  useEffect(() => {
    setFilteredTags(filteredTagsData);
  }, [filteredTagsData]);

  // Filter resources based on search query
  const filteredResources = useMemo(() => {
    if (!resourceSearchQuery.trim()) {
      return resources;
    }
    
    const lowerQuery = resourceSearchQuery.toLowerCase();
    return resources.filter(resource => {
      const resourceName = (resource.resource_name || resource.resource_id_on_provider || '').toLowerCase();
      const resourceType = (resource.resource_type || '').toLowerCase();
      return resourceName.includes(lowerQuery) || resourceType.includes(lowerQuery);
    });
  }, [resources, resourceSearchQuery]);

  // Memoized tag creation handler
  const handleCreateTag = useCallback(async () => {
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
      
      // Refresh tagging patterns
      const patterns = analyzeTaggingPatterns(updatedTags);
      setTaggingPatterns(patterns);
      
      // Refresh untagged resources and compliance
      await fetchUntaggedResources();
      
      // Reset form and close dialog
      setNewTagKey('');
      setNewTagValue('');
      setSelectedResources([]);
      setResourceSearchQuery('');
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
  }, [newTagKey, newTagValue, selectedResources, organizationId, analyzeTaggingPatterns, fetchUntaggedResources, toast]);
  
  // Handle tag value remove
  const handleTagValueRemove = async (tagKey: string, tagValue: string) => {
    // Refresh the tags list after removing a tag
    try {
      const updatedTags = await tagsApi.getAll(organizationId);
      setTags(updatedTags);
      setFilteredTags(updatedTags);
      
      // Refresh tagging patterns
      const patterns = analyzeTaggingPatterns(updatedTags);
      setTaggingPatterns(patterns);
      
      // Refresh untagged resources and compliance
      await fetchUntaggedResources();
    } catch (error) {
      console.error('Error refreshing tags:', error);
    }
  };
  
  // View resources with a specific tag
  const viewResourcesWithTag = (tagKey: string, tagValue: string) => {
    toast({
      title: 'View Resources',
      description: `Viewing resources with tag ${tagKey}:${tagValue}`,
    });
  };

  // Export tags data to CSV
  const exportToCSV = () => {
    try {
      const csvHeaders = ['Tag Key', 'Tag Values', 'Resource Count'];
      const csvRows = filteredTags.map(tag => [
        tag.key,
        tag.values.join('; '),
        tag.resource_count.toString()
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `resource-tags-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export Successful',
        description: 'Tags exported to CSV successfully',
      });
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export tags to CSV',
        variant: 'destructive',
      });
    }
  };

  // Export tags data to PDF (simplified version)
  const exportToPDF = () => {
    try {
      // Create a simple HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Resource Tags Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px; }
            .summary { background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #059669; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .tag-values { max-width: 300px; word-wrap: break-word; }
          </style>
        </head>
        <body>
          <h1>Resource Tags Report</h1>
          <div class="summary">
            <p><strong>Total Tags:</strong> ${filteredTags.length}</p>
            <p><strong>Total Resources Tagged:</strong> ${filteredTags.reduce((total, tag) => total + tag.resource_count, 0)}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Tag Key</th>
                <th>Tag Values</th>
                <th>Resource Count</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTags.map(tag => `
                <tr>
                  <td><strong>${tag.key}</strong></td>
                  <td class="tag-values">${tag.values.join(', ')}</td>
                  <td>${tag.resource_count}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `resource-tags-${new Date().toISOString().split('T')[0]}.html`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: 'Tags exported to HTML report successfully',
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export tags report',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="bg-gray-50/30">
      {/* Header Section with seamless background */}
      <div className="bg-gradient-to-b from-gray-50/60 via-emerald-50/40 to-gray-50/30 p-6 border-b border-emerald-200/30">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Resource Tags ({loading ? '...' : filteredTags.reduce((total, tag) => total + tag.resource_count, 0)})
            </h2>
            <p className="text-gray-600 text-sm mt-1">Organize and categorize your cloud resources with custom tags</p>
          </div>
          <div className="flex gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/50 text-emerald-700 font-medium rounded-xl px-4 py-2 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                >
                  <Download size={16} className="text-emerald-500" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl border-gray-200 shadow-lg">
                <DropdownMenuItem 
                  onClick={exportToCSV}
                  className="rounded-lg cursor-pointer flex items-center gap-2 hover:bg-emerald-50"
                >
                  <FileSpreadsheet size={16} className="text-green-600" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={exportToPDF}
                  className="rounded-lg cursor-pointer flex items-center gap-2 hover:bg-emerald-50"
                >
                  <FileText size={16} className="text-blue-600" />
                  Export as Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-emerald-500" />
              </div>
              <Input
                type="text"
                placeholder="Search tags..."
                className="pl-10 pr-4 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl w-80 focus:ring-emerald-500 focus:ring-2 focus:border-transparent transition-all duration-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:bg-gradient-to-r hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 hover:scale-105 text-white rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 shadow-lg flex items-center gap-2" 
              onClick={() => setIsCreateTagOpen(true)}
            >
              <Plus size={16} />
              Create tag
            </Button>
          </div>
        </div>
      </div>
                
      <div className="bg-gradient-to-b from-gray-50/40 via-emerald-50/30 to-gray-50/20 p-6">

        {loading ? (
          <div className="bg-gradient-to-b from-gray-50/10 via-white/30 to-gray-50/15 backdrop-blur-sm rounded-2xl p-12 border border-emerald-200/20">
            <div className="flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin mr-2 text-emerald-600" />
              <p className="text-gray-600 font-medium">Loading tags...</p>
            </div>
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="bg-gradient-to-b from-gray-50/10 via-white/30 to-gray-50/15 backdrop-blur-sm rounded-2xl p-12 text-center border border-emerald-200/20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100/50 rounded-full flex items-center justify-center">
                <Plus className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                {searchQuery ? (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No tags found</h3>
                    <p className="text-gray-600 mb-4">No tags match your search query "{searchQuery}"</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setSearchQuery('')}
                      className="bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/50 text-emerald-700 rounded-xl px-4 py-2 transition-all duration-300 hover:scale-105"
                    >
                      Clear search
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No tags created yet</h3>
                    <p className="text-gray-600 mb-6">Start organizing your resources by creating your first tag</p>
                    <Button 
                      onClick={() => setIsCreateTagOpen(true)}
                      className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:bg-gradient-to-r hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 hover:scale-105 text-white rounded-xl px-6 py-3 transition-all duration-300 shadow-lg flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Create your first tag
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-b from-gray-50/5 via-gray-50/10 to-gray-50/20 overflow-hidden">
            <div className="max-h-[600px] overflow-auto">
              <div className="bg-gradient-to-b from-gray-50/10 via-white/30 to-gray-50/15 backdrop-blur-sm">
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="border-b border-emerald-200/20 bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30 backdrop-blur-sm">
                      <TableHead className="w-1/4 py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Tag Key</TableHead>
                      <TableHead className="w-3/4 py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Tag Values</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTags.slice(0, 50).map((tag, index) => (
                      <TableRow key={index} className="group border-b border-emerald-200/10 hover:bg-gradient-to-r hover:from-emerald-50/20 hover:via-gray-50/10 hover:to-emerald-50/20 transition-all duration-200 backdrop-blur-sm">
                        <TableCell className="py-4 px-6 font-medium">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">{tag.key}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 rounded-lg hover:bg-gray-100"
                                >
                                  <ChevronRight className="h-4 w-4 text-gray-500" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl border-gray-200 shadow-lg">
                                <DropdownMenuItem
                                  onClick={() => setIsCreateTagOpen(true)}
                                  className="rounded-lg cursor-pointer"
                                >
                                  Add new value
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-wrap items-center">
                            {tag.values.map((value, valueIndex) => (
                              <div
                                key={valueIndex}
                                className="relative group/tag cursor-pointer"
                                onClick={() => viewResourcesWithTag(tag.key, value)}
                              >
                                <TagItem
                                  value={value}
                                  tagKey={tag.key}
                                  organizationId={organizationId}
                                  onRemove={() => handleTagValueRemove(tag.key, value)}
                                />
                              </div>
                            ))}
                            <button
                              className="inline-flex items-center text-emerald-600 text-xs hover:text-emerald-800 hover:underline cursor-pointer ml-auto px-2 py-1 rounded-lg hover:bg-emerald-50 transition-all duration-200"
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
            </div>
          </div>
        )}
      </div>

      {/* Tagging Patterns Section */}
      <div className="bg-gradient-to-b from-gray-50/10 via-white/30 to-gray-50/15 backdrop-blur-sm rounded-2xl border border-emerald-200/20 mt-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-blue-600">
                📊 Common Tagging Patterns ({taggingPatterns.length})
              </h2>
              <p className="text-gray-600 text-sm mt-1">Most popular tagging strategies used across your resources</p>
            </div>
          </div>
          
          {taggingPatterns.length > 0 ? (
            <div className="overflow-x-auto">
              <div className={`flex gap-4 ${taggingPatterns.length > 4 ? 'min-w-max' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                {taggingPatterns.map((pattern, index) => (
                  <div
                    key={index}
                    className={`${taggingPatterns.length > 4 ? 'flex-shrink-0 w-80' : ''} bg-gradient-to-b from-blue-50/60 via-white/40 to-blue-50/30 border border-blue-200/30 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:scale-105 backdrop-blur-sm`}
                  >
                    {/* Pattern Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                        {pattern.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{pattern.category}</h3>
                        <p className="text-blue-600 text-sm font-medium">{pattern.tagCount} tag{pattern.tagCount !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    
                    {/* Pattern Description */}
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">{pattern.description}</p>
                    
                    {/* Pattern Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl p-3 text-center border border-blue-100/50">
                        <div className="text-xl font-bold text-blue-700">{pattern.totalResources}</div>
                        <div className="text-xs text-blue-600 font-medium">Resources</div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl p-3 text-center border border-blue-100/50">
                        <div className="text-xl font-bold text-blue-700">{pattern.uniqueValues}</div>
                        <div className="text-xs text-blue-600 font-medium">Values</div>
                      </div>
                    </div>
                    
                    {/* Sample Tags */}
                    <div>
                      <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">Sample Tags:</div>
                      <div className="flex flex-wrap gap-2">
                        {pattern.tags.slice(0, 3).map((tag: any, tagIndex: number) => (
                          <div key={tagIndex} className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-200/50">
                            {tag.key}
                            {tag.values.length > 0 && (
                              <span className="ml-1 text-blue-600">
                                ({tag.values.slice(0, 2).join(', ')}{tag.values.length > 2 ? '...' : ''})
                              </span>
                            )}
                          </div>
                        ))}
                        {pattern.tags.length > 3 && (
                          <div className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium">
                            +{pattern.tags.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tagging Patterns Yet</h3>
              <p className="text-gray-600 mb-4">Start creating tags to see common patterns emerge</p>
              <Button 
                onClick={() => setIsCreateTagOpen(true)}
                className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 hover:scale-105 text-white rounded-xl px-6 py-3 transition-all duration-300 shadow-lg"
              >
                Create Your First Tag
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Standard Tagging Compliance Section */}
      <div className="bg-gradient-to-b from-gray-50/10 via-white/30 to-gray-50/15 backdrop-blur-sm rounded-2xl border border-emerald-200/20 mt-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-orange-600">
              ⚠️ Tagging Compliance Issues ({complianceIssues.length})
            </h2>
          </div>
          
          {complianceIssues.length > 0 ? (
            <>
              <div className="max-h-[400px] overflow-auto">
                <div className="bg-gradient-to-b from-gray-50/10 via-white/30 to-gray-50/15 backdrop-blur-sm">
                  <Table>
                    <TableHeader className="sticky top-0 z-10">
                      <TableRow className="border-b border-emerald-200/20 bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30 backdrop-blur-sm">
                        <TableHead className="bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Resource Name</TableHead>
                        <TableHead className="bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Type</TableHead>
                        <TableHead className="bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Account</TableHead>
                        <TableHead className="bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Region</TableHead>
                        <TableHead className="bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Missing Tags</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {complianceIssues.map((issue, index) => (
                        <TableRow key={index} className="border-b border-emerald-200/10 hover:bg-gradient-to-r hover:from-orange-50/20 hover:via-gray-50/10 hover:to-orange-50/20 transition-all duration-200 backdrop-blur-sm border-l-4 border-l-orange-500">
                          <TableCell className="font-medium text-orange-800">
                            {issue.resource_name || issue.name || issue.resource_id_on_provider}
                          </TableCell>
                          <TableCell className="text-orange-700">
                            {issue.resource_type || issue.type}
                          </TableCell>
                          <TableCell className="text-orange-700">
                            {issue.account_id || 'Unknown'}
                          </TableCell>
                          <TableCell className="text-orange-700">
                            {issue.region || 'Unknown'}
                          </TableCell>
                          <TableCell className="text-orange-700 text-sm">
                            ⚠️ {issue.missingTag}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gradient-to-r from-orange-50/30 via-gray-50/20 to-orange-50/30 border border-orange-200/30 rounded-xl backdrop-blur-sm">
                <p className="text-sm text-orange-800">
                  📋 These resources should follow standard tagging conventions based on their names or environment.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-green-600 mb-2">✅</div>
              <p className="text-gray-600">No compliance issues found. All resources follow naming conventions!</p>
            </div>
          )}
        </div>
      </div>

      {/* Untagged Resources Section */}
      <div className="bg-gradient-to-b from-gray-50/10 via-white/30 to-gray-50/15 backdrop-blur-sm rounded-2xl border border-emerald-200/20 mt-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-red-600">
              🚨 Resources Untagged ({untaggedResources.length})
            </h2>
          </div>
          
          {untaggedResources.length > 0 ? (
            <div className="max-h-[400px] overflow-auto">
              <div className="bg-gradient-to-b from-gray-50/10 via-white/30 to-gray-50/15 backdrop-blur-sm">
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="border-b border-emerald-200/20 bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30 backdrop-blur-sm">
                      <TableHead className="bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Resource Name</TableHead>
                      <TableHead className="bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Type</TableHead>
                      <TableHead className="bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Account</TableHead>
                      <TableHead className="bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Region</TableHead>
                      <TableHead className="bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {untaggedResources.map((resource, index) => (
                      <TableRow key={index} className="border-b border-emerald-200/10 hover:bg-gradient-to-r hover:from-red-50/20 hover:via-gray-50/10 hover:to-red-50/20 transition-all duration-200 backdrop-blur-sm border-l-4 border-l-red-500">
                        <TableCell className="font-medium text-red-800">
                          {resource.name || resource.resource_name || resource.resource_id_on_provider}
                        </TableCell>
                        <TableCell className="text-red-700">
                          {resource.type || resource.resource_type}
                        </TableCell>
                        <TableCell className="text-red-700">
                          {resource.account_id || resource.account_name || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-red-700">
                          {resource.region || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-red-700 text-sm">
                          ⚠️ NO TAGS - Needs attention
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-green-600 mb-2">✅</div>
              <p className="text-gray-600">Great! All resources are properly tagged.</p>
            </div>
          )}
          
        </div>
      </div>
      
      {/* Create Tag Dialog */}
      <Dialog open={isCreateTagOpen} onOpenChange={setIsCreateTagOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-gray-200 shadow-lg">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-2xl font-semibold text-gray-900">Create Tag</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2">
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="tag-key" className="block text-sm font-medium text-gray-900">
                  Tag key <span className="text-red-500">*</span>
                </label>
                <Input
                  id="tag-key"
                  placeholder="Enter tag key (e.g., Environment, Team, Project)"
                  value={newTagKey}
                  onChange={(e) => setNewTagKey(e.target.value)}
                  className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="tag-value" className="block text-sm font-medium text-gray-900">
                  Tag value <span className="text-red-500">*</span>
                </label>
                <Input
                  id="tag-value"
                  placeholder="Enter tag value (e.g., Production, Development)"
                  value={newTagValue}
                  onChange={(e) => setNewTagValue(e.target.value)}
                  className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                  Apply to resources <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={16} className="text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Search resources..."
                      className="pl-10 w-full rounded-xl border-gray-200 focus:ring-emerald-500 focus:ring-2 transition-all duration-200"
                      value={resourceSearchQuery}
                      onChange={(e) => setResourceSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select onValueChange={(value: string) => setSelectedResources([value])}>
                    <SelectTrigger className="w-full rounded-xl border-gray-200 focus:ring-emerald-500 focus:ring-2 transition-all duration-200">
                      <SelectValue placeholder="Select resources to tag" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                      {filteredResources.length > 0 ? (
                        filteredResources.map((resource) => (
                          <SelectItem key={resource.id} value={resource.id} className="rounded-lg">
                            {resource.resource_name || resource.resource_id_on_provider} ({resource.resource_type})
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          {resourceSearchQuery ? 'No resources found matching your search' : 'No resources available'}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Search and select resources to apply this tag to. You can add more resources later.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 pt-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateTagOpen(false);
                setNewTagKey('');
                setNewTagValue('');
                setSelectedResources([]);
                setResourceSearchQuery('');
              }}
              disabled={creating}
              className="rounded-xl px-6 py-3 border-gray-200 hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTag}
              disabled={creating}
              className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 rounded-xl px-6 py-3 transition-all duration-200 shadow-lg"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Tag'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default TagsTab;