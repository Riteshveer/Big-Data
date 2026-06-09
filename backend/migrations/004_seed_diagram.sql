-- Seed the architecture diagram for streakon project
INSERT OR REPLACE INTO diagrams (id, project_id, title, nodes, edges, updated_at) VALUES (
  1,
  'streakon',
  'End-to-End Data Pipeline Architecture',
  '[{"id":"n1","label":"Fact Orders","icon":"📋","col":0,"row":0},{"id":"n2","label":"Order Details","icon":"📄","col":0,"row":1},{"id":"n3","label":"Customers","icon":"👥","col":0,"row":2},{"id":"n4","label":"Categories","icon":"🗂️","col":0,"row":3},{"id":"n5","label":"Data Warehouse","icon":"🏗️","col":1,"row":0},{"id":"n6","label":"Azure SQL","icon":"☁️","col":1,"row":1},{"id":"n7","label":"DataFlow Gen2","icon":"🔄","col":1,"row":2},{"id":"n8","label":"Files","icon":"📁","col":1,"row":3},{"id":"n9","label":"Lakehouse","icon":"🏠","col":2,"row":1.5},{"id":"n10","label":"SQL Analytics","icon":"📊","col":3,"row":0.5},{"id":"n11","label":"Data Modelling","icon":"🔷","col":3,"row":2.5},{"id":"n12","label":"Power BI","icon":"📈","col":4,"row":1.5}]',
  '[["n1","n5"],["n2","n6"],["n3","n7"],["n4","n8"],["n5","n9"],["n6","n9"],["n7","n9"],["n8","n9"],["n9","n10"],["n9","n11"],["n10","n12"],["n11","n12"]]',
  datetime('now')
);
