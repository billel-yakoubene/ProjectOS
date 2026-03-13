const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role needed to bypass RLS for the MCP server
const supabase = createClient(supabaseUrl, supabaseKey);

const server = new Server(
    {
        name: "projectos-tasks-server",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "list_active_tasks",
                description: "Récupère la liste de toutes les tâches actives de ProjectOS",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "get_project_summary",
                description: "Donne un résumé d'un projet spécifique",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectTitle: { type: "string", description: "Le titre du projet" },
                    },
                    required: ["projectTitle"],
                },
            },
        ],
    };
});

/**
 * Handle tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "list_active_tasks") {
            const { data, error } = await supabase
                .from("tasks")
                .select("content, status, projects(title)")
                .neq("status", "done");

            if (error) throw error;

            const taskList = data.map(t => `[${t.projects.title}] ${t.content} (${t.status})`).join("\n");
            return {
                content: [{ type: "text", text: taskList || "Aucune tâche active trouvée." }],
            };
        }

        if (name === "get_project_summary") {
            const { data, error } = await supabase
                .from("projects")
                .select("title, description, status, tasks(content, status)")
                .ilike("title", `%${args.projectTitle}%`)
                .single();

            if (error) throw error;

            const summary = `
Projet: ${data.title}
Statut: ${data.status}
Description: ${data.description || "N/A"}
Tâches:
${data.tasks.map(t => `- [${t.status === 'done' ? 'x' : ' '}] ${t.content}`).join("\n")}
      `;

            return {
                content: [{ type: "text", text: summary }],
            };
        }

        throw new Error(`Outil non trouvé: ${name}`);
    } catch (error) {
        return {
            content: [{ type: "text", text: `Erreur: ${error.message}` }],
            isError: true,
        };
    }
});

/**
 * Start server
 */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("ProjectOS MCP Server running on stdio");
}

main().catch(console.error);
