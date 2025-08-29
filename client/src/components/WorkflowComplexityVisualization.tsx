import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  BarChart3, 
  GitBranch, 
  Zap, 
  AlertCircle, 
  Shield, 
  Database, 
  ExternalLink,
  Info,
  TrendingUp,
  Activity
} from 'lucide-react';
import { 
  calculateWorkflowComplexity, 
  ComplexityMetrics, 
  WorkflowData,
  getComplexityColor,
  getComplexityIcon 
} from '@/utils/workflowComplexity';

interface WorkflowComplexityVisualizationProps {
  workflowData: WorkflowData;
  showDetailedView?: boolean;
  className?: string;
}

const ComplexityFactorCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: number;
  maxValue: number;
  description: string;
  color: string;
}> = ({ icon, title, value, maxValue, description, color }) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="cursor-help hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className={`p-2 rounded-lg ${color}`}>
                  {icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{title}</h4>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
              </div>
              <Progress value={percentage} className="h-2" />
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          <p className="text-sm mt-1">Current: {value} | Impact: {percentage.toFixed(0)}%</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const WorkflowComplexityVisualization: React.FC<WorkflowComplexityVisualizationProps> = ({
  workflowData,
  showDetailedView = false,
  className = ''
}) => {
  const [expandedView, setExpandedView] = useState(showDetailedView);
  const complexity = calculateWorkflowComplexity(workflowData);

  // Simple view for inline display
  if (!expandedView) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`inline-flex items-center space-x-2 cursor-pointer ${className}`}
              onClick={() => setExpandedView(true)}
            >
              <Badge 
                variant="outline" 
                className={`${getComplexityColor(complexity.level)} font-medium`}
              >
                <span className="mr-1">{getComplexityIcon(complexity.level)}</span>
                {complexity.level.charAt(0).toUpperCase() + complexity.level.slice(1)}
                <span className="ml-1 text-xs">({complexity.totalScore})</span>
              </Badge>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm">
            <div className="space-y-2">
              <p className="font-medium">Workflow Complexity: {complexity.level}</p>
              <p className="text-sm">Score: {complexity.totalScore}/120+</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Nodes: {complexity.factors.nodeCount}</div>
                <div>Services: {complexity.factors.externalServices}</div>
                <div>Logic: {complexity.factors.conditionalLogic}</div>
                <div>Transforms: {complexity.factors.dataTransformations}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Click for detailed analysis
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Detailed view
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with overall complexity */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Workflow Complexity Analysis</span>
            </CardTitle>
            <button
              onClick={() => setExpandedView(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6 mb-4">
            <div className="text-center">
              <div className="text-4xl mb-1">{getComplexityIcon(complexity.level)}</div>
              <Badge className={`${getComplexityColor(complexity.level)} font-medium`}>
                {complexity.level.toUpperCase()}
              </Badge>
            </div>
            <div className="flex-1">
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-3xl font-bold">{complexity.totalScore}</span>
                <span className="text-muted-foreground">/ 120+ points</span>
              </div>
              <Progress 
                value={Math.min((complexity.totalScore / 120) * 100, 100)} 
                className="h-3" 
              />
              <p className="text-sm text-muted-foreground mt-2">
                Based on {complexity.factors.nodeCount} nodes and {complexity.factors.nodeTypes} node types
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complexity Factors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ComplexityFactorCard
          icon={<BarChart3 className="h-4 w-4" />}
          title="Node Count"
          value={complexity.factors.nodeCount}
          maxValue={20}
          description="Total number of workflow nodes. More nodes typically indicate higher complexity and potential maintenance overhead."
          color="bg-blue-100 text-blue-600"
        />

        <ComplexityFactorCard
          icon={<GitBranch className="h-4 w-4" />}
          title="Connections"
          value={complexity.factors.connections}
          maxValue={30}
          description="Number of connections between nodes. Complex routing and branching increases the difficulty of understanding workflow flow."
          color="bg-purple-100 text-purple-600"
        />

        <ComplexityFactorCard
          icon={<Zap className="h-4 w-4" />}
          title="Conditional Logic"
          value={complexity.factors.conditionalLogic}
          maxValue={10}
          description="IF statements, switches, and filters that create branching logic. These require careful testing and validation."
          color="bg-orange-100 text-orange-600"
        />

        <ComplexityFactorCard
          icon={<Shield className="h-4 w-4" />}
          title="Error Handling"
          value={complexity.factors.errorHandling}
          maxValue={15}
          description="Nodes with error handling and continue-on-fail settings. Proper error handling improves workflow reliability."
          color="bg-green-100 text-green-600"
        />

        <ComplexityFactorCard
          icon={<Database className="h-4 w-4" />}
          title="Data Transforms"
          value={complexity.factors.dataTransformations}
          maxValue={10}
          description="Set, Function, and Code nodes that manipulate data. Complex transformations can be hard to debug and maintain."
          color="bg-indigo-100 text-indigo-600"
        />

        <ComplexityFactorCard
          icon={<ExternalLink className="h-4 w-4" />}
          title="External Services"
          value={complexity.factors.externalServices}
          maxValue={8}
          description="Number of different external APIs and services. Each service adds potential failure points and rate limit considerations."
          color="bg-teal-100 text-teal-600"
        />
      </div>

      {/* Recommendations */}
      {complexity.recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Optimization Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {complexity.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complexity Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Complexity Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Nodes:</span>
                <span className="ml-2">{complexity.factors.nodeCount}</span>
              </div>
              <div>
                <span className="font-medium">Unique Types:</span>
                <span className="ml-2">{complexity.factors.nodeTypes}</span>
              </div>
              <div>
                <span className="font-medium">Total Connections:</span>
                <span className="ml-2">{complexity.factors.connections}</span>
              </div>
              <div>
                <span className="font-medium">Logic Branches:</span>
                <span className="ml-2">{complexity.factors.conditionalLogic}</span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Complexity Levels:</strong> Simple (0-20) | Moderate (21-50) | Complex (51-100) | Advanced (100+)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowComplexityVisualization;