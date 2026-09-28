// Single source of truth for every variant. Every fact here comes from the
// resume (main_2.tex). Do not add numbers that are not on the resume.

export const person = {
  name: 'Aarav Sunil Jadav',
  short: 'Aarav Jadav',
  role: 'Backend & full-stack engineer',
  lead: 'Tech lead, Foundation Core at Eventus Security',
  location: 'India',
  education: 'B.Tech., Computer Science Engineering, IIT Goa, 2020–2024',
  summary:
    'I lead a team of 7+ engineers building the backend and data infrastructure of a multi-tenant security platform used by 30+ enterprise customers. I rebuilt its log ingestion in Rust and moved its storage to ClickHouse, and I carry it through architecture, deployment, observability and 24/7 on-call.',
  resumePdf: 'Aarav-Jadav-Resume.pdf',
}

// Contact details are split so that plain-text scrapers reading the HTML or
// the JS bundle do not find a ready-made address or number. They are joined
// in the browser only (see contact.js).
export const contactParts = {
  email: ['aaravsjadav', 'gmail.com'],
  phone: ['+91', '72269', '99134'],
}

export const links = {
  github: 'https://github.com/DeviousCardi',
  linkedin: 'https://www.linkedin.com/in/aarav-jadav-b92a9122b/',
}

// The six numbers the resume can back up, each with what it measures.
export const metrics = [
  { id: 'ingest', value: 100000, display: '100k', unit: 'logs / sec', label: 'Sustained ingest', note: 'Rust rebuild of the JVM ingestion path, no GC pauses, no data loss', kind: 'rate', max: 120000 },
  { id: 'volume', value: 10, display: '10', unit: 'TB / day', label: 'Daily volume', note: 'Ingested into distributed ClickHouse with sub-second search over billions of events', kind: 'rate', max: 12 },
  { id: 'storage', value: -68, display: '−68%', unit: 'storage cost', label: 'Storage cost', note: 'OpenSearch to ClickHouse: ReplicatedMergeTree, ZSTD, LowCardinality, bloom-filter skip indexes', kind: 'cut' },
  { id: 'compute', value: -33, display: '−33%', unit: 'compute cost', label: 'Ingest compute', note: 'Memory-mapped circular buffer with disk spill under backpressure', kind: 'cut' },
  { id: 'cases', value: 75, display: '+75%', unit: 'cases / analyst', label: 'Analyst throughput', note: 'Similarity scoring in the SOAR platform auto-closes duplicate and low-priority cases', kind: 'gain' },
  { id: 'fp', value: -82, display: '−82%', unit: 'false positives', label: 'False positives', note: 'UEBA detection with Isolation Forest, autoencoder, GNN and Random Forest models', kind: 'cut' },
]

