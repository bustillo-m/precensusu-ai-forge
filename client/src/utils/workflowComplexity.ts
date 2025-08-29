/**
 * Workflow Complexity Analysis Utility
 * Analyzes n8n workflow JSON to calculate complexity scores
 */

export interface ComplexityMetrics {
  totalScore: number;
  level: 'simple' | 'moderate' | 'complex' | 'advanced';
  factors: {
    nodeCount: number;
    nodeTypes: number;
    connections: number;
    conditionalLogic: number;
    errorHandling: number;
    dataTransformations: number;
    externalServices: number;
  };
  recommendations: string[];
}

export interface WorkflowNode {
  id?: string;
  name: string;
  type: string;
  parameters?: any;
  continueOnFail?: boolean;
  typeVersion?: number;
  position?: [number, number];
}

export interface WorkflowConnections {
  [nodeName: string]: {
    main?: Array<Array<{ node: string; type: string; index: number }>>;
    error?: Array<Array<{ node: string; type: string; index: number }>>;
  };
}

export interface WorkflowData {
  nodes: WorkflowNode[];
  connections?: WorkflowConnections;
  name?: string;
}

/**
 * Node type complexity weights
 */
const NODE_COMPLEXITY_WEIGHTS: Record<string, number> = {
  // Triggers (simple)
  'n8n-nodes-base.start': 1,
  'n8n-nodes-base.webhook': 2,
  'n8n-nodes-base.cron': 2,
  'n8n-nodes-base.manualTrigger': 1,

  // Basic actions
  'n8n-nodes-base.emailSend': 2,
  'n8n-nodes-base.http': 3,
  'n8n-nodes-base.respondToWebhook': 1,

  // Data manipulation (moderate complexity)
  'n8n-nodes-base.set': 3,
  'n8n-nodes-base.function': 5,
  'n8n-nodes-base.functionItem': 4,
  'n8n-nodes-base.merge': 4,
  'n8n-nodes-base.split': 3,

  // Conditional logic (high complexity)
  'n8n-nodes-base.if': 4,
  'n8n-nodes-base.switch': 5,
  'n8n-nodes-base.filter': 3,

  // External services (variable complexity)
  'n8n-nodes-base.slack': 3,
  'n8n-nodes-base.googleSheets': 4,
  'n8n-nodes-base.gmail': 4,
  'n8n-nodes-base.hubspot': 5,
  'n8n-nodes-base.salesforce': 6,
  'n8n-nodes-base.mysql': 5,
  'n8n-nodes-base.postgres': 5,
  'n8n-nodes-base.mongodb': 5,

  // Advanced operations
  'n8n-nodes-base.code': 6,
  'n8n-nodes-base.executeWorkflow': 7,
  'n8n-nodes-base.loop': 6,
  'n8n-nodes-base.wait': 2,

  // Default weight for unknown nodes
  default: 3
};

/**
 * Calculate workflow complexity score
 */
