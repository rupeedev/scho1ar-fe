import React from 'react';
import { 
  Cloud, 
  Server, 
  Database, 
  Container, 
  Layers, 
  Network, 
  Activity,
  HardDrive,
  Zap,
  Eye,
  BarChart3,
  LineChart,
  Archive,
  FileText,
  Settings,
  Image,
  Package,
  Shield,
  Lock,
  Key,
  UserCheck,
  Globe,
  Cpu,
  GitBranch,
  Workflow,
  Bell,
  Mail,
  MessageSquare,
  Search,
  Brain,
  Mic,
  FileSearch,
  Bot,
  Monitor,
  Wifi,
  Radio,
  Video,
  FolderSync,
  HardDriveDownload,
  RefreshCw,
  Compass,
  Microscope,
  ShieldCheck,
  AlertTriangle,
  Router,
  FolderOpen,
  Users,
  Briefcase,
  BarChart2
} from 'lucide-react';

interface IconProps {
  className?: string;
}

// AWS Service Icon Components using Lucide icons as placeholders
// TODO: Replace with official AWS icons downloaded from AWS Architecture Icons set

export const EC2Icon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Server className={`${className} text-orange-500`} />
);

export const EBSIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <HardDrive className={`${className} text-blue-500`} />
);

export const LambdaIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Zap className={`${className} text-orange-600`} />
);

export const ECSIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Container className={`${className} text-purple-500`} />
);

export const RDSIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Database className={`${className} text-blue-600`} />
);

export const DynamoDBIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Archive className={`${className} text-red-500`} />
);

export const S3Icon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Container className={`${className} text-green-500`} />
);

export const VPCIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Network className={`${className} text-purple-500`} />
);

export const ELBIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Layers className={`${className} text-pink-500`} />
);

export const CloudWatchIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Activity className={`${className} text-blue-500`} />
);

export const CloudWatchMetricIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <LineChart className={`${className} text-blue-500`} />
);

export const CloudWatchAlarmIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Eye className={`${className} text-red-500`} />
);

export const CloudWatchDashboardIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <BarChart3 className={`${className} text-blue-600`} />
);

export const SSMIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <FileText className={`${className} text-gray-600`} />
);

export const ConfigIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Settings className={`${className} text-green-600`} />
);

export const AppStreamIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Image className={`${className} text-blue-500`} />
);

export const ECRIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Package className={`${className} text-orange-500`} />
);

// Additional AWS Service Icons
export const KMSIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Key className={`${className} text-yellow-600`} />
);

export const SecretsManagerIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Lock className={`${className} text-red-600`} />
);

export const ACMIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Shield className={`${className} text-green-600`} />
);

export const GuardDutyIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <ShieldCheck className={`${className} text-orange-600`} />
);

export const Route53Icon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Globe className={`${className} text-purple-600`} />
);

export const CloudFrontIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Globe className={`${className} text-blue-600`} />
);

export const APIGatewayIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Router className={`${className} text-pink-600`} />
);

export const LightsailIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Server className={`${className} text-blue-500`} />
);

export const BatchIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Cpu className={`${className} text-green-600`} />
);

export const ElasticBeanstalkIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <GitBranch className={`${className} text-green-500`} />
);

export const StepFunctionsIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Workflow className={`${className} text-pink-500`} />
);

export const SNSIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Bell className={`${className} text-orange-500`} />
);

export const SQSIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Mail className={`${className} text-yellow-500`} />
);

export const EventBridgeIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <GitBranch className={`${className} text-purple-500`} />
);

export const CloudFormationIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Layers className={`${className} text-blue-500`} />
);

export const CloudTrailIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <FileSearch className={`${className} text-green-500`} />
);

export const XRayIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Microscope className={`${className} text-blue-500`} />
);

export const WAFIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Shield className={`${className} text-red-500`} />
);

export const IAMIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <UserCheck className={`${className} text-orange-500`} />
);

export const RedshiftIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Database className={`${className} text-red-600`} />
);

export const AthenaIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Search className={`${className} text-purple-600`} />
);

export const KinesisIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Activity className={`${className} text-orange-600`} />
);

export const SageMakerIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Brain className={`${className} text-green-600`} />
);

export const TranslateIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <MessageSquare className={`${className} text-blue-600`} />
);

