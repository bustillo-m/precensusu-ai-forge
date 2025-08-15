import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { workflow } = await req.json();
    
    if (!workflow) {
      return new Response(JSON.stringify({ error: 'Workflow is required for validation' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Validate Workflow: Validating workflow:', workflow.name || 'Unknown');

    const errors = [];
    const warnings = [];

    // Basic structure validation
    if (!workflow.name) {
      errors.push('Workflow must have a name');
    }

    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      errors.push('Workflow must have a nodes array');
    } else {
      // Validate nodes
      for (let i = 0; i < workflow.nodes.length; i++) {
        const node = workflow.nodes[i];
        
        if (!node.id) {
          errors.push(`Node ${i} must have an id`);
        }
        
        if (!node.name) {
          errors.push(`Node ${i} must have a name`);
        }
        
        if (!node.type) {
          errors.push(`Node ${i} must have a type`);
        }
        
        if (!node.position || !Array.isArray(node.position) || node.position.length !== 2) {
          errors.push(`Node ${i} must have a position array with [x, y] coordinates`);
        }
      }
    }

    // Validate connections
    if (workflow.connections && typeof workflow.connections === 'object') {
      for (const [sourceNode, connections] of Object.entries(workflow.connections)) {
        if (!workflow.nodes.find(n => n.name === sourceNode)) {
          errors.push(`Connection source node "${sourceNode}" not found in nodes`);
        }
        
        if (connections.main && Array.isArray(connections.main)) {
          for (const connectionGroup of connections.main) {
            if (Array.isArray(connectionGroup)) {
              for (const connection of connectionGroup) {
                if (!workflow.nodes.find(n => n.name === connection.node)) {
                  errors.push(`Connection target node "${connection.node}" not found in nodes`);
                }
              }
            }
          }
        }
      }
    }

    // Check for required trigger node
    const hasTrigger = workflow.nodes.some(node => 
      node.type.includes('trigger') || 
      node.type.includes('webhook') ||
      node.type.includes('schedule') ||
      node.type.includes('manual')
    );
    
    if (!hasTrigger) {
      warnings.push('Workflow should have at least one trigger node');
    }

    // Check for error handling
    const hasErrorHandler = workflow.nodes.some(node => 
      node.type.includes('error') || 
      node.name.toLowerCase().includes('error')
    );
    
    if (!hasErrorHandler) {
      warnings.push('Consider adding error handling nodes for better reliability');
    }

    const isValid = errors.length === 0;

    console.log(`Validate Workflow: Validation complete. Valid: ${isValid}, Errors: ${errors.length}, Warnings: ${warnings.length}`);

    return new Response(JSON.stringify({
      success: true,
      valid: isValid,
      errors,
      warnings,
      workflow_summary: {
        name: workflow.name,
        node_count: workflow.nodes?.length || 0,
        has_trigger: hasTrigger,
        has_error_handling: hasErrorHandler
      },
      source: 'validate-workflow'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Validate Workflow error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      source: 'validate-workflow'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});