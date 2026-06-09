export type TagVariant =
  | "three"
  | "websockets"
  | "react"
  | "redis"
  | "gray"
  | "html"
  | "css"
  | "javascript"
  | "node"
  | "next"
  | "kubernetes"
  | "postgresql"
  | "ogl"
  | "glsl"
  | "pyspark"
  | "kafka"
  | "airflow"
  | "hadoop"
  | "hive"
  | "databricks"
  | "deltalake"
  | "snowflake"
  | "tensorflow"
  | "mlflow"
  | "fastapi"
  | "docker"
  | "powerbi"
  | "grafana"
  | "python";

export const tagLabels = {
  three: "Three.js",
  websockets: "WebSockets",
  react: "React",
  redis: "Redis",
  gray: "Gray",
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
  node: "Node.js",
  next: "Next.js",
  kubernetes: "Kubernetes",
  postgresql: "PostgreSQL",
  ogl: "OGL.js",
  glsl: "GLSL",
  pyspark: "PySpark",
  kafka: "Kafka",
  airflow: "Airflow",
  hadoop: "Hadoop",
  hive: "Hive",
  databricks: "Databricks",
  deltalake: "Delta Lake",
  snowflake: "Snowflake",
  tensorflow: "TensorFlow",
  mlflow: "MLflow",
  fastapi: "FastAPI",
  docker: "Docker",
  powerbi: "Power BI",
  grafana: "Grafana",
  python: "Python",
} as const satisfies Record<TagVariant, string>;