export function calculateWorkflowComplexity(workflowData: WorkflowData): ComplexityMetrics {
  if (!workflowData.nodes || !Array.isArray(workflowData.nodes)) {
    return {
      totalScore: 0,
      level: 'simple',
      factors: {
        nodeCount: 0,
        nodeTypes: 0,
        connections: 0,
        conditionalLogic: 0,
        errorHandling: 0,
        dataTransformations: 0,
        externalServices: 0
      },
      recommendations: ['Invalid workflow structure']
    };
  }

  const nodes = workflowData.nodes;
  const connections = workflowData.connections || {};

  // Factor 1: Node count (base complexity)
  const nodeCount = nodes.length;
  const nodeCountScore = Math.min(nodeCount * 2, 20); // Cap at 20 points

  // Factor 2: Unique node types (diversity complexity)
  const uniqueTypes = new Set(nodes.map(node => node.type)).size;
  const nodeTypesScore = uniqueTypes * 3;

  // Factor 3: Connection complexity
  let connectionCount = 0;
  Object.values(connections).forEach(nodeConnections => {
    if (nodeConnections.main) {
      nodeConnections.main.forEach(connArray => {
        connectionCount += connArray.length;
      });
    }
    if (nodeConnections.error) {
      nodeConnections.error.forEach(connArray => {
        connectionCount += connArray.length;
      });
    }
  });
  const connectionsScore = connectionCount * 1.5;

  // Factor 4: Conditional logic nodes
  const conditionalNodes = nodes.filter(node => 
    node.type.includes('if') || 
    node.type.includes('switch') || 
    node.type.includes('filter')
  );
  const conditionalLogicScore = conditionalNodes.length * 8;

  // Factor 5: Error handling
  const errorHandlingCount = Object.values(connections).reduce((count, nodeConnections) => {
    return count + (nodeConnections.error ? nodeConnections.error.length : 0);
  }, 0);
  const nodesWithErrorHandling = nodes.filter(node => node.continueOnFail === true);
  const errorHandlingScore = (errorHandlingCount + nodesWithErrorHandling.length) * 4;

  // Factor 6: Data transformation complexity
  const transformationNodes = nodes.filter(node => 
    node.type.includes('function') || 
    node.type.includes('set') || 
    node.type.includes('code') || 
    node.type.includes('merge') ||
    node.type.includes('split')
  );
  const dataTransformationsScore = transformationNodes.length * 6;

  // Factor 7: External service integrations
  const externalServices = new Set();
  nodes.forEach(node => {
    if (!node.type.includes('n8n-nodes-base.start') && 
        !node.type.includes('n8n-nodes-base.set') &&
        !node.type.includes('n8n-nodes-base.function') &&
        !node.type.includes('n8n-nodes-base.if') &&
        !node.type.includes('n8n-nodes-base.switch')) {
      // Extract service name from node type
      const serviceName = node.type.replace('n8n-nodes-base.', '').replace('n8n-nodes-community.', '');
      externalServices.add(serviceName);
    }
  });
  const externalServicesScore = externalServices.size * 5;

  // Calculate weighted node complexity
  const nodeComplexityScore = nodes.reduce((total, node) => {
    const weight = NODE_COMPLEXITY_WEIGHTS[node.type] || NODE_COMPLEXITY_WEIGHTS.default;
    return total + weight;
  }, 0);

  // Total complexity score
  const totalScore = Math.round(
    nodeCountScore + 
    nodeTypesScore + 
    connectionsScore + 
    conditionalLogicScore + 
    errorHandlingScore + 
    dataTransformationsScore + 
    externalServicesScore + 
    nodeComplexityScore
  );

  // Determine complexity level
  let level: 'simple' | 'moderate' | 'complex' | 'advanced';
  if (totalScore <= 20) level = 'simple';
  else if (totalScore <= 50) level = 'moderate';
  else if (totalScore <= 100) level = 'complex';
  else level = 'advanced';

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (nodeCount > 15) {
    recommendations.push('Consider breaking this workflow into smaller, focused workflows');
  }
  if (conditionalNodes.length > 3) {
    recommendations.push('High conditional logic complexity - ensure proper testing');
  }
  if (errorHandlingCount === 0 && nodeCount > 5) {
    recommendations.push('Add error handling to critical nodes for better reliability');
  }
  if (transformationNodes.length > 5) {
    recommendations.push('Consider consolidating data transformations to reduce complexity');
  }
  if (externalServices.size > 7) {
    recommendations.push('Many external services - monitor rate limits and dependencies');
  }
  if (recommendations.length === 0) {
    recommendations.push('Well-structured workflow with appropriate complexity');
  }

  return {
    totalScore,
    level,
    factors: {
      nodeCount,
      nodeTypes: uniqueTypes,
      connections: connectionCount,
      conditionalLogic: conditionalNodes.length,
      errorHandling: errorHandlingCount + nodesWithErrorHandling.length,
      dataTransformations: transformationNodes.length,
      externalServices: externalServices.size
    },
    recommendations
  };
}

/**
 * Get complexity level color
 */
export function getComplexityColor(level: string): string {
  switch (level) {
    case 'simple': return 'text-green-600 bg-green-50 border-green-200';
    case 'moderate': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'complex': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'advanced': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/**
 * Get complexity level icon
 */
export function getComplexityIcon(level: string): string {
  switch (level) {
    case 'simple': return '🟢';
    case 'moderate': return '🔵';
    case 'complex': return '🟠';
    case 'advanced': return '🔴';
    default: return '⚪';
  }
}