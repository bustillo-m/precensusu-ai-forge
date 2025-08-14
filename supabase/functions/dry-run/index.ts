import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function simulateNodeExecution(node: any): { success: boolean; output: any; errors: string[] } {
  const errors: string[] = [];
  let success = true;
  let output = {};

  try {
    // Simulate different node types
    switch (node.type) {
      case '@n8n/n8n-nodes-base.manualTrigger':
        output = { message: 'Manual trigger activated', timestamp: new Date().toISOString() };
        break;
        
      case '@n8n/n8n-nodes-base.httpRequest':
        if (!node.parameters?.url) {
          errors.push('HTTP Request node missing URL parameter');
          success = false;
        } else {
          output = { 
            statusCode: 200, 
            body: { simulated: true, url: node.parameters.url },
            headers: { 'content-type': 'application/json' }
          };
        }
        break;
        
      case '@n8n/n8n-nodes-base.set':
        output = { 
          ...node.parameters?.assignments?.assignments?.reduce((acc: any, assignment: any) => {
            acc[assignment.name] = assignment.value || 'simulated_value';
            return acc;
          }, {}) || {},
          node_name: node.name
        };
        break;
        
      case '@n8n/n8n-nodes-base.if':
        // Simulate condition evaluation
        output = { 
          condition_result: true, 
          path_taken: 'true',
          condition: node.parameters?.conditions || 'simulated_condition'
        };
        break;
        
      default:
        // Generic simulation for unknown node types
        output = { 
          simulated: true, 
          node_type: node.type,
          parameters: node.parameters || {},
          execution_time: Math.floor(Math.random() * 1000) + 100
        };
    }

    // Check for missing credentials
    if (node.credentials && Object.keys(node.credentials).length > 0) {
      Object.keys(node.credentials).forEach(credType => {
        // In dry run, we assume credentials are missing and warn
        errors.push(`WARNING: Node requires credential of type '${credType}' - not validated in dry run`);
      });
    }

  } catch (error) {
    success = false;
    errors.push(`Simulation error: ${error.message}`);
  }

  return { success, output, errors };
}

function simulateWorkflowExecution(workflow: any): any {
  const executionResults: any = {
    workflow_name: workflow.name,
    execution_id: `dry_run_${Date.now()}`,
    start_time: new Date().toISOString(),
    node_executions: [],
    total_nodes: workflow.nodes?.length || 0,
    successful_nodes: 0,
    failed_nodes: 0,
    warnings: [],
    errors: []
  };

  if (!workflow.nodes || workflow.nodes.length === 0) {
    executionResults.errors.push('No nodes to execute');
    return executionResults;
  }

  // Find trigger nodes to start execution simulation
  const triggerNodes = workflow.nodes.filter((node: any) => 
    node.type.includes('trigger') || 
    node.type.includes('manual') ||
    node.type.includes('webhook')
  );

  if (triggerNodes.length === 0) {
    executionResults.errors.push('No trigger nodes found - workflow cannot start');
    return executionResults;
  }

  // Simulate execution of each node
  workflow.nodes.forEach((node: any, index: number) => {
    const nodeResult = simulateNodeExecution(node);
    
    const nodeExecution = {
      node_id: node.id,
      node_name: node.name,
      node_type: node.type,
      execution_order: index + 1,
      success: nodeResult.success,
      output: nodeResult.output,
      errors: nodeResult.errors,
      execution_time_ms: Math.floor(Math.random() * 500) + 50
    };

    executionResults.node_executions.push(nodeExecution);

    if (nodeResult.success) {
      executionResults.successful_nodes++;
    } else {
      executionResults.failed_nodes++;
    }

    // Collect warnings and errors
    nodeResult.errors.forEach(error => {
      if (error.startsWith('WARNING:')) {
        executionResults.warnings.push(`${node.name}: ${error}`);
      } else {
        executionResults.errors.push(`${node.name}: ${error}`);
      }
    });
  });

  executionResults.end_time = new Date().toISOString();
  executionResults.total_execution_time_ms = executionResults.node_executions
    .reduce((sum: number, exec: any) => sum + exec.execution_time_ms, 0);

  executionResults.success_rate = (executionResults.successful_nodes / executionResults.total_nodes) * 100;

  return executionResults;
}

interface DryRunRequest {
  workflow_json: any;
  workflow_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { workflow_json, workflow_id }: DryRunRequest = await req.json();

    console.log(`Starting dry run for workflow ${workflow_id || 'unknown'}`);

    // First validate the workflow structure
    const validationResponse = await supabase.functions.invoke('validate-workflow', {
      body: { workflow_json, workflow_id }
    });

    if (validationResponse.error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Workflow validation failed before dry run',
        validation_errors: validationResponse.error
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Simulate workflow execution
    const simulationResults = simulateWorkflowExecution(workflow_json);

    // Generate recommendations based on dry run results
    const recommendations: string[] = [];

    if (simulationResults.failed_nodes > 0) {
      recommendations.push('Fix failing nodes before deployment');
    }

    if (simulationResults.warnings.length > 0) {
      recommendations.push('Review and address warnings for better reliability');
    }

    if (simulationResults.success_rate < 100) {
      recommendations.push('Ensure all node configurations are complete');
    }

    const hasCredentialWarnings = simulationResults.warnings.some((w: string) => w.includes('credential'));
    if (hasCredentialWarnings) {
      recommendations.push('Configure all required credentials before deployment');
    }

    const dryRunResult = {
      dry_run_id: `dry_run_${workflow_id}_${Date.now()}`,
      workflow_id,
      simulation_results: simulationResults,
      validation_results: validationResponse.data?.validation,
      recommendations,
      ready_for_deployment: simulationResults.success_rate === 100 && simulationResults.errors.length === 0,
      timestamp: new Date().toISOString()
    };

    console.log(`Dry run completed: ${dryRunResult.ready_for_deployment ? 'READY' : 'NEEDS_ATTENTION'}`);

    return new Response(JSON.stringify({
      success: true,
      dry_run: dryRunResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Dry run error:', error);

    return new Response(JSON.stringify({ 
      error: error.message,
      dry_run: {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});