import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function loadSchema() {
  try {
    const response = await fetch(`${supabaseUrl}/storage/v1/object/public/templates/schema.json`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.log('Could not load custom schema, using basic validation');
  }
  return null;
}

function validateBasicStructure(workflow: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!workflow.name) {
    errors.push('Workflow must have a name');
  }

  if (!workflow.nodes || !Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
    errors.push('Workflow must have at least one node');
  }

  if (!workflow.connections || typeof workflow.connections !== 'object') {
    errors.push('Workflow must have connections object');
  }

  // Validate nodes structure
  if (workflow.nodes) {
    workflow.nodes.forEach((node: any, index: number) => {
      if (!node.id) {
        errors.push(`Node ${index} must have an id`);
      }
      if (!node.name) {
        errors.push(`Node ${index} must have a name`);
      }
      if (!node.type) {
        errors.push(`Node ${index} must have a type`);
      }
      if (!node.position || !Array.isArray(node.position) || node.position.length !== 2) {
        errors.push(`Node ${index} must have valid position [x, y]`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateRequiredNodes(workflow: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const nodeTypes = workflow.nodes?.map((node: any) => node.type) || [];

  // Check for trigger node
  const hasTrigger = nodeTypes.some((type: string) => 
    type.includes('trigger') || type.includes('webhook') || type.includes('manual')
  );
  
  if (!hasTrigger) {
    errors.push('Workflow must have at least one trigger node');
  }

  // Recommend logging and error handling (warnings, not errors)
  const hasLogging = workflow.nodes?.some((node: any) => 
    node.name?.toLowerCase().includes('log') || 
    node.type?.includes('httpRequest')
  );

  const hasErrorHandling = workflow.nodes?.some((node: any) => 
    node.name?.toLowerCase().includes('error') ||
    node.type?.includes('errorTrigger')
  );

  if (!hasLogging) {
    errors.push('WARNING: Consider adding logging nodes for monitoring');
  }

  if (!hasErrorHandling) {
    errors.push('WARNING: Consider adding error handling nodes');
  }

  return {
    isValid: true, // Warnings don't make it invalid
    errors
  };
}

function validateConnections(workflow: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const nodeIds = new Set(workflow.nodes?.map((node: any) => node.id) || []);

  if (workflow.connections) {
    Object.keys(workflow.connections).forEach(sourceNodeId => {
      if (!nodeIds.has(sourceNodeId)) {
        errors.push(`Connection references non-existent source node: ${sourceNodeId}`);
      }

      const connections = workflow.connections[sourceNodeId];
      if (connections && typeof connections === 'object') {
        Object.values(connections).forEach((connectionArray: any) => {
          if (Array.isArray(connectionArray)) {
            connectionArray.forEach((connection: any) => {
              connection.forEach((conn: any) => {
                if (conn.node && !nodeIds.has(conn.node)) {
                  errors.push(`Connection references non-existent target node: ${conn.node}`);
                }
              });
            });
          }
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

interface ValidateRequest {
  workflow_json: any;
  workflow_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { workflow_json, workflow_id }: ValidateRequest = await req.json();

    console.log(`Validating workflow ${workflow_id || 'unknown'}`);

    // Load schema for comprehensive validation
    const schema = await loadSchema();

    let schemaValidation = { isValid: true, errors: [] };
    
    if (schema) {
      // TODO: Implement JSON Schema validation here
      // For now, we'll use basic validation
      console.log('Schema loaded, but JSON Schema validation not yet implemented');
    }

    // Perform basic structural validation
    const basicValidation = validateBasicStructure(workflow_json);
    const nodeValidation = validateRequiredNodes(workflow_json);
    const connectionValidation = validateConnections(workflow_json);

    const allErrors = [
      ...basicValidation.errors,
      ...nodeValidation.errors,
      ...connectionValidation.errors,
      ...schemaValidation.errors
    ];

    const isValid = basicValidation.isValid && 
                   nodeValidation.isValid && 
                   connectionValidation.isValid && 
                   schemaValidation.isValid;

    const warnings = allErrors.filter(error => error.startsWith('WARNING:'));
    const errors = allErrors.filter(error => !error.startsWith('WARNING:'));

    console.log(`Validation completed: ${isValid ? 'PASSED' : 'FAILED'}`);
    if (warnings.length > 0) {
      console.log(`Warnings: ${warnings.length}`);
    }
    if (errors.length > 0) {
      console.log(`Errors: ${errors.length}`);
    }

    const validationResult = {
      isValid,
      errors,
      warnings,
      nodeCount: workflow_json.nodes?.length || 0,
      connectionCount: Object.keys(workflow_json.connections || {}).length,
      validation_timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify({
      success: isValid,
      validation: validationResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Validation error:', error);

    return new Response(JSON.stringify({ 
      error: error.message,
      validation: {
        isValid: false,
        errors: [error.message],
        warnings: [],
        validation_timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});