import type { ProjectContent } from "../../types";

export default {
  title: "KI-gestützte Kundenanalyse-Plattform",
  theme: "light",
  tags: ["pyspark", "kafka", "airflow", "databricks", "snowflake", "tensorflow", "docker", "kubernetes"],
  videoBorder: false,
  source: "https://github.com/Riteshveer",
  description:
    "Moderne Unternehmen generieren täglich Millionen von Kundeninteraktionen über Websites, mobile Apps, CRM-Systeme und Transaktionsplattformen. Traditionelle Analysen scheitern an der Echtzeitverarbeitung.<br/><br/>Diese Plattform implementiert ein skalierbares End-to-End Big Data und KI-Ökosystem, das Kundenverhalten in Echtzeit aufnimmt, verarbeitet, analysiert und vorhersagt.",
  components: [
    {
      type: "architectureDiagram",
      props: {},
    },
    {
      type: "text",
      props: {
        title: "Architektur-Überblick",
        text: "Die Plattform folgt einer modernen Lakehouse-Architektur mit mehrschichtiger Datenverarbeitung. Rohdaten fließen von diversen Quellen durch Kafka für Echtzeit-Streaming, werden von Apache Airflow orchestriert, mit PySpark im großen Maßstab verarbeitet, durch Databricks mit Delta Lakes Bronze → Silver → Gold Medaillon-Architektur veredelt, in Snowflake gespeichert und über FastAPI-Endpunkte bereitgestellt — alles containerisiert mit Docker und orchestriert durch Kubernetes.",
      },
    },
    {
      type: "list",
      props: {
        title: "Datenaufnahme & Streaming",
        items: [
          "<strong>Apache Kafka</strong> — Echtzeit-Event-Streaming mit 10M+ Events täglich von APIs, CRM-Systemen, Transaktionsplattformen und Clickstream-Daten.",
          "<strong>HDFS & Hadoop</strong> — Verteilter Speicher für massive historische Datensätze mit fehlertoleranter Replikation.",
          "<strong>Apache Airflow</strong> — Workflow-Orchestrierung mit 200+ DAGs für geplante Batch-Verarbeitung und Pipeline-Monitoring.",
        ],
      },
    },
    {
      type: "list",
      props: {
        title: "Datenverarbeitung & Transformation",
        items: [
          "<strong>PySpark</strong> — Verteilte Datenverarbeitung im Petabyte-Maßstab mit optimierten Spark-SQL-Abfragen und benutzerdefinierten UDFs.",
          "<strong>Databricks</strong> — Einheitliche Analyseplattform für kollaborative ETL-Entwicklung, Notebook-basierte Exploration und automatisierte Job-Cluster.",
          "<strong>Delta Lake</strong> — ACID-konforme Lakehouse mit Bronze (roh), Silver (bereinigt) und Gold (geschäftsreif) Schichten.",
        ],
      },
    },
    {
      type: "list",
      props: {
        title: "Enterprise Data Warehouse",
        items: [
          "<strong>Snowflake</strong> — Cloud-natives Data Warehouse mit Auto-Scaling, Zero-Copy-Cloning und Time-Travel für Enterprise-Reporting.",
          "<strong>Hive</strong> — SQL-Interface für Abfragen verteilter Datensätze über HDFS mit optimierten Partitionierungs- und Bucketing-Strategien.",
        ],
      },
    },
    {
      type: "list",
      props: {
        title: "Machine Learning & KI",
        items: [
          "<strong>TensorFlow</strong> — Deep-Learning-Modelle für Kundenchurn-Vorhersage, Betrugserkennung und personalisierte Empfehlungssysteme.",
          "<strong>MLflow</strong> — End-to-End ML-Lifecycle-Management mit Experiment-Tracking, Modell-Versionierung und automatisierten Deployment-Pipelines.",
          "<strong>Feature Store</strong> — Zentralisierte Feature-Engineering-Schicht für konsistente Features in Training und Echtzeit-Inferenz.",
        ],
      },
    },
    {
      type: "list",
      props: {
        title: "Deployment & Infrastruktur",
        items: [
          "<strong>FastAPI</strong> — Hochperformante Model-Serving-APIs mit unter 2 Sekunden Vorhersage-Latenz und asynchroner Verarbeitung.",
          "<strong>Docker</strong> — Containerisierte Microservices für konsistente Umgebungen über Entwicklung, Staging und Produktion.",
          "<strong>Kubernetes</strong> — Auto-Scaling-Orchestrierung mit 50+ Services, Rolling Deployments und Self-Healing.",
        ],
      },
    },
    {
      type: "list",
      props: {
        title: "Monitoring & Visualisierung",
        items: [
          "<strong>Power BI</strong> — Executive-Dashboards mit Echtzeit-Business-Intelligence, Drill-Down-Funktionen und geplanten Berichten.",
          "<strong>Grafana</strong> — Infrastruktur-Monitoring mit Custom-Dashboards für Pipeline-Gesundheit, Latenz, Durchsatz und Fehlerraten.",
        ],
      },
    },
    {
      type: "text",
      props: {
        title: "Gelöste technische Herausforderungen",
        text: "<strong>Herausforderung:</strong> Verarbeitung von Millionen Events in Echtzeit<br/><strong>Lösung:</strong> Kafka + Spark Streaming mit Exactly-Once-Semantik<br/><br/><strong>Herausforderung:</strong> Datenqualität über heterogene Quellen<br/><strong>Lösung:</strong> Delta Lake Validierungs-Pipelines mit automatisierten Qualitätsprüfungen<br/><br/><strong>Herausforderung:</strong> ML-Model-Deployment im großen Maßstab<br/><strong>Lösung:</strong> Docker + Kubernetes mit A/B-Testing und Canary-Deployments<br/><br/><strong>Herausforderung:</strong> End-to-End Observability<br/><strong>Lösung:</strong> Grafana + Prometheus mit benutzerdefinierten Alerting-Regeln und SLA-Monitoring",
      },
    },
    {
      type: "text",
      props: {
        title: "Geschäftliche Auswirkung",
        text: "📊 <strong>10M+ Events täglich verarbeitet</strong> — Enterprise-Datenvolumen mit Sub-Sekunden-Aufnahme<br/><br/>⚡ <strong>&lt; 2 Sekunden Vorhersage-Latenz</strong> — Echtzeit-ML-Inferenz für sofortige Geschäftsentscheidungen<br/><br/>🎯 <strong>95% Betrugserkennungs-Genauigkeit</strong> — Deep-Learning-Modelle erkennen betrügerische Transaktionen in Echtzeit<br/><br/>📈 <strong>20% Steigerung der Empfehlungs-Conversion</strong> — Personalisierte Kundenerlebnisse treiben Umsatz<br/><br/>💰 <strong>30% Reduktion der Kundenfluktuation</strong> — Prädiktive Modelle identifizieren gefährdete Kunden frühzeitig<br/><br/>🚀 <strong>40% Schnellere Geschäftsentscheidungen</strong> — Echtzeit-Dashboards ersetzen wöchentliche Batch-Reports",
      },
    },
  ],
} as const satisfies ProjectContent;
