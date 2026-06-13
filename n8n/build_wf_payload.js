const BASE = "https://www.cognitiveempire.com";
const AUTH_HEADER = { name: "Authorization", value: "Bearer ce-mesodma-2026" };

function httpNode(id, name, url, x, y) {
  return {
    id, name,
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position: [x, y],
    parameters: {
      method: "POST",
      url,
      sendHeaders: true,
      headerParameters: { parameters: [AUTH_HEADER] },
      options: { timeout: 15000, response: { response: { responseFormat: "json" } } }
    }
  };
}

function schedNode(id, name, cron, x, y) {
  return {
    id, name,
    type: "n8n-nodes-base.scheduleTrigger",
    typeVersion: 1.2,
    position: [x, y],
    parameters: { rule: { interval: [{ field: "cronExpression", expression: cron }] } }
  };
}

const nodes = [
  schedNode("v2-s1", "Schedule 02:00", "0 2 * * *",  -300, 160),
  schedNode("v2-s2", "Schedule 08:00", "0 8 * * *",  -300, 300),
  schedNode("v2-s3", "Schedule 14:00", "0 14 * * *", -300, 440),
  schedNode("v2-s4", "Schedule 20:00", "0 20 * * *", -300, 580),

  httpNode("v2-e1", "Enrich Run 1", `${BASE}/api/mesodma/v2/enrich`,   80, 360),
  httpNode("v2-e2", "Enrich Run 2", `${BASE}/api/mesodma/v2/enrich`,  300, 360),
  httpNode("v2-e3", "Enrich Run 3", `${BASE}/api/mesodma/v2/enrich`,  520, 360),
  httpNode("v2-e4", "Enrich Run 4", `${BASE}/api/mesodma/v2/enrich`,  740, 360),
  httpNode("v2-e5", "Enrich Run 5", `${BASE}/api/mesodma/v2/enrich`,  960, 360),

  httpNode("v2-b1", "Batch Run 1",  `${BASE}/api/mesodma/v2/batch`,  1180, 360),
  httpNode("v2-b2", "Batch Run 2",  `${BASE}/api/mesodma/v2/batch`,  1400, 360),
  httpNode("v2-b3", "Batch Run 3",  `${BASE}/api/mesodma/v2/batch`,  1620, 360),

  httpNode("v2-c1", "Cluster Run",  `${BASE}/api/mesodma/v2/cluster`, 1840, 360),

  {
    id: "v2-ck", name: "Cluster OK?",
    type: "n8n-nodes-base.if", typeVersion: 2,
    position: [2060, 360],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: "", typeValidation: "strict" },
        conditions: [{
          id: "cond-no-error",
          leftValue: "={{ $json.error }}", rightValue: "",
          operator: { type: "string", operation: "empty", singleValue: true }
        }],
        combinator: "and"
      }
    }
  },
  {
    id: "v2-ok", name: "Log Success",
    type: "n8n-nodes-base.code", typeVersion: 2,
    position: [2280, 260],
    parameters: {
      jsCode: [
        "const e = [1,2,3,4,5].map(n => $('Enrich Run '+n).first().json);",
        "const b = [1,2,3].map(n => $('Batch Run '+n).first().json);",
        "const cl = $('Cluster Run').first().json;",
        "const sum  = k => e.reduce((t,x) => t+(x[k]||0), 0);",
        "const bsum = k => b.reduce((t,x) => t+(x[k]||0), 0);",
        "const summary = {",
        "  enrich:  { checked: sum('items_checked'), enriched: sum('items_enriched'), skipped: sum('items_skipped'), failed: sum('items_failed') },",
        "  batch:   { runs: b.map(x=>x.run_id), input: bsum('input_count'), output: bsum('output_count'), noise: bsum('noise_count'), errors: bsum('error_count'), doctrine: b[2] && b[2].doctrine_version },",
        "  cluster: { processed: cl.atoms_processed, created: cl.clusters_created, updated: cl.clusters_updated, matured: cl.clusters_matured, expired: cl.clusters_expired, soft_errors: (cl.errors||[]).length },",
        "};",
        "console.log('[CE Signals V2] Daily run complete:', JSON.stringify(summary));",
        "return [{ json: { ...summary, success: true } }];"
      ].join("\n")
    }
  },
  {
    id: "v2-err", name: "Log Cluster Error",
    type: "n8n-nodes-base.code", typeVersion: 2,
    position: [2280, 480],
    parameters: {
      jsCode: "const r=$input.first().json;\nconsole.log('[CE Signals V2] Cluster error:',JSON.stringify(r));\nreturn [{json:{error:r.error||'unknown',success:false}}];"
    }
  }
];

const conn = n => [[{ node: n, type: "main", index: 0 }]];
const connections = {
  "Schedule 02:00": { main: conn("Enrich Run 1") },
  "Schedule 08:00": { main: conn("Enrich Run 1") },
  "Schedule 14:00": { main: conn("Enrich Run 1") },
  "Schedule 20:00": { main: conn("Enrich Run 1") },
  "Enrich Run 1":   { main: conn("Enrich Run 2") },
  "Enrich Run 2":   { main: conn("Enrich Run 3") },
  "Enrich Run 3":   { main: conn("Enrich Run 4") },
  "Enrich Run 4":   { main: conn("Enrich Run 5") },
  "Enrich Run 5":   { main: conn("Batch Run 1")  },
  "Batch Run 1":    { main: conn("Batch Run 2")  },
  "Batch Run 2":    { main: conn("Batch Run 3")  },
  "Batch Run 3":    { main: conn("Cluster Run")  },
  "Cluster Run":    { main: conn("Cluster OK?")  },
  "Cluster OK?":    { main: [ conn("Log Success")[0], conn("Log Cluster Error")[0] ] }
};

const payload = {
  name: "CE Signals V2 Daily",
  nodes,
  connections,
  settings: { executionOrder: "v1", saveManualExecutions: true, callerPolicy: "workflowsFromSameOwner", errorWorkflow: "" }
};

process.stdout.write(JSON.stringify(payload));
