import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

async function expandLibrary() {
    const existingData = JSON.parse(fs.readFileSync('./my_terms.json', 'utf-8'));
    
    // List of 100+ modern tech terms to add
    const targetTerms = [
        "React", "Vue.js", "Angular", "Svelte", "SolidJS", "Qwik", "Nuxt.js", "Remix", "Gatsby", "Bun", "Denom", "Node.js", "pnpm", "Yarn", "Vite", "Turborepo", "Nx", "Lerna", "Webpack", "Esbuild",
        "TypeScript", "Rust", "Go", "Kotlin", "Swift", "Zig", "Mojo", "Python", "C++", "Java", "C#", "SQL", "NoSQL", "GraphQL", "gRPC", "WebAssembly", "TRPC", "Zod", "Valibot", "Lucide",
        "Firebase", "Appwrite", "Pocketbase", "FaunaDB", "PlanetScale", "Turso", "Upstash", "Meilisearch", "Algolia", "OpenSearch", "ClickHouse", "DuckDB", "SingleStore", "TiDB", "CockroachDB", "Spanner", "DynamoDB", "CosmosDB", "MongoDB", "Cassandra",
        "Docker", "Podman", "Kubernetes", "Helm", "Kustomize", "ArgoCD", "Flux", "Istio", "Linkerd", "Cilium", "Traefik", "NGINX", "Envoy", "Prometheus", "Grafana", "Jaeger", "Loki", "Tempo", "OpenTelemetry", "Vector",
        "Terraform", "OpenTofu", "Pulumi", "CDK", "Bicep", "Ansible", "Chef", "Puppet", "Crossplane", "Nix", "Homebrew", "APT", "DNF", "Winget", "Scoop", "Choco", "NPM", "PyPI", "Cargo", "Go Modules",
        "GitHub", "GitLab", "Bitbucket", "CodeCommit", "CircleCI", "TravisCI", "Jenkins", "Buildkite", "Dagger", "Earthly", "Tekton", "Concourse", "Spinnaker", "Harness", "GitOps", "ClickOps", "NoOps", "FinOps", "DevSecOps", "MLOps",
        "AWS Lambda", "Azure Functions", "Google Cloud Functions", "Cloudflare Workers", "Vercel Functions", "Edge Functions", "Cold Start", "Warming", "Provisioned Concurrency", "Event Bridge", "SQS", "SNS", "Kinesis", "Event Hubs", "Pub/Sub", "RabbitMQ", "ActiveMQ", "NATS", "Kafka Connect", "Kafka Streams"
    ];

    console.log(`Expansion in progress. Cooking 100+ new master entries...`);

    // Split into batches to avoid token limits
    const batches = [];
    for (let i = 0; i < targetTerms.length; i += 25) {
        batches.push(targetTerms.slice(i, i + 25));
    }

    const allNewEntries = [];

    for (const batch of batches) {
        console.log(`Processing batch of ${batch.length} terms...`);
        const prompt = `You are a technical expert. Define the following list of terms and provide a unique restaurant-themed analogy for each. 
        Terms: ${batch.join(", ")}.
        
        Themes to consider: Frontend, Backend, Database, Cloud, DevOps, Security, Languages.
        Keep the restaurant theme consistent (Kitchen, Chefs, Menu, Diners).
        
        Respond ONLY with a valid JSON array of objects in this exact format:
        [
          {
            "category": "Theme Name",
            "term": "Term Name",
            "explanation": "Professional concise definition",
            "analogy": "Memorable restaurant analogy"
          }
        ]`;

        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text().replace(/```json|```/g, '').trim();
            const batchEntries = JSON.parse(text);
            allNewEntries.push(...batchEntries);
        } catch (e) {
            console.error("Batch failed, skipping...", e);
        }
    }

    // Merge and de-duplicate
    const combined = [...existingData, ...allNewEntries];
    const uniqueMap = new Map();
    combined.forEach(item => {
        uniqueMap.set(item.term.toLowerCase(), item);
    });

    // Organize by Theme/Category
    const sortedTerms = Array.from(uniqueMap.values()).sort((a, b) => {
        if (a.category < b.category) return -1;
        if (a.category > b.category) return 1;
        if (a.term < b.term) return -1;
        if (a.term > b.term) return 1;
        return 0;
    });

    fs.writeFileSync('./my_terms.json', JSON.stringify(sortedTerms, null, 2));
    console.log(`--- Expansion Complete ---`);
    console.log(`Final Library Count: ${sortedTerms.length} entries.`);
}

expandLibrary();
