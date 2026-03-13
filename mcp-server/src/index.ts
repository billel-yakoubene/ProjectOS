import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Load environment variables from the parent project's .env.local
dotenv.config({ path: path.join(process.cwd(), "..", ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const server = new Server(
    {
        name: "projectos-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

/**
 * List available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_my_tasks",
                description: "Get the list of 'todo' tasks from ProjectOS",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "complete_task",
                description: "Mark a specific task as 'done' in ProjectOS",
                inputSchema: {
                    type: "object",
                    properties: {
                        taskId: {
                            type: "string",
                            description: "The UUID of the task to complete",
                        },
                    },
                    required: ["taskId"],
                },
            },
        ],
    };
});

/**
 * Handle tool calls.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "get_my_tasks") {
            const { data, error } = await supabase
                .from("tasks")
                .select(`
          id,
          content,
          status,
          projects (title)
        `)
                .eq("status", "todo")
                .order("order", { ascending: true });

            if (error) throw error;

            const formattedTasks = data.map((t: any) => ({
                id: t.id,
                content: t.content,
                project: t.projects?.title || "No Project"
            }));

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(formattedTasks, null, 2),
                    },
                ],
            };
        }

        if (name === "complete_task") {
            const { taskId } = z.object({ taskId: z.string() }).parse(args);

            const { error } = await supabase
                .from("tasks")
                .update({ status: "done" })
                .eq("id", taskId);

            if (error) throw error;

            return {
                content: [
                    {
                        type: "text",
                        text: `Task ${taskId} marked as completed.`,
                    },
                ],
            };
        }

        throw new Error(`Unknown tool: ${name}`);
    } catch (error: any) {
        return {
            isError: true,
            content: [
                {
                    type: "text",
                    text: `Error: ${error.message}`,
                },
            ],
        };
    }
});

/**
 * Start the server using stdio transport.
 */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("ProjectOS MCP server running on stdio");
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