export const PollyIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Mic className={`${className} text-purple-600`} />
);

export const LexIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Bot className={`${className} text-blue-600`} />
);

export const WorkSpacesIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Monitor className={`${className} text-blue-600`} />
);

export const IoTCoreIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Wifi className={`${className} text-green-600`} />
);

export const BackupIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <HardDriveDownload className={`${className} text-green-500`} />
);

export const DataSyncIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <FolderSync className={`${className} text-blue-500`} />
);

export const DirectConnectIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Radio className={`${className} text-purple-600`} />
);

export const MediaServicesIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Video className={`${className} text-red-600`} />
);

export const SecurityHubIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <ShieldCheck className={`${className} text-orange-500`} />
);

export const DetectiveIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Compass className={`${className} text-blue-600`} />
);

export const NetworkFirewallIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <AlertTriangle className={`${className} text-red-600`} />
);

export const DirectoryServiceIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Users className={`${className} text-blue-500`} />
);

export const ElastiCacheIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <Database className={`${className} text-red-500`} />
);

export const EMRIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <BarChart2 className={`${className} text-purple-600`} />
);

export const QuickSightIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => (
  <BarChart3 className={`${className} text-yellow-600`} />
);

/**
 * Enhanced AWS Resource Icon Mapper
 * Maps discovered resource types to their appropriate AWS service icons
 * Handles both traditional resource type formats and AWS Config-style formats
 */
