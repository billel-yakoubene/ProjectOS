# ============================================================
# ProjectOS - n8n Workflow Creation
# ============================================================

$N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNWFmYTg5NC1lZDBiLTQxMzQtYWYwMC1lODdiMTdkMWI3NmMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNjFhMzI2ZmYtZDYxNC00YzlhLWI0ZGItYjU5MGVhYzRjZTJlIiwiaWF0IjoxNzcyNjMyMjE0LCJleHAiOjE3NzUxODg4MDB9.Rq6eKWeDRGUxZzjGzsYfrZvK2WdaSDSN7EE-cpiBQNw"
$N8N_URL = "http://localhost:5678"
$SUPABASE_URL = "https://llcfsyjzxhmaalymkwwu.supabase.co"
$SUPABASE_KEY = "sb_publishable_eguo_16DBxvdcXUEFEDc8g_qKQH3BtB"

$headers = @{
    "X-N8N-API-KEY" = $N8N_API_KEY
    "Content-Type"  = "application/json"
}

function Create-Workflow($name, $workflowJson) {
    Write-Host "`nCreating: $name" -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows" `
            -Method POST `
            -Headers $headers `
            -Body $workflowJson `
            -ContentType "application/json"
        Write-Host "  Success - ID: $($response.id)" -ForegroundColor Green
        return $response.id
    }
    catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# ============================================================
# WORKFLOW 1 : Task Completed -> Activity Log
# ============================================================
Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host " WORKFLOW 1 : Task Completed" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

$workflow1 = @{
    name        = "ProjectOS - Task Completed - Activity Log"
    nodes       = @(
        @{
            id          = "node-1"
            name        = "Webhook - Task Completed"
            type        = "n8n-nodes-base.webhook"
            typeVersion = 2
            position    = @(200, 300)
            parameters  = @{
                httpMethod   = "POST"
                path         = "task-completed"
                responseMode = "onReceived"
            }
        },
        @{
            id          = "node-2"
            name        = "Prepare Data"
            type        = "n8n-nodes-base.set"
            typeVersion = 3
            position    = @(450, 300)
            parameters  = @{
                mode   = "manual"
                fields = @{
                    values = @(
                        @{ name = "task_id"; value = "={{ $json.body.task_id }}" },
                        @{ name = "project_id"; value = "={{ $json.body.project_id }}" },
                        @{ name = "task_content"; value = "={{ $json.body.content }}" },
                        @{ name = "completed_at"; value = "={{ $json.body.completed_at !== undefined ? $json.body.completed_at : $now.toISO() }}" },
                        @{ name = "action_type"; value = "task_completed" }
                    )
                }
            }
        },
        @{
            id          = "node-3"
            name        = "Log to Supabase"
            type        = "n8n-nodes-base.httpRequest"
            typeVersion = 4
            position    = @(700, 200)
            parameters  = @{
                method           = "POST"
                url              = "$SUPABASE_URL/rest/v1/activity_logs"
                sendHeaders      = $true
                headerParameters = @{
                    parameters = @(
                        @{ name = "apikey"; value = $SUPABASE_KEY },
                        @{ name = "Authorization"; value = "Bearer $SUPABASE_KEY" },
                        @{ name = "Content-Type"; value = "application/json" },
                        @{ name = "Prefer"; value = "return=representation" }
                    )
                }
                sendBody         = $true
                bodyParameters   = @{
                    parameters = @(
                        @{ name = "task_id"; value = "={{ $json.task_id }}" },
                        @{ name = "action_type"; value = "task_completed" }
                    )
                }
            }
        },
        @{
            id          = "node-4"
            name        = "Respond OK"
            type        = "n8n-nodes-base.respondToWebhook"
            typeVersion = 1
            position    = @(700, 400)
            parameters  = @{
                respondWith  = "json"
                responseBody = "={{ JSON.stringify({ success: true, task_id: $json.task_id, message: 'Task logged successfully' }) }}"
                options      = @{ responseCode = 200 }
            }
        }
    )
    connections = @{
        "Webhook - Task Completed" = @{
            main = @(@(@{ node = "Prepare Data"; type = "main"; index = 0 }))
        }
        "Prepare Data"             = @{
            main = @(@(
                    @{ node = "Log to Supabase"; type = "main"; index = 0 },
                    @{ node = "Respond OK"; type = "main"; index = 0 }
                ))
        }
    }
    settings    = @{
        executionOrder         = "v1"
        saveDataErrorExecution = "all"
        saveManualExecutions   = $true
    }
} | ConvertTo-Json -Depth 20 -Compress

$id1 = Create-Workflow "Task Completed Log" $workflow1

# ============================================================
# WORKFLOW 2 : Daily Summary
# ============================================================
Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host " WORKFLOW 2 : Daily Summary" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

$workflow2 = @{
    name        = "ProjectOS - Daily Summary"
    nodes       = @(
        @{
            id          = "node-1"
            name        = "Scheduled - Every Day 8am"
            type        = "n8n-nodes-base.scheduleTrigger"
            typeVersion = 1
            position    = @(200, 300)
            parameters  = @{
                rule = @{
                    interval = @(@{
                            field      = "cronExpression"
                            expression = "0 8 * * 1-5"
                        })
                }
            }
        },
        @{
            id          = "node-2"
            name        = "Get Daily Tasks"
            type        = "n8n-nodes-base.httpRequest"
            typeVersion = 4
            position    = @(450, 200)
            parameters  = @{
                method           = "GET"
                url              = "$SUPABASE_URL/rest/v1/tasks"
                sendHeaders      = $true
                headerParameters = @{
                    parameters = @(
                        @{ name = "apikey"; value = $SUPABASE_KEY },
                        @{ name = "Authorization"; value = "Bearer $SUPABASE_KEY" }
                    )
                }
                sendQuery        = $true
                queryParameters  = @{
                    parameters = @(
                        @{ name = "status"; value = "eq.done" },
                        @{ name = "updated_at"; value = "gte.{{ $now.startOf('day').toISO() }}" },
                        @{ name = "select"; value = "id,content,project_id,updated_at" }
                    )
                }
            }
        },
        @{
            id          = "node-3"
            name        = "Get Active Projects"
            type        = "n8n-nodes-base.httpRequest"
            typeVersion = 4
            position    = @(450, 400)
            parameters  = @{
                method           = "GET"
                url              = "$SUPABASE_URL/rest/v1/projects"
                sendHeaders      = $true
                headerParameters = @{
                    parameters = @(
                        @{ name = "apikey"; value = $SUPABASE_KEY },
                        @{ name = "Authorization"; value = "Bearer $SUPABASE_KEY" }
                    )
                }
                sendQuery        = $true
                queryParameters  = @{
                    parameters = @(
                        @{ name = "status"; value = "eq.active" },
                        @{ name = "select"; value = "id,title,description,status" }
                    )
                }
            }
        },
        @{
            id          = "node-4"
            name        = "Calculate Stagnation"
            type        = "n8n-nodes-base.code"
            typeVersion = 2
            position    = @(700, 400)
            parameters  = @{
                jsCode = "const items = $input.all(); const results = items.map(item => { const proj = item.json; const lastActivity = new Date(proj.updated_at || proj.created_at || new Date()); const now = new Date(); const diffMs = now - lastActivity; const diffHours = Math.floor(diffMs / (1000 * 60 * 60)); const diffDays = Math.floor(diffHours / 24); return { project_id: proj.id, project_title: proj.title, status: proj.status, stagnation_hours: diffHours, stagnation_days: diffDays, is_stagnant: diffHours > 48, readable_stagnation: diffDays > 0 ? `${diffDays} day(s)` : `${diffHours} hour(s)` }; }); const stagnantProjects = results.filter(p => p.is_stagnant); return { analyzed_at: new Date().toISOString(), total_projects: results.length, stagnant_count: stagnantProjects.length, stagnant_projects: stagnantProjects, all_projects: results };"
            }
        },
        @{
            id          = "node-5"
            name        = "Generate Markdown Summary"
            type        = "n8n-nodes-base.code"
            typeVersion = 2
            position    = @(950, 300)
            parameters  = @{
                jsCode = "const stagnationData = $('Calculate Stagnation').item.json; const tasksData = $('Get Daily Tasks').all(); const today = new Date().toLocaleDateString('en-US'); const completedToday = tasksData.length; let summary = `## ProjectOS Summary - ${today}\n\n`; summary += `### Tasks Completed Today: ${completedToday}\n`; if (completedToday > 0) { tasksData.forEach(t => { summary += `- ${t.json.content}\n`; }); } summary += `\n### Active Projects: ${stagnationData.total_projects}\n`; if (stagnationData.stagnant_count > 0) { summary += `\n### Stagnant Projects (${stagnationData.stagnant_count}):\n`; stagnationData.stagnant_projects.forEach(p => { summary += `- **${p.project_title}** - Inactive for ${p.readable_stagnation}\n`; }); } return { summary_text: summary, completed_today: completedToday, stagnant_projects: stagnationData.stagnant_count };"
            }
        }
    )
    connections = @{
        "Scheduled - Every Day 8am" = @{
            main = @(@(
                    @{ node = "Get Daily Tasks"; type = "main"; index = 0 },
                    @{ node = "Get Active Projects"; type = "main"; index = 0 }
                ))
        }
        "Get Active Projects"       = @{
            main = @(@(@{ node = "Calculate Stagnation"; type = "main"; index = 0 }))
        }
        "Calculate Stagnation"      = @{
            main = @(@(@{ node = "Generate Markdown Summary"; type = "main"; index = 0 }))
        }
        "Get Daily Tasks"           = @{
            main = @(@(@{ node = "Generate Markdown Summary"; type = "main"; index = 0 }))
        }
    }
    settings    = @{
        executionOrder         = "v1"
        saveDataErrorExecution = "all"
        saveManualExecutions   = $true
    }
} | ConvertTo-Json -Depth 20 -Compress