export const experience = [
  {
    id: 'eventus',
    company: 'Eventus Security',
    title: 'Software Engineer (Tech Lead), Foundation Core',
    when: 'Jun 2024 – present',
    start: '2024-06',
    place: 'India',
    items: [
      { tag: 'LEAD', system: 'platform', headline: 'Tech lead for 7+ engineers', text: 'Kubernetes-based, multi-tenant SOC platform serving 30+ enterprise customers. I own architecture, releases and 24/7 on-call support.' },
      { tag: 'INGEST', system: 'rust-ingest', headline: 'Rebuilt log ingestion in Rust', text: 'Replaced JVM services and their network hand-offs with a memory-mapped circular buffer that spills to disk under backpressure. Sustains 100,000 logs/sec without GC pauses or data loss, at 33% lower compute cost.', metric: 'ingest' },
      { tag: 'STORE', system: 'clickhouse', headline: 'Moved storage from OpenSearch to ClickHouse', text: 'ReplicatedMergeTree tables with ZSTD codecs, LowCardinality encoding, typed JSON fields and bloom-filter skip indexes. Storage cost down 68%, CPU down 10%, at 10 TB/day ingest with sub-second search over billions of events.', metric: 'storage' },
      { tag: 'AUTH', system: 'iam', headline: 'Built the IAM service end to end', text: 'AWS IAM-style allow/deny policies evaluated per request, REST and gRPC APIs, and enterprise federation through SAML, OIDC and LDAP.' },
      { tag: 'SOAR', system: 'soar', headline: 'AI-enabled SOAR platform', text: 'Alert enrichment, playbook response and case merging. Similarity scoring auto-closes duplicate and low-priority cases, raising cases handled per analyst by 75%. Added a RAG-based query interface for threat hunters.', metric: 'cases' },
      { tag: 'UEBA', system: 'ueba', headline: 'UEBA detection models', text: 'Isolation Forest, autoencoder, GNN and Random Forest models over user and entity activity. Detection coverage up 25%, false positives down 82%.', metric: 'fp' },
      { tag: 'CI/CD', system: 'actions', headline: 'Jenkins to GitHub Actions', text: 'Pipelines deploying SOAR and UEBA on GCP and IAM and other services on Azure, provisioning with Terraform and configuring with Ansible.' },
      { tag: 'OBS', system: 'observability', headline: 'Observability service', text: 'Prometheus-style health, ingest throughput, queue depth, backpressure and per-tenant usage, with a React dashboard and threshold alerts used by the on-call team.' },
    ],
  },
  {
    id: 'fluentgrid',
    company: 'FluentGrid Limited',
    title: 'Intern',
    when: 'Jan 2024 – May 2024',
    start: '2024-01',
    place: 'India',
    items: [
      { tag: 'ML', system: 'meter-data', headline: 'Meter data and an ML barcode reader', text: 'Analysed 5M+ gas, electric and water meter records to inform regional resource allocation. Built an ML-powered barcode reader that raised collection accuracy by 70% over the earlier workflow.' },
    ],
  },
  {
    id: 'motadata',
    company: 'Mindarray Systems (Motadata)',
    title: 'Intern',
    when: 'Jul 2023 – Dec 2023',
    start: '2023-07',
    place: 'India',
    items: [
      { tag: 'QUERY', system: 'query-engine', headline: 'Java query system', text: 'Executes complex filters over 1M+ records in under 2 ms. Also built a Python/C# log parser for real-time ML-based categorisation.' },
    ],
  },
]

export const projects = [
  {
    id: 'siem',
    name: 'Distributed SIEM log store and query engine',
    lang: 'Rust',
    when: 'Jul 2026 – present',
    status: 'In progress',
    text: 'Tenant-aware sharding, replicated ingestion, compressed columnar storage, indexed search, automatic promotion of frequently queried JSON fields to typed columns, end-to-end policy-based access control, and a React investigation dashboard.',
  },
  {
    id: 'repair',
    name: 'Automated correction of programming errors',
    lang: 'Deep learning',
    when: 'Feb 2024 – May 2024',
    status: 'Completed',
    text: 'GRU and LSTM models for automated program repair, reaching 95% accuracy on a purpose-built dataset of 50,000+ C code samples with syntax errors.',
  },
]

export const skills = [
  { group: 'Languages', items: ['Rust', 'Python', 'Java', 'JavaScript', 'C++', 'C'] },
  { group: 'Data', items: ['ClickHouse', 'PostgreSQL', 'OpenSearch', 'SQL', 'Qdrant', 'MongoDB'] },
  { group: 'Full-stack', items: ['React', 'Node.js', 'REST', 'gRPC', 'FastAPI', '.NET'] },
  { group: 'Infrastructure', items: ['Kubernetes', 'GCP', 'Azure', 'GitHub Actions', 'Terraform', 'Ansible', 'Prometheus', 'Docker', 'Linux'] },
  { group: 'AI & ML', items: ['Anomaly detection', 'RAG pipelines', 'PyTorch', 'TensorFlow'] },
]