export const getAwsResourceIcon = (resourceType: string, className: string = "h-8 w-8"): React.ReactElement => {
  const type = resourceType.toUpperCase();
  
  // Handle AWS Config-style resource types (e.g., "AWS::EC2::Instance")
  const normalizedType = type.replace(/AWS::/g, '').replace(/::/g, '_');
  
  // Compute & Container Services (EC2, Lambda, ECS)
  if (normalizedType.includes('EC2_INSTANCE') || normalizedType.includes('EC2INSTANCE')) return <EC2Icon className={className} />;
  if (normalizedType.includes('EBS_VOLUME') || normalizedType.includes('EBSVOLUME') || normalizedType === 'EBS VOLUME') return <EBSIcon className={className} />;
  if (normalizedType.includes('LAMBDA_FUNCTION') || normalizedType.includes('LAMBDAFUNCTION')) return <LambdaIcon className={className} />;
  
  // ECS Services - Different icons for different ECS resource types
  if (normalizedType.includes('ECS_CLUSTER') || normalizedType.includes('ECSCLUSTER')) return <ECSIcon className={`${className} text-purple-500`} />;
  if (normalizedType.includes('ECS_SERVICE') || normalizedType.includes('ECSSERVICE')) return <ECSIcon className={`${className} text-purple-600`} />;
  if (normalizedType.includes('ECS_TASK') || normalizedType.includes('ECSTASK')) return <ECSIcon className={`${className} text-purple-400`} />;
  if (normalizedType.includes('ECR_REPOSITORY') || normalizedType.includes('ECRREPOSITORY')) return <ECRIcon className={className} />;
  
  // Database Services (RDS, DynamoDB)
  if (normalizedType.includes('RDS_INSTANCE') || normalizedType.includes('RDSINSTANCE')) return <RDSIcon className={`${className} text-blue-600`} />;
  if (normalizedType.includes('RDS_SNAPSHOT') || normalizedType.includes('RDSSNAPSHOT')) return <RDSIcon className={`${className} text-blue-400`} />;
  if (normalizedType.includes('DYNAMODB_TABLE') || normalizedType.includes('DYNAMODBTABLE')) return <DynamoDBIcon className={className} />;
  
  // Storage Services (S3)
  if (normalizedType.includes('S3_BUCKET') || normalizedType.includes('S3BUCKET')) return <S3Icon className={className} />;
  if (normalizedType.includes('S3') && normalizedType.includes('STORAGE')) return <S3Icon className={className} />;
  if (normalizedType.includes('S3') && !normalizedType.includes('BUCKET')) return <S3Icon className={className} />; // Handle S3 Storage Lens and other S3 services
  
  // Networking Services (VPC, ELB)
  if (normalizedType.includes('VPC') && !normalizedType.includes('SUBNET')) return <VPCIcon className={`${className} text-purple-500`} />;
  if (normalizedType.includes('SUBNET')) return <VPCIcon className={`${className} text-purple-400`} />;
  if (normalizedType.includes('INTERNET_GATEWAY') || normalizedType.includes('INTERNETGATEWAY')) return <VPCIcon className={`${className} text-purple-600`} />;
  if (normalizedType.includes('NAT_GATEWAY') || normalizedType.includes('NATGATEWAY')) return <VPCIcon className={`${className} text-purple-700`} />;
  if (normalizedType.includes('ELB') || normalizedType.includes('LOADBALANCER')) return <ELBIcon className={className} />;
  
  // Monitoring Services (CloudWatch) - Specific icons for different CloudWatch resources
  if (normalizedType.includes('CLOUDWATCH_METRIC') || normalizedType.includes('CLOUDWATCHMETRIC')) return <CloudWatchMetricIcon className={className} />;
  if (normalizedType.includes('CLOUDWATCH_ALARM') || normalizedType.includes('CLOUDWATCHALARM')) return <CloudWatchAlarmIcon className={className} />;
  if (normalizedType.includes('CLOUDWATCH_DASHBOARD') || normalizedType.includes('CLOUDWATCHDASHBOARD')) return <CloudWatchDashboardIcon className={className} />;
  
  // AWS Systems Manager (SSM)
  if (normalizedType.includes('SSM_DOCUMENT') || normalizedType.includes('SSMDOCUMENT')) return <SSMIcon className={className} />;
  
  // AWS Config
  if (normalizedType.includes('CONFIG_CONFIGURATION') || normalizedType.includes('CONFIGCONFIGURATION')) return <ConfigIcon className={className} />;
  if (normalizedType.includes('CONFIG_RULE') || normalizedType.includes('CONFIGRULE')) return <ConfigIcon className={className} />;
  
  // AWS AppStream
  if (normalizedType.includes('APPSTREAM_IMAGE') || normalizedType.includes('APPSTREAMIMAGE')) return <AppStreamIcon className={className} />;
  
  // Security Services
  if (normalizedType.includes('KMS') || normalizedType.includes('KEY_MANAGEMENT')) return <KMSIcon className={className} />;
  if (normalizedType.includes('SECRETS_MANAGER') || normalizedType.includes('SECRETSMANAGER')) return <SecretsManagerIcon className={className} />;
  if (normalizedType.includes('ACM') || normalizedType.includes('CERTIFICATE_MANAGER')) return <ACMIcon className={className} />;
  if (normalizedType.includes('GUARDDUTY')) return <GuardDutyIcon className={className} />;
  if (normalizedType.includes('SECURITYHUB') || normalizedType.includes('SECURITY_HUB')) return <SecurityHubIcon className={className} />;
  if (normalizedType.includes('DETECTIVE')) return <DetectiveIcon className={className} />;
  if (normalizedType.includes('NETWORK_FIREWALL') || normalizedType.includes('NETWORKFIREWALL')) return <NetworkFirewallIcon className={className} />;
  if (normalizedType.includes('WAF') || normalizedType.includes('WEB_APPLICATION_FIREWALL')) return <WAFIcon className={className} />;
  if (normalizedType.includes('IAM') || normalizedType.includes('IDENTITY_ACCESS')) return <IAMIcon className={className} />;
  if (normalizedType.includes('DIRECTORY_SERVICE') || normalizedType.includes('DIRECTORYSERVICE')) return <DirectoryServiceIcon className={className} />;
  
  // Networking Services
  if (normalizedType.includes('ROUTE53') || normalizedType.includes('ROUTE_53')) return <Route53Icon className={className} />;
  if (normalizedType.includes('CLOUDFRONT')) return <CloudFrontIcon className={className} />;
  if (normalizedType.includes('API_GATEWAY') || normalizedType.includes('APIGATEWAY')) return <APIGatewayIcon className={className} />;
  if (normalizedType.includes('DIRECT_CONNECT') || normalizedType.includes('DIRECTCONNECT')) return <DirectConnectIcon className={className} />;
  if (normalizedType.includes('TRANSIT_GATEWAY') || normalizedType.includes('TRANSITGATEWAY')) return <Network className={`${className} text-purple-600`} />;
  if (normalizedType.includes('GLOBAL_ACCELERATOR') || normalizedType.includes('GLOBALACCELERATOR')) return <Globe className={`${className} text-orange-600`} />;
  
  // Compute Services
  if (normalizedType.includes('LIGHTSAIL')) return <LightsailIcon className={className} />;
  if (normalizedType.includes('BATCH')) return <BatchIcon className={className} />;
  if (normalizedType.includes('ELASTIC_BEANSTALK') || normalizedType.includes('ELASTICBEANSTALK') || normalizedType.includes('BEANSTALK')) return <ElasticBeanstalkIcon className={className} />;
  
  // Developer Tools
  if (normalizedType.includes('CLOUDFORMATION') || normalizedType.includes('CLOUD_FORMATION')) return <CloudFormationIcon className={className} />;
  if (normalizedType.includes('CLOUDTRAIL') || normalizedType.includes('CLOUD_TRAIL')) return <CloudTrailIcon className={className} />;
  if (normalizedType.includes('XRAY') || normalizedType.includes('X-RAY') || normalizedType.includes('X_RAY')) return <XRayIcon className={className} />;
  if (normalizedType.includes('STEP_FUNCTIONS') || normalizedType.includes('STEPFUNCTIONS')) return <StepFunctionsIcon className={className} />;
  if (normalizedType.includes('EVENTBRIDGE') || normalizedType.includes('EVENT_BRIDGE')) return <EventBridgeIcon className={className} />;
  
  // Messaging Services
  if (normalizedType.includes('SNS') || normalizedType.includes('SIMPLE_NOTIFICATION')) return <SNSIcon className={className} />;
  if (normalizedType.includes('SQS') || normalizedType.includes('SIMPLE_QUEUE')) return <SQSIcon className={className} />;
  
  // Analytics Services
  if (normalizedType.includes('REDSHIFT')) return <RedshiftIcon className={className} />;
  if (normalizedType.includes('ATHENA')) return <AthenaIcon className={className} />;
  if (normalizedType.includes('KINESIS')) return <KinesisIcon className={className} />;
  if (normalizedType.includes('ELASTICACHE') || normalizedType.includes('ELASTIC_CACHE')) return <ElastiCacheIcon className={className} />;
  if (normalizedType.includes('EMR') || normalizedType.includes('ELASTIC_MAPREDUCE')) return <EMRIcon className={className} />;
  if (normalizedType.includes('QUICKSIGHT') || normalizedType.includes('QUICK_SIGHT')) return <QuickSightIcon className={className} />;
  if (normalizedType.includes('OPENSEARCH') || normalizedType.includes('OPEN_SEARCH') || normalizedType.includes('ELASTICSEARCH')) return <Search className={`${className} text-orange-600`} />;
  if (normalizedType.includes('MSK') || normalizedType.includes('KAFKA')) return <Activity className={`${className} text-purple-600`} />;
  if (normalizedType.includes('NEPTUNE')) return <Database className={`${className} text-blue-700`} />;
  if (normalizedType.includes('DOCUMENTDB') || normalizedType.includes('DOCUMENT_DB')) return <Database className={`${className} text-green-700`} />;
  if (normalizedType.includes('TIMESTREAM')) return <Database className={`${className} text-purple-700`} />;
  
  // Machine Learning
  if (normalizedType.includes('SAGEMAKER') || normalizedType.includes('SAGE_MAKER')) return <SageMakerIcon className={className} />;
  if (normalizedType.includes('COMPREHEND')) return <Brain className={`${className} text-blue-600`} />;
  if (normalizedType.includes('REKOGNITION')) return <Eye className={`${className} text-green-600`} />;
  if (normalizedType.includes('TEXTRACT')) return <FileSearch className={`${className} text-orange-600`} />;
  if (normalizedType.includes('TRANSLATE')) return <TranslateIcon className={className} />;
  if (normalizedType.includes('POLLY')) return <PollyIcon className={className} />;
  if (normalizedType.includes('LEX')) return <LexIcon className={className} />;
  if (normalizedType.includes('BEDROCK')) return <Brain className={`${className} text-purple-600`} />;
  
  // Enterprise Services
  if (normalizedType.includes('WORKSPACES') || normalizedType.includes('WORK_SPACES')) return <WorkSpacesIcon className={className} />;
  if (normalizedType.includes('CONNECT')) return <Briefcase className={`${className} text-blue-600`} />;
  if (normalizedType.includes('CHIME')) return <Video className={`${className} text-blue-500`} />;
  if (normalizedType.includes('WORKMAIL') || normalizedType.includes('WORK_MAIL')) return <Mail className={`${className} text-orange-600`} />;
  
  // IoT Services
  if (normalizedType.includes('IOT_CORE') || normalizedType.includes('IOTCORE') || normalizedType.includes('IOT')) return <IoTCoreIcon className={className} />;
  if (normalizedType.includes('GREENGRASS') || normalizedType.includes('GREEN_GRASS')) return <Cpu className={`${className} text-green-700`} />;
  
  // Storage & Backup
  if (normalizedType.includes('EFS') || normalizedType.includes('ELASTIC_FILE')) return <FolderOpen className={`${className} text-orange-600`} />;
  if (normalizedType.includes('FSX')) return <HardDrive className={`${className} text-blue-600`} />;
  if (normalizedType.includes('STORAGE_GATEWAY') || normalizedType.includes('STORAGEGATEWAY')) return <HardDrive className={`${className} text-gray-600`} />;
  if (normalizedType.includes('BACKUP')) return <BackupIcon className={className} />;
  if (normalizedType.includes('DATASYNC') || normalizedType.includes('DATA_SYNC')) return <DataSyncIcon className={className} />;
  if (normalizedType.includes('TRANSFER_FAMILY') || normalizedType.includes('TRANSFERFAMILY')) return <RefreshCw className={`${className} text-blue-600`} />;
  
  // Media Services
  if (normalizedType.includes('MEDIALIVE') || normalizedType.includes('MEDIA_LIVE')) return <MediaServicesIcon className={className} />;
  if (normalizedType.includes('MEDIACONVERT') || normalizedType.includes('MEDIA_CONVERT')) return <MediaServicesIcon className={className} />;
  if (normalizedType.includes('ELEMENTAL')) return <MediaServicesIcon className={className} />;
  
  // Other Services
  if (normalizedType.includes('APPSYNC') || normalizedType.includes('APP_SYNC')) return <GitBranch className={`${className} text-pink-600`} />;
  if (normalizedType.includes('SHIELD')) return <Shield className={`${className} text-orange-700`} />;
  
  // Default fallback for unmapped resource types
  return <Cloud className={`${className} text-gray-500`} />
};