$id2 = Create-Workflow "Daily Summary" $workflow2

# ============================================================
# WORKFLOW 3 : Idea Capture -> AI AI Project
# ============================================================
Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host " WORKFLOW 3 : Smart Idea Capture" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

$OPENAI_KEY = "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"

$workflow3 = @{
    name  = "ProjectOS - Idea Capture - AI Project"
    nodes = @(
        @{
            id          = "node-1"
            name        = "Webhook - New Idea"
            type        = "n8n-nodes-base.webhook"
            typeVersion = 2
            position    = @(200, 300)
            parameters  = @{
                httpMethod   = "POST"
                path         = "generate-project"
                responseMode = "lastNode"
            }
        },
        @{
            id          = "node-2"
            name        = "Validate Idea"
            type        = "n8n-nodes-base.code"
            typeVersion = 2
            position    = @(450, 300)
            parameters  = @{
                jsCode = "const body = $input.item.json.body || $input.item.json; const idea = body.idea || body.description || body.text; if (!idea || idea.trim().length < 5) { throw new Error('Idea too short'); } return { idea: idea.trim(), user_id: body.user_id, received_at: new Date().toISOString() };"
            }
        },
        @{
            id          = "node-3"
            name        = "OpenAI - Structure Project"
            type        = "n8n-nodes-base.httpRequest"
            typeVersion = 4
            position    = @(700, 300)
            parameters  = @{
                method           = "POST"
                url              = "https://api.openai.com/v1/chat/completions"
                sendHeaders      = $true
                headerParameters = @{
                    parameters = @(
                        @{ name = "Authorization"; value = "Bearer $OPENAI_KEY" },
                        @{ name = "Content-Type"; value = "application/json" }
                    )
                }
                sendBody         = $true
                contentType      = "json"
                body             = "{\"model\": \"gpt-4o-mini\", \"response_format\": { \"type\": \"json_object\" }, \"messages\": [{\"role\": \"system\", \"content\": \"You are a productivity expert. Transform ideas into projects. Format: { title, description, tasks:[ { content, order }] }\"}, {\"role\": \"user\", \"content\": \"Idea: { { $json.idea } }\"}]}"
            }
        },
        @{
            id          = "node-4"
            name        = "Parse AI Response"
            type        = "n8n-nodes-base.code"
            typeVersion = 2
            position    = @(950, 300)
            parameters  = @{
                jsCode = "const aiResponse = $input.item.json; const content = JSON.parse(aiResponse.choices[0].message.content); const ideaData = $('Validate Idea').item.json; return { title: content.title, description: content.description, tasks: content.tasks, user_id: ideaData.user_id, original_idea: ideaData.idea };"
            }
        },
        @{
            id          = "node-5"
            name        = "Create Project in Supabase"
            type        = "n8n-nodes-base.httpRequest"
            typeVersion = 4
            position    = @(1200, 200)
            parameters  = @{
                method           = "POST"
                url              = "$SUPABASE_URL/rest/v1/projects"
                sendHeaders      = $true
                headerParameters = @{
                    parameters = @(
                        @{ name = "apikey"; value = $SUPABASE_KEY },
                        @{ name = "Authorization"; value = "Bearer $SUPABASE_KEY" },
                        @{ name = "Content-Type"; value = "application/json" },
                        @{ name = "Prefer"; value = "return=representation" }
                    )
                }
                sendBody         = $true
                body             = "={{ JSON.stringify({ title: $json.title, description: $json.description, user_id: $json.user_id, status: 'active' }) }}"
            }
        },
        @{
            id          = "node-6"
            name        = "Prepare Tasks"
            type        = "n8n-nodes-base.code"
            typeVersion = 2
            position    = @(1200, 400)
            parameters  = @{
                jsCode = "const project = $('Create Project in Supabase').item.json[0]; const parserData = $('Parse AI Response').item.json; const taskItems = parserData.tasks.map(task => ({ project_id: project.id, content: task.content, order: task.order, status: 'todo' })); return { tasks: taskItems, project_id: project.id };"
            }
        },
        @{
            id          = "node-7"
            name        = "Insert Tasks in Supabase"
            type        = "n8n-nodes-base.httpRequest"
            typeVersion = 4
            position    = @(1450, 400)
            parameters  = @{
                method           = "POST"
                url              = "$SUPABASE_URL/rest/v1/tasks"
                sendHeaders      = $true
                headerParameters = @{
                    parameters = @(
                        @{ name = "apikey"; value = $SUPABASE_KEY },
                        @{ name = "Authorization"; value = "Bearer $SUPABASE_KEY" },
                        @{ name = "Content-Type"; value = "application/json" }
                    )
                }
                sendBody         = $true
                body             = "={{ JSON.stringify($json.tasks) }}"
            }
        },
        @{
            id          = "node-8"
            name        = "Final Response"
            type        = "n8n-nodes-base.code"
            typeVersion = 2
            position    = @(1700, 300)
            parameters  = @{
                jsCode = "return { success: true, message: 'Project created' };"
            }
        }
    )
    connections = @{
        "Webhook - New Idea"         = @{
            main = @(@(@{ node = "Validate Idea"; type = "main"; index = 0 }))
        }
        "Validate Idea"              = @{
            main = @(@(@{ node = "OpenAI - Structure Project"; type = "main"; index = 0 }))
        }
        "OpenAI - Structure Project" = @{
            main = @(@(@{ node = "Parse AI Response"; type = "main"; index = 0 }))
        }
        "Parse AI Response"          = @{
            main = @(@(
                    @{ node = "Create Project in Supabase"; type = "main"; index = 0 },
                    @{ node = "Prepare Tasks"; type = "main"; index = 0 }
                ))
        }
        "Create Project in Supabase" = @{
            main = @(@(@{ node = "Prepare Tasks"; type = "main"; index = 0 }))
        }
        "Prepare Tasks"              = @{
            main = @(@(@{ node = "Insert Tasks in Supabase"; type = "main"; index = 0 }))
        }
        "Insert Tasks in Supabase"   = @{
            main = @(@(@{ node = "Final Response"; type = "main"; index = 0 }))
        }
    }
} | ConvertTo-Json -Depth 20 -Compress

$id3 = Create-Workflow "Idea Capture Project" $workflow3

Write-Host "`nCREATION SUMMARY" -ForegroundColor Magenta
Write-Host "Workflow 1: $id1"
Write-Host "Workflow 2: $id2"
Write-Host "Workflow 3: $id3"
