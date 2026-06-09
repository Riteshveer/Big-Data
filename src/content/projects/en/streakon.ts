import type { ProjectContent } from "../../types";

export default {
  title: "AI-Powered Customer Analytics Platform",
  theme: "light",
  tags: ["pyspark", "kafka", "airflow", "databricks", "snowflake", "tensorflow", "docker", "kubernetes"],
  videoBorder: false,
  source: "https://github.com/Riteshveer",
  description:
    "Modern enterprises generate millions of customer interactions daily across websites, mobile apps, CRM systems, and transaction platforms. Traditional analytics struggle with real-time processing, resulting in delayed reporting and missed opportunities.<br/><br/>This platform implements a scalable end-to-end big data and AI ecosystem capable of ingesting, processing, analyzing, and predicting customer behavior in real time.",
  components: [
    {
      type: "architectureDiagram",
      props: {},
    },
    {
      type: "text",
      props: {
        title: "Architecture Overview",
        text: "The platform follows a modern lakehouse architecture with multi-layer data processing. Raw data flows from diverse sources through Kafka for real-time streaming, gets orchestrated by Apache Airflow, processed at scale with PySpark, refined through Databricks with Delta Lake's Bronze → Silver → Gold medallion architecture, warehoused in Snowflake, and served through FastAPI endpoints — all containerized with Docker and orchestrated by Kubernetes.",
      },
    },
    {
      type: "list",
      props: {
        title: "Data Ingestion & Streaming",
        items: [
          "<strong>Apache Kafka</strong> — Real-time event streaming handling 10M+ events daily from APIs, CRM systems, transaction platforms, and clickstream data.",
          "<strong>HDFS & Hadoop</strong> — Distributed storage for massive historical datasets with fault-tolerant replication.",
          "<strong>Apache Airflow</strong> — Workflow orchestration managing 200+ DAGs for scheduled batch processing and pipeline monitoring.",
        ],
      },
    },
    {
      type: "list",
      props: {
        title: "Data Processing & Transformation",
        items: [
          "<strong>PySpark</strong> — Distributed data processing at petabyte scale with optimized Spark SQL queries and custom UDFs.",
          "<strong>Databricks</strong> — Unified analytics platform for collaborative ETL development, notebook-based exploration, and automated job clusters.",
          "<strong>Delta Lake</strong> — ACID-compliant lakehouse with Bronze (raw), Silver (cleaned), and Gold (business-ready) layers ensuring data quality and lineage.",
        ],
      },
    },
    {
      type: "list",
      props: {
        title: "Enterprise Data Warehouse",
        items: [
          "<strong>Snowflake</strong> — Cloud-native data warehouse with auto-scaling compute, zero-copy cloning, and time-travel capabilities for enterprise reporting.",
          "<strong>Hive</strong> — SQL interface for querying distributed datasets across HDFS with optimized partitioning and bucketing strategies.",
        ],
      },
    },
    {
      type: "list",
      props: {
        title: "Machine Learning & AI",
        items: [
          "<strong>TensorFlow</strong> — Deep learning models for customer churn prediction, fraud detection, and personalized recommendation engines.",
          "<strong>MLflow</strong> — End-to-end ML lifecycle management including experiment tracking, model versioning, and automated deployment pipelines.",
          "<strong>Feature Store</strong> — Centralized feature engineering layer serving consistent features for both training and real-time inference.",
        ],
      },
    },
    {
      type: "list",
      props: {
        title: "Deployment & Infrastructure",
        items: [
          "<strong>FastAPI</strong> — High-performance model serving APIs with sub-2-second prediction latency and async request handling.",
          "<strong>Docker</strong> — Containerized microservices ensuring consistent environments across development, staging, and production.",
          "<strong>Kubernetes</strong> — Auto-scaling orchestration managing 50+ services with rolling deployments and self-healing capabilities.",
        ],
      },
    },
    {
      type: "list",
      props: {
        title: "Monitoring & Visualization",
        items: [
          "<strong>Power BI</strong> — Executive dashboards providing real-time business intelligence with drill-down capabilities and scheduled reports.",
          "<strong>Grafana</strong> — Infrastructure monitoring with custom dashboards tracking pipeline health, latency, throughput, and error rates.",
        ],
      },
    },
    {
      type: "text",
      props: {
        title: "Technical Challenges Solved",
        text: "<strong>Challenge:</strong> Processing millions of events in real time<br/><strong>Solution:</strong> Kafka + Spark Streaming with exactly-once semantics<br/><br/><strong>Challenge:</strong> Data quality across heterogeneous sources<br/><strong>Solution:</strong> Delta Lake validation pipelines with automated data quality checks<br/><br/><strong>Challenge:</strong> ML model deployment at scale<br/><strong>Solution:</strong> Docker + Kubernetes with A/B testing and canary deployments<br/><br/><strong>Challenge:</strong> End-to-end observability<br/><strong>Solution:</strong> Grafana + Prometheus with custom alerting rules and SLA monitoring",
      },
    },
    {
      type: "text",
      props: {
        title: "Business Impact",
        text: "📊 <strong>10M+ Events Processed Daily</strong> — Handling enterprise-scale data volumes with sub-second ingestion<br/><br/>⚡ <strong>&lt; 2 Seconds Prediction Latency</strong> — Real-time ML inference for immediate business decisions<br/><br/>🎯 <strong>95% Fraud Detection Accuracy</strong> — Deep learning models catching fraudulent transactions in real time<br/><br/>📈 <strong>20% Increase in Recommendation Conversion</strong> — Personalized customer experiences driving revenue<br/><br/>💰 <strong>30% Reduction in Customer Churn</strong> — Predictive models identifying at-risk customers early<br/><br/>🚀 <strong>40% Faster Business Decision Making</strong> — Real-time dashboards replacing weekly batch reports",
      },
    },
  ],
} as const satisfies ProjectContent;
