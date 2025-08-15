-- Create RLS policies for workflows table
-- Allow users to insert their own workflows
CREATE POLICY "Users can create their own workflows" 
ON workflows 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own workflows
CREATE POLICY "Users can view their own workflows" 
ON workflows 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to update their own workflows
CREATE POLICY "Users can update their own workflows" 
ON workflows 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow users to delete their own workflows
CREATE POLICY "Users can delete their own workflows" 
ON workflows 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for automations table (if it doesn't exist)
-- Allow users to insert their own automations
CREATE POLICY "Users can create their own automations" 
ON automations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own automations
CREATE POLICY "Users can view their own automations" 
ON automations 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to update their own automations
CREATE POLICY "Users can update their own automations" 
ON automations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow users to delete their own automations
CREATE POLICY "Users can delete their own automations" 
ON automations 
FOR DELETE 
USING (auth.uid() = user_id);