/**
 * Get service category color for consistent theming
 */
export const getServiceCategoryColor = (resourceType: string): string => {
  const type = resourceType.toUpperCase().replace(/AWS::/g, '').replace(/::/g, '_');
  
  if (type.includes('EC2') || type.includes('LAMBDA') || type.includes('ECS')) return 'orange';
  if (type.includes('ECR')) return 'orange';
  if (type.includes('RDS') || type.includes('DYNAMODB')) return 'blue';
  if (type.includes('S3')) return 'green';
  if (type.includes('VPC') || type.includes('SUBNET') || type.includes('GATEWAY') || type.includes('ELB')) return 'purple';
  if (type.includes('CLOUDWATCH')) return 'blue';
  if (type.includes('SSM')) return 'gray';
  if (type.includes('CONFIG')) return 'green';
  if (type.includes('APPSTREAM')) return 'blue';
  
  return 'gray';
};

/**
 * Resource type display name formatter
 * Converts technical resource types to user-friendly names
 * Handles both traditional and AWS Config-style formats
 */
export const formatResourceTypeName = (resourceType: string): string => {
  // First, clean up any excessive spaces in the input
  const cleanedType = resourceType.replace(/\s+/g, ' ').trim();
  
  // Handle AWS Config-style resource types (e.g., "AWS::EC2::Instance" or "Aws::Ssm::Document")
  if (cleanedType.includes('::')) {
    const parts = cleanedType.split('::');
    if (parts.length >= 3) {
      // Remove AWS/Aws prefix and format the service and resource type
      const service = parts[1];
      const resource = parts[2];
      
      // Special formatting for common services
      const serviceMap: Record<string, string> = {
        'EC2': 'EC2',
        'SSM': 'SSM',
        'CONFIG': 'Config',
        'APPSTREAM': 'AppStream',
        'S3': 'S3',
        'RDS': 'RDS',
        'LAMBDA': 'Lambda',
        'ECS': 'ECS',
        'ECR': 'ECR',
        'VPC': 'VPC',
        'ELB': 'ELB',
        'CLOUDWATCH': 'CloudWatch',
        'DYNAMODB': 'DynamoDB'
      };
      
      const formattedService = serviceMap[service.toUpperCase()] || service;
      const formattedResource = resource.replace(/([A-Z])/g, ' $1').trim();
      
      // Special cases for better readability
      if (service.toUpperCase() === 'SSM' && resource === 'Document') {
        return 'SSM Document';
      }
      if (service.toUpperCase() === 'CONFIG' && resource === 'ConfigRule') {
        return 'Config Rule';
      }
      if (service.toUpperCase() === 'APPSTREAM' && resource === 'Image') {
        return 'AppStream Image';
      }
      if (service.toUpperCase() === 'ECR' && resource === 'Repository') {
        return 'ECR Repository';
      }
      
      return `${formattedService} ${formattedResource}`;
    }
  }
  
  // Handle space-separated format (e.g., "EBS Volume")
  if (cleanedType.includes(' ')) {
    return cleanedType;
  }
  
  const type = cleanedType.toUpperCase();
  
  // Format common resource types for better readability
  const typeMap: Record<string, string> = {
    'EC2_INSTANCE': 'EC2 Instance',
    'EC2INSTANCE': 'EC2 Instance',
    'EBS_VOLUME': 'EBS Volume',
    'EBSVOLUME': 'EBS Volume',
    'EBS VOLUME': 'EBS Volume',
    'LAMBDA_FUNCTION': 'Lambda Function',
    'LAMBDAFUNCTION': 'Lambda Function',
    'ECS_CLUSTER': 'ECS Cluster',
    'ECSCLUSTER': 'ECS Cluster',
    'ECS_SERVICE': 'ECS Service',
    'ECSSERVICE': 'ECS Service',
    'ECS_TASK': 'ECS Task',
    'ECSTASK': 'ECS Task',
    'ECR_REPOSITORY': 'ECR Repository',
    'ECRREPOSITORY': 'ECR Repository',
    'RDS_INSTANCE': 'RDS Instance',
    'RDSINSTANCE': 'RDS Instance',
    'RDS_SNAPSHOT': 'RDS Snapshot',
    'RDSSNAPSHOT': 'RDS Snapshot',
    'DYNAMODB_TABLE': 'DynamoDB Table',
    'DYNAMODBTABLE': 'DynamoDB Table',
    'S3_BUCKET': 'S3 Bucket',
    'S3BUCKET': 'S3 Bucket',
    'VPC': 'VPC',
    'SUBNET': 'Subnet',
    'INTERNET_GATEWAY': 'Internet Gateway',
    'INTERNETGATEWAY': 'Internet Gateway',
    'NAT_GATEWAY': 'NAT Gateway',
    'NATGATEWAY': 'NAT Gateway',
    'ELB': 'Load Balancer',
    'CLOUDWATCH_METRIC': 'CloudWatch Metric',
    'CLOUDWATCHMETRIC': 'CloudWatch Metric',
    'CLOUDWATCH_ALARM': 'CloudWatch Alarm',
    'CLOUDWATCHALARM': 'CloudWatch Alarm',
    'CLOUDWATCH_DASHBOARD': 'CloudWatch Dashboard',
    'CLOUDWATCHDASHBOARD': 'CloudWatch Dashboard',
    'SSM_DOCUMENT': 'SSM Document',
    'SSMDOCUMENT': 'SSM Document',
    'SSM_MANAGED_INSTANCE': 'SSM Managed Instance',
    'SSMMANAGEDINSTANCE': 'SSM Managed Instance',
    'CONFIG_CONFIGRULE': 'Config Rule',
    'CONFIGCONFIGRULE': 'Config Rule',
    'APPSTREAM_IMAGE': 'AppStream Image',
    'APPSTREAMIMAGE': 'AppStream Image',
    // Security Services
    'KMS': 'KMS',
    'KMS_KEY': 'KMS Key',
    'SECRETS_MANAGER': 'Secrets Manager',
    'SECRETSMANAGER': 'Secrets Manager',
    'ACM': 'Certificate Manager',
    'CERTIFICATE_MANAGER': 'Certificate Manager',
    'GUARDDUTY': 'GuardDuty',
    'GUARDDUTY_DETECTOR': 'GuardDuty Detector',
    'WAF': 'WAF',
    'WAF_WEB_ACL': 'WAF Web ACL',
    'SHIELD': 'Shield',
    'SECURITY_HUB': 'Security Hub',
    'SECURITYHUB': 'Security Hub',
    'DETECTIVE': 'Detective',
    'NETWORK_FIREWALL': 'Network Firewall',
    'NETWORKFIREWALL': 'Network Firewall',
    'DIRECTORY_SERVICE': 'Directory Service',
    'DIRECTORYSERVICE': 'Directory Service',
    'IAM': 'IAM',
    'IAM_USER': 'IAM User',
    'IAM_ROLE': 'IAM Role',
    'IAM_POLICY': 'IAM Policy',
    // Networking
    'ROUTE53': 'Route 53',
    'ROUTE_53': 'Route 53',
    'CLOUDFRONT': 'CloudFront',
    'CLOUDFRONT_DISTRIBUTION': 'CloudFront Distribution',
    'API_GATEWAY': 'API Gateway',
    'APIGATEWAY': 'API Gateway',
    'DIRECT_CONNECT': 'Direct Connect',
    'DIRECTCONNECT': 'Direct Connect',
    'TRANSIT_GATEWAY': 'Transit Gateway',
    'TRANSITGATEWAY': 'Transit Gateway',
    'GLOBAL_ACCELERATOR': 'Global Accelerator',
    'GLOBALACCELERATOR': 'Global Accelerator',
    // Compute
    'LIGHTSAIL': 'Lightsail',
    'BATCH': 'Batch',
    'ELASTIC_BEANSTALK': 'Elastic Beanstalk',
    'ELASTICBEANSTALK': 'Elastic Beanstalk',
    // Developer Tools
    'CLOUDFORMATION': 'CloudFormation',
    'CLOUDFORMATION_STACK': 'CloudFormation Stack',
    'CLOUDTRAIL': 'CloudTrail',
    'CLOUDTRAIL_TRAIL': 'CloudTrail Trail',
    'XRAY': 'X-Ray',
    'X-RAY': 'X-Ray',
    'X_RAY': 'X-Ray',
    'STEP_FUNCTIONS': 'Step Functions',
    'STEPFUNCTIONS': 'Step Functions',
    'EVENTBRIDGE': 'EventBridge',
    'EVENT_BRIDGE': 'EventBridge',
    // Messaging
    'SNS': 'SNS',
    'SNS_TOPIC': 'SNS Topic',
    'SQS': 'SQS',
    'SQS_QUEUE': 'SQS Queue',
    // Analytics
    'REDSHIFT': 'Redshift',
    'REDSHIFT_CLUSTER': 'Redshift Cluster',
    'ATHENA': 'Athena',
    'KINESIS': 'Kinesis',
    'KINESIS_STREAM': 'Kinesis Stream',
    'ELASTICACHE': 'ElastiCache',
    'ELASTIC_CACHE': 'ElastiCache',
    'EMR': 'EMR',
    'EMR_CLUSTER': 'EMR Cluster',
    'QUICKSIGHT': 'QuickSight',
    'QUICK_SIGHT': 'QuickSight',
    'OPENSEARCH': 'OpenSearch',
    'OPEN_SEARCH': 'OpenSearch',
    'MSK': 'MSK',
    'MSK_CLUSTER': 'MSK Cluster',
    'NEPTUNE': 'Neptune',
    'DOCUMENTDB': 'DocumentDB',
    'DOCUMENT_DB': 'DocumentDB',
    'TIMESTREAM': 'Timestream',
    // Machine Learning
    'SAGEMAKER': 'SageMaker',
    'SAGE_MAKER': 'SageMaker',
    'COMPREHEND': 'Comprehend',
    'REKOGNITION': 'Rekognition',
    'TEXTRACT': 'Textract',
    'TRANSLATE': 'Translate',
    'POLLY': 'Polly',
    'LEX': 'Lex',
    'BEDROCK': 'Bedrock',
    // Enterprise
    'WORKSPACES': 'WorkSpaces',
    'WORK_SPACES': 'WorkSpaces',
    'CONNECT': 'Connect',
    'CHIME': 'Chime',
    'WORKMAIL': 'WorkMail',
    'WORK_MAIL': 'WorkMail',
    // IoT
    'IOT_CORE': 'IoT Core',
    'IOTCORE': 'IoT Core',
    'IOT': 'IoT',
    'GREENGRASS': 'Greengrass',
    'GREEN_GRASS': 'Greengrass',
    // Storage
    'EFS': 'EFS',
    'FSX': 'FSx',
    'STORAGE_GATEWAY': 'Storage Gateway',
    'STORAGEGATEWAY': 'Storage Gateway',
    'BACKUP': 'Backup',
    'DATASYNC': 'DataSync',
    'DATA_SYNC': 'DataSync',
    'TRANSFER_FAMILY': 'Transfer Family',
    'TRANSFERFAMILY': 'Transfer Family',
    // Media
    'MEDIALIVE': 'MediaLive',
    'MEDIA_LIVE': 'MediaLive',
    'MEDIACONVERT': 'MediaConvert',
    'MEDIA_CONVERT': 'MediaConvert',
    'ELEMENTAL': 'Elemental',
    // Other
    'APPSYNC': 'AppSync',
    'APP_SYNC': 'AppSync'
  };
  
  return typeMap[type] || type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * AWS Resource Icon Statistics Display Component
 * Optimized for the discovered resource breakdown
 */
interface ResourceIconStatsProps {
  resourceType: string;
  count: number;
  className?: string;
}

export const ResourceIconStats: React.FC<ResourceIconStatsProps> = ({ 
  resourceType, 
  count, 
  className = "flex flex-col items-center text-center min-w-[120px] flex-shrink-0" 
}) => {
  // Clean up resourceType - handle cases with excessive spacing
  let cleanedResourceType = resourceType.trim();
  
  // First check if it's AWS Config format already
  if (cleanedResourceType.includes('::') && !cleanedResourceType.includes(' ')) {
    // It's already in the right format, just use it
    cleanedResourceType = cleanedResourceType;
  }
  // Handle cases with spaces between every character or word
  else {
    // Remove all spaces to get clean version
    const noSpaces = cleanedResourceType.replace(/\s+/g, '');
    
    // Map to proper format based on known patterns
    if (noSpaces.toUpperCase() === 'SSMDOCUMENT') {
      cleanedResourceType = 'SSM_DOCUMENT';
    } else if (noSpaces.toUpperCase() === 'CONFIGCONFIGRULE') {
      cleanedResourceType = 'CONFIG_CONFIGRULE';
    } else if (noSpaces.toUpperCase() === 'APPSTREAMIMAGE') {
      cleanedResourceType = 'APPSTREAM_IMAGE';
    } else if (noSpaces.toUpperCase() === 'ECRREPOSITORY') {
      cleanedResourceType = 'ECR_REPOSITORY';
    } else if (noSpaces.toUpperCase() === 'SSMMANAGEDINSTANCE') {
      cleanedResourceType = 'SSM_MANAGED_INSTANCE';
    } else if (noSpaces.toUpperCase() === 'S3BUCKET') {
      cleanedResourceType = 'S3_BUCKET';
    } else if (noSpaces.toUpperCase() === 'EC2INSTANCE') {
      cleanedResourceType = 'EC2_INSTANCE';
    } else if (noSpaces.toUpperCase() === 'EBSVOLUME') {
      cleanedResourceType = 'EBS_VOLUME';
    } else if (noSpaces.toUpperCase() === 'CLOUDWATCHMETRIC') {
      cleanedResourceType = 'CLOUDWATCH_METRIC';
    } else {
      // For any unrecognized pattern, just use the no-spaces version
      cleanedResourceType = noSpaces;
    }
  }
  
  const icon = getAwsResourceIcon(cleanedResourceType, "h-8 w-8");
  const displayName = formatResourceTypeName(cleanedResourceType);
  const categoryColor = getServiceCategoryColor(cleanedResourceType);
  
  // Ensure the display name doesn't have excessive spaces
  const cleanDisplayName = displayName.replace(/\s+/g, ' ').trim();
  
  return (
    <div className={className}>
      <div className="mb-3">
        {icon}
      </div>
      <div className={`text-2xl font-semibold text-${categoryColor}-600 mb-1`}>
        {count.toLocaleString()}
      </div>
      <div className="text-sm text-gray-600 font-medium whitespace-nowrap">
        {cleanDisplayName}
      </div>
    </div>
  );
};

// Icons are already exported above as individual components