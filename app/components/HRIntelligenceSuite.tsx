import { useState, useRef, useEffect } from "react";

// ── EMBEDDED DATA (from awards_enriched.csv) ─────────────────────────────────
const DATA = {"invisibleContributors": [{"id": "1089", "name": "Thomas Brown", "dept": "Product", "title": "Product Manager", "seniority": "Director", "given": 7, "received": 0, "riskScore": 100}, {"id": "1039", "name": "Patricia Martinez", "dept": "Design", "title": "Senior Designer", "seniority": "Director", "given": 5, "received": 0, "riskScore": 75}, {"id": "1227", "name": "Sarah Lee", "dept": "Customer Service", "title": "Account Manager", "seniority": "VP", "given": 5, "received": 0, "riskScore": 75}, {"id": "1274", "name": "Christopher Thomas", "dept": "Customer Service", "title": "Director", "seniority": "Manager", "given": 5, "received": 0, "riskScore": 75}, {"id": "1101", "name": "David Garcia", "dept": "Marketing", "title": "Product Marketing Manager", "seniority": "Manager", "given": 5, "received": 0, "riskScore": 75}, {"id": "1378", "name": "Matthew Martin", "dept": "IT", "title": "Specialist", "seniority": "IC", "given": 5, "received": 0, "riskScore": 75}, {"id": "1497", "name": "Susan Hernandez", "dept": "Data Science", "title": "Manager", "seniority": "Director", "given": 4, "received": 0, "riskScore": 60}, {"id": "1163", "name": "David Lee", "dept": "Finance", "title": "Manager", "seniority": "IC", "given": 4, "received": 0, "riskScore": 60}, {"id": "1302", "name": "Matthew Hernandez", "dept": "Finance", "title": "Manager", "seniority": "Manager", "given": 4, "received": 0, "riskScore": 60}, {"id": "1296", "name": "Thomas Martinez", "dept": "HR", "title": "HR Manager", "seniority": "Manager", "given": 4, "received": 0, "riskScore": 60}, {"id": "1341", "name": "Richard Rodriguez", "dept": "Legal", "title": "Attorney", "seniority": "VP", "given": 4, "received": 0, "riskScore": 60}, {"id": "1250", "name": "Nancy Jones", "dept": "Finance", "title": "Director", "seniority": "VP", "given": 3, "received": 0, "riskScore": 45}, {"id": "1036", "name": "Joseph Hernandez", "dept": "Customer Service", "title": "Director", "seniority": "Manager", "given": 3, "received": 0, "riskScore": 45}, {"id": "1034", "name": "Jennifer Wilson", "dept": "Legal", "title": "Counsel", "seniority": "IC", "given": 3, "received": 0, "riskScore": 45}, {"id": "1299", "name": "Linda Wilson", "dept": "Legal", "title": "Attorney", "seniority": "Senior Manager", "given": 3, "received": 0, "riskScore": 45}, {"id": "1318", "name": "Elizabeth Williams", "dept": "Engineering", "title": "Software Engineer", "seniority": "Manager", "given": 3, "received": 0, "riskScore": 45}, {"id": "1158", "name": "Mary Miller", "dept": "IT", "title": "Director", "seniority": "IC", "given": 3, "received": 0, "riskScore": 45}, {"id": "1407", "name": "Joseph Anderson", "dept": "Operations", "title": "Coordinator", "seniority": "VP", "given": 3, "received": 0, "riskScore": 45}, {"id": "1188", "name": "Jessica Smith", "dept": "Operations", "title": "Coordinator", "seniority": "Manager", "given": 3, "received": 0, "riskScore": 45}, {"id": "1249", "name": "Thomas Martinez", "dept": "Legal", "title": "Specialist", "seniority": "VP", "given": 3, "received": 0, "riskScore": 45}], "risingStars": [{"id": "1033", "name": "Elizabeth Johnson", "dept": "Data Science", "seniority": "Manager", "slope": 0.5, "total": 5, "recent": 5, "early": 5, "months": 3, "monthlyData": [{"period": "2025-05", "awards": 1}, {"period": "2025-07", "awards": 2}, {"period": "2025-12", "awards": 2}]}, {"id": "1107", "name": "Linda Lopez", "dept": "Product", "seniority": "IC", "slope": 0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-07", "awards": 1}, {"period": "2025-09", "awards": 1}, {"period": "2025-11", "awards": 2}]}, {"id": "1162", "name": "Barbara Anderson", "dept": "Operations", "seniority": "Director", "slope": 0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-02", "awards": 1}, {"period": "2025-06", "awards": 1}, {"period": "2025-09", "awards": 2}]}, {"id": "1369", "name": "Mary Moore", "dept": "Operations", "seniority": "Senior Manager", "slope": 0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-05", "awards": 1}, {"period": "2025-06", "awards": 1}, {"period": "2025-08", "awards": 2}]}, {"id": "1425", "name": "Michael Anderson", "dept": "Finance", "seniority": "Senior IC", "slope": 0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-01", "awards": 1}, {"period": "2025-02", "awards": 1}, {"period": "2025-07", "awards": 2}]}, {"id": "1458", "name": "Charles Moore", "dept": "IT", "seniority": "VP", "slope": 0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-05", "awards": 1}, {"period": "2025-09", "awards": 1}, {"period": "2025-12", "awards": 2}]}, {"id": "1467", "name": "Robert Lee", "dept": "Finance", "seniority": "Senior Manager", "slope": 0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-03", "awards": 1}, {"period": "2025-05", "awards": 1}, {"period": "2025-10", "awards": 2}]}, {"id": "1492", "name": "James Miller", "dept": "IT", "seniority": "VP", "slope": 0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-07", "awards": 1}, {"period": "2025-09", "awards": 1}, {"period": "2025-12", "awards": 2}]}, {"id": "1061", "name": "Thomas Jackson", "dept": "Finance", "seniority": "Director", "slope": 0.3, "total": 5, "recent": 4, "early": 3, "months": 4, "monthlyData": [{"period": "2025-01", "awards": 1}, {"period": "2025-03", "awards": 1}, {"period": "2025-05", "awards": 1}, {"period": "2025-09", "awards": 2}]}, {"id": "1498", "name": "Elizabeth Anderson", "dept": "Data Science", "seniority": "Senior Manager", "slope": 0.3, "total": 5, "recent": 4, "early": 3, "months": 4, "monthlyData": [{"period": "2025-01", "awards": 1}, {"period": "2025-03", "awards": 1}, {"period": "2025-06", "awards": 1}, {"period": "2025-12", "awards": 2}]}, {"id": "1393", "name": "Barbara Perez", "dept": "Sales", "seniority": "Manager", "slope": 0.143, "total": 7, "recent": 4, "early": 3, "months": 6, "monthlyData": [{"period": "2025-02", "awards": 1}, {"period": "2025-03", "awards": 1}, {"period": "2025-05", "awards": 1}, {"period": "2025-07", "awards": 1}, {"period": "2025-11", "awards": 1}, {"period": "2025-12", "awards": 2}]}, {"id": "1155", "name": "Sarah Smith", "dept": "Design", "seniority": "Senior Manager", "slope": 0.1, "total": 5, "recent": 4, "early": 4, "months": 4, "monthlyData": [{"period": "2025-01", "awards": 1}, {"period": "2025-02", "awards": 1}, {"period": "2025-08", "awards": 2}, {"period": "2025-09", "awards": 1}]}, {"id": "1176", "name": "Christopher Rodriguez", "dept": "IT", "seniority": "VP", "slope": 0.1, "total": 5, "recent": 4, "early": 4, "months": 4, "monthlyData": [{"period": "2025-02", "awards": 1}, {"period": "2025-03", "awards": 1}, {"period": "2025-05", "awards": 2}, {"period": "2025-09", "awards": 1}]}, {"id": "1210", "name": "Lisa Miller", "dept": "Engineering", "seniority": "Director", "slope": 0.1, "total": 5, "recent": 4, "early": 4, "months": 4, "monthlyData": [{"period": "2025-09", "awards": 1}, {"period": "2025-10", "awards": 1}, {"period": "2025-11", "awards": 2}, {"period": "2025-12", "awards": 1}]}, {"id": "1006", "name": "Joseph Rodriguez", "dept": "HR", "seniority": "VP", "slope": 0.0, "total": 3, "recent": 3, "early": 3, "months": 3, "monthlyData": [{"period": "2025-04", "awards": 1}, {"period": "2025-06", "awards": 1}, {"period": "2025-11", "awards": 1}]}], "decliningRecognition": [{"id": "1073", "name": "Susan Anderson", "dept": "Customer Service", "seniority": "VP", "slope": -0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-01", "awards": 2}, {"period": "2025-10", "awards": 1}, {"period": "2025-11", "awards": 1}]}, {"id": "1096", "name": "Susan Thompson", "dept": "Product", "seniority": "Manager", "slope": -0.5, "total": 5, "recent": 5, "early": 5, "months": 3, "monthlyData": [{"period": "2025-05", "awards": 2}, {"period": "2025-08", "awards": 2}, {"period": "2025-11", "awards": 1}]}, {"id": "1293", "name": "Patricia Davis", "dept": "Engineering", "seniority": "VP", "slope": -0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-02", "awards": 2}, {"period": "2025-04", "awards": 1}, {"period": "2025-09", "awards": 1}]}, {"id": "1320", "name": "Lisa Thompson", "dept": "Marketing", "seniority": "Manager", "slope": -0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-01", "awards": 2}, {"period": "2025-11", "awards": 1}, {"period": "2025-12", "awards": 1}]}, {"id": "1334", "name": "Joseph Thompson", "dept": "Finance", "seniority": "IC", "slope": -0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-04", "awards": 2}, {"period": "2025-05", "awards": 1}, {"period": "2025-10", "awards": 1}]}, {"id": "1344", "name": "Elizabeth Thompson", "dept": "Customer Service", "seniority": "Senior IC", "slope": -0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-06", "awards": 2}, {"period": "2025-11", "awards": 1}, {"period": "2025-12", "awards": 1}]}, {"id": "1368", "name": "William Martin", "dept": "IT", "seniority": "Senior IC", "slope": -0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-01", "awards": 2}, {"period": "2025-06", "awards": 1}, {"period": "2025-09", "awards": 1}]}, {"id": "1476", "name": "Jennifer Brown", "dept": "Customer Service", "seniority": "Manager", "slope": -0.5, "total": 4, "recent": 4, "early": 4, "months": 3, "monthlyData": [{"period": "2025-01", "awards": 2}, {"period": "2025-04", "awards": 1}, {"period": "2025-12", "awards": 1}]}, {"id": "1165", "name": "Thomas Lopez", "dept": "Customer Service", "seniority": "Manager", "slope": -0.3, "total": 5, "recent": 3, "early": 4, "months": 4, "monthlyData": [{"period": "2025-02", "awards": 2}, {"period": "2025-08", "awards": 1}, {"period": "2025-10", "awards": 1}, {"period": "2025-12", "awards": 1}]}, {"id": "1213", "name": "Lisa Davis", "dept": "HR", "seniority": "IC", "slope": -0.3, "total": 5, "recent": 3, "early": 4, "months": 4, "monthlyData": [{"period": "2025-01", "awards": 2}, {"period": "2025-02", "awards": 1}, {"period": "2025-06", "awards": 1}, {"period": "2025-11", "awards": 1}]}, {"id": "1400", "name": "Charles Williams", "dept": "Operations", "seniority": "Director", "slope": -0.3, "total": 5, "recent": 3, "early": 4, "months": 4, "monthlyData": [{"period": "2025-01", "awards": 2}, {"period": "2025-02", "awards": 1}, {"period": "2025-09", "awards": 1}, {"period": "2025-11", "awards": 1}]}, {"id": "1409", "name": "Patricia Martinez", "dept": "IT", "seniority": "VP", "slope": -0.3, "total": 5, "recent": 3, "early": 4, "months": 4, "monthlyData": [{"period": "2025-04", "awards": 2}, {"period": "2025-05", "awards": 1}, {"period": "2025-06", "awards": 1}, {"period": "2025-07", "awards": 1}]}, {"id": "1105", "name": "Jessica Brown", "dept": "Customer Service", "seniority": "IC", "slope": -0.1, "total": 5, "recent": 4, "early": 4, "months": 4, "monthlyData": [{"period": "2025-03", "awards": 1}, {"period": "2025-06", "awards": 2}, {"period": "2025-07", "awards": 1}, {"period": "2025-11", "awards": 1}]}, {"id": "1350", "name": "Richard Rodriguez", "dept": "Sales", "seniority": "VP", "slope": -0.1, "total": 5, "recent": 4, "early": 4, "months": 4, "monthlyData": [{"period": "2025-05", "awards": 1}, {"period": "2025-06", "awards": 2}, {"period": "2025-07", "awards": 1}, {"period": "2025-12", "awards": 1}]}], "crossDeptFlow": [{"from": "Marketing", "to": "Finance", "value": 16}, {"from": "Data Science", "to": "Product", "value": 14}, {"from": "Legal", "to": "Engineering", "value": 14}, {"from": "Legal", "to": "Marketing", "value": 13}, {"from": "Marketing", "to": "Customer Service", "value": 13}, {"from": "Product", "to": "Customer Service", "value": 13}, {"from": "Engineering", "to": "Data Science", "value": 12}, {"from": "Engineering", "to": "HR", "value": 12}, {"from": "Legal", "to": "Design", "value": 12}, {"from": "Legal", "to": "Sales", "value": 12}, {"from": "Data Science", "to": "IT", "value": 11}, {"from": "Finance", "to": "Marketing", "value": 11}, {"from": "IT", "to": "Customer Service", "value": 11}, {"from": "Marketing", "to": "Data Science", "value": 11}, {"from": "Operations", "to": "Marketing", "value": 11}, {"from": "Customer Service", "to": "Data Science", "value": 10}, {"from": "Customer Service", "to": "IT", "value": 10}, {"from": "Data Science", "to": "Finance", "value": 10}, {"from": "Design", "to": "Product", "value": 10}, {"from": "Engineering", "to": "Legal", "value": 10}, {"from": "Finance", "to": "HR", "value": 10}, {"from": "IT", "to": "Marketing", "value": 10}, {"from": "Legal", "to": "Customer Service", "value": 10}, {"from": "Legal", "to": "Product", "value": 10}, {"from": "Product", "to": "Engineering", "value": 10}, {"from": "Product", "to": "Legal", "value": 10}, {"from": "Customer Service", "to": "Design", "value": 9}, {"from": "Customer Service", "to": "Operations", "value": 9}, {"from": "Design", "to": "Customer Service", "value": 9}, {"from": "HR", "to": "Product", "value": 9}, {"from": "IT", "to": "Finance", "value": 9}, {"from": "Legal", "to": "Data Science", "value": 9}, {"from": "Legal", "to": "HR", "value": 9}, {"from": "Legal", "to": "Operations", "value": 9}, {"from": "Marketing", "to": "Design", "value": 9}, {"from": "Marketing", "to": "Legal", "value": 9}, {"from": "Product", "to": "Marketing", "value": 9}, {"from": "Customer Service", "to": "Finance", "value": 8}, {"from": "Customer Service", "to": "Legal", "value": 8}, {"from": "Customer Service", "to": "Marketing", "value": 8}, {"from": "Customer Service", "to": "Sales", "value": 8}, {"from": "Data Science", "to": "HR", "value": 8}, {"from": "Data Science", "to": "Legal", "value": 8}, {"from": "Design", "to": "Finance", "value": 8}, {"from": "Design", "to": "IT", "value": 8}, {"from": "Design", "to": "Marketing", "value": 8}, {"from": "Finance", "to": "Customer Service", "value": 8}, {"from": "Finance", "to": "Design", "value": 8}, {"from": "HR", "to": "Data Science", "value": 8}, {"from": "HR", "to": "Operations", "value": 8}, {"from": "HR", "to": "Sales", "value": 8}, {"from": "IT", "to": "Data Science", "value": 8}, {"from": "Operations", "to": "Finance", "value": 8}, {"from": "Operations", "to": "Product", "value": 8}, {"from": "Product", "to": "Design", "value": 8}, {"from": "Product", "to": "Sales", "value": 8}, {"from": "Customer Service", "to": "Engineering", "value": 7}, {"from": "Data Science", "to": "Sales", "value": 7}, {"from": "Design", "to": "Data Science", "value": 7}, {"from": "Design", "to": "Legal", "value": 7}, {"from": "Engineering", "to": "Finance", "value": 7}, {"from": "Engineering", "to": "Product", "value": 7}, {"from": "Legal", "to": "IT", "value": 7}, {"from": "Marketing", "to": "Sales", "value": 7}, {"from": "Operations", "to": "Design", "value": 7}, {"from": "Operations", "to": "Legal", "value": 7}, {"from": "Operations", "to": "Sales", "value": 7}, {"from": "Sales", "to": "HR", "value": 7}, {"from": "Sales", "to": "Marketing", "value": 7}, {"from": "Data Science", "to": "Design", "value": 6}, {"from": "Data Science", "to": "Marketing", "value": 6}, {"from": "Engineering", "to": "IT", "value": 6}, {"from": "Engineering", "to": "Operations", "value": 6}, {"from": "Engineering", "to": "Sales", "value": 6}, {"from": "Finance", "to": "Engineering", "value": 6}, {"from": "Finance", "to": "Product", "value": 6}, {"from": "Finance", "to": "Sales", "value": 6}, {"from": "HR", "to": "Finance", "value": 6}, {"from": "HR", "to": "Marketing", "value": 6}, {"from": "IT", "to": "Engineering", "value": 6}, {"from": "Marketing", "to": "Engineering", "value": 6}, {"from": "Marketing", "to": "HR", "value": 6}, {"from": "Marketing", "to": "IT", "value": 6}, {"from": "Marketing", "to": "Product", "value": 6}, {"from": "Operations", "to": "Data Science", "value": 6}, {"from": "Product", "to": "Data Science", "value": 6}, {"from": "Product", "to": "Finance", "value": 6}, {"from": "Product", "to": "IT", "value": 6}, {"from": "Product", "to": "Operations", "value": 6}, {"from": "Sales", "to": "Customer Service", "value": 6}, {"from": "Sales", "to": "Design", "value": 6}, {"from": "Design", "to": "Engineering", "value": 5}, {"from": "Design", "to": "Operations", "value": 5}, {"from": "Finance", "to": "Legal", "value": 5}, {"from": "Finance", "to": "Operations", "value": 5}, {"from": "HR", "to": "Design", "value": 5}, {"from": "HR", "to": "Engineering", "value": 5}, {"from": "HR", "to": "IT", "value": 5}, {"from": "HR", "to": "Legal", "value": 5}, {"from": "IT", "to": "Design", "value": 5}, {"from": "IT", "to": "HR", "value": 5}, {"from": "Legal", "to": "Finance", "value": 5}, {"from": "Marketing", "to": "Operations", "value": 5}, {"from": "Operations", "to": "IT", "value": 5}, {"from": "Sales", "to": "Engineering", "value": 5}, {"from": "Sales", "to": "Finance", "value": 5}, {"from": "Sales", "to": "IT", "value": 5}, {"from": "Sales", "to": "Product", "value": 5}, {"from": "Customer Service", "to": "HR", "value": 4}, {"from": "Customer Service", "to": "Product", "value": 4}, {"from": "Data Science", "to": "Engineering", "value": 4}, {"from": "Engineering", "to": "Marketing", "value": 4}, {"from": "Finance", "to": "Data Science", "value": 4}, {"from": "IT", "to": "Legal", "value": 4}, {"from": "IT", "to": "Sales", "value": 4}, {"from": "Product", "to": "HR", "value": 4}, {"from": "Data Science", "to": "Customer Service", "value": 3}, {"from": "Engineering", "to": "Customer Service", "value": 3}, {"from": "IT", "to": "Operations", "value": 3}, {"from": "Operations", "to": "Customer Service", "value": 3}, {"from": "Operations", "to": "Engineering", "value": 3}, {"from": "Operations", "to": "HR", "value": 3}, {"from": "Sales", "to": "Data Science", "value": 3}, {"from": "Sales", "to": "Legal", "value": 3}, {"from": "Sales", "to": "Operations", "value": 3}, {"from": "Data Science", "to": "Operations", "value": 2}, {"from": "Design", "to": "HR", "value": 2}, {"from": "Finance", "to": "IT", "value": 2}, {"from": "Engineering", "to": "Design", "value": 1}, {"from": "HR", "to": "Customer Service", "value": 1}, {"from": "IT", "to": "Product", "value": 1}], "depts": ["Customer Service", "Data Science", "Design", "Engineering", "Finance", "HR", "IT", "Legal", "Marketing", "Operations", "Product", "Sales"], "equityData": [{"recipient_seniority": "Director", "count": 185, "avg_value": 420.0, "total_value": 77650, "high_value": 80, "high_value_pct": 43.2}, {"recipient_seniority": "IC", "count": 165, "avg_value": 405.0, "total_value": 66750, "high_value": 68, "high_value_pct": 41.2}, {"recipient_seniority": "Manager", "count": 131, "avg_value": 361.0, "total_value": 47250, "high_value": 51, "high_value_pct": 38.9}, {"recipient_seniority": "Senior IC", "count": 175, "avg_value": 392.0, "total_value": 68550, "high_value": 74, "high_value_pct": 42.3}, {"recipient_seniority": "Senior Manager", "count": 149, "avg_value": 422.0, "total_value": 62850, "high_value": 76, "high_value_pct": 51.0}, {"recipient_seniority": "VP", "count": 195, "avg_value": 407.0, "total_value": 79350, "high_value": 85, "high_value_pct": 43.6}], "managerReach": [{"id": "1089", "name": "Thomas Brown", "dept": "Product", "seniority": "Director", "total": 7, "unique_depts": 7, "avg_value": 379.0}, {"id": "1039", "name": "Patricia Martinez", "dept": "Design", "seniority": "Director", "total": 5, "unique_depts": 5, "avg_value": 360.0}, {"id": "1018", "name": "Patricia Perez", "dept": "Design", "seniority": "Senior Manager", "total": 6, "unique_depts": 5, "avg_value": 300.0}, {"id": "1122", "name": "Charles Miller", "dept": "Data Science", "seniority": "Senior Manager", "total": 6, "unique_depts": 5, "avg_value": 483.0}, {"id": "1371", "name": "Linda Anderson", "dept": "Sales", "seniority": "Manager", "total": 5, "unique_depts": 5, "avg_value": 520.0}, {"id": "1434", "name": "Robert Martinez", "dept": "Finance", "seniority": "Director", "total": 5, "unique_depts": 5, "avg_value": 570.0}, {"id": "1274", "name": "Christopher Thomas", "dept": "Customer Service", "seniority": "Manager", "total": 5, "unique_depts": 5, "avg_value": 260.0}, {"id": "1253", "name": "Charles Taylor", "dept": "Legal", "seniority": "Director", "total": 7, "unique_depts": 5, "avg_value": 586.0}, {"id": "1227", "name": "Sarah Lee", "dept": "Customer Service", "seniority": "VP", "total": 5, "unique_depts": 5, "avg_value": 290.0}, {"id": "1472", "name": "James Moore", "dept": "Engineering", "seniority": "Manager", "total": 6, "unique_depts": 5, "avg_value": 167.0}, {"id": "1178", "name": "Susan Thomas", "dept": "Operations", "seniority": "Senior Manager", "total": 4, "unique_depts": 4, "avg_value": 350.0}, {"id": "1172", "name": "Thomas Anderson", "dept": "Design", "seniority": "VP", "total": 4, "unique_depts": 4, "avg_value": 238.0}, {"id": "1087", "name": "Matthew Davis", "dept": "Product", "seniority": "Director", "total": 4, "unique_depts": 4, "avg_value": 388.0}, {"id": "1153", "name": "James Lee", "dept": "Data Science", "seniority": "Director", "total": 4, "unique_depts": 4, "avg_value": 375.0}, {"id": "1133", "name": "Daniel Martin", "dept": "Marketing", "seniority": "Manager", "total": 4, "unique_depts": 4, "avg_value": 588.0}, {"id": "1103", "name": "Lisa Perez", "dept": "HR", "seniority": "Manager", "total": 4, "unique_depts": 4, "avg_value": 225.0}, {"id": "1070", "name": "Christopher Lee", "dept": "Operations", "seniority": "VP", "total": 5, "unique_depts": 4, "avg_value": 600.0}, {"id": "1236", "name": "Michael Thompson", "dept": "Engineering", "seniority": "Senior Manager", "total": 4, "unique_depts": 4, "avg_value": 450.0}, {"id": "1293", "name": "Patricia Davis", "dept": "Engineering", "seniority": "VP", "total": 4, "unique_depts": 4, "avg_value": 525.0}, {"id": "1296", "name": "Thomas Martinez", "dept": "HR", "seniority": "Manager", "total": 4, "unique_depts": 4, "avg_value": 162.0}], "deptMonthly": {"Customer Service": [{"period": "2025-01", "awards": 8}, {"period": "2025-02", "awards": 13}, {"period": "2025-03", "awards": 7}, {"period": "2025-04", "awards": 6}, {"period": "2025-05", "awards": 3}, {"period": "2025-06", "awards": 10}, {"period": "2025-07", "awards": 12}, {"period": "2025-08", "awards": 3}, {"period": "2025-09", "awards": 7}, {"period": "2025-10", "awards": 8}, {"period": "2025-11", "awards": 8}, {"period": "2025-12", "awards": 6}], "Data Science": [{"period": "2025-01", "awards": 10}, {"period": "2025-02", "awards": 8}, {"period": "2025-03", "awards": 9}, {"period": "2025-04", "awards": 8}, {"period": "2025-05", "awards": 10}, {"period": "2025-06", "awards": 5}, {"period": "2025-07", "awards": 6}, {"period": "2025-08", "awards": 6}, {"period": "2025-09", "awards": 6}, {"period": "2025-10", "awards": 10}, {"period": "2025-11", "awards": 8}, {"period": "2025-12", "awards": 8}], "Design": [{"period": "2025-01", "awards": 9}, {"period": "2025-02", "awards": 10}, {"period": "2025-03", "awards": 3}, {"period": "2025-04", "awards": 6}, {"period": "2025-05", "awards": 10}, {"period": "2025-06", "awards": 1}, {"period": "2025-07", "awards": 7}, {"period": "2025-08", "awards": 13}, {"period": "2025-09", "awards": 8}, {"period": "2025-10", "awards": 9}, {"period": "2025-11", "awards": 2}, {"period": "2025-12", "awards": 6}], "Engineering": [{"period": "2025-01", "awards": 4}, {"period": "2025-02", "awards": 7}, {"period": "2025-03", "awards": 6}, {"period": "2025-04", "awards": 4}, {"period": "2025-05", "awards": 5}, {"period": "2025-06", "awards": 7}, {"period": "2025-07", "awards": 6}, {"period": "2025-08", "awards": 5}, {"period": "2025-09", "awards": 7}, {"period": "2025-10", "awards": 4}, {"period": "2025-11", "awards": 11}, {"period": "2025-12", "awards": 8}], "Finance": [{"period": "2025-01", "awards": 8}, {"period": "2025-02", "awards": 9}, {"period": "2025-03", "awards": 10}, {"period": "2025-04", "awards": 9}, {"period": "2025-05", "awards": 7}, {"period": "2025-06", "awards": 6}, {"period": "2025-07", "awards": 10}, {"period": "2025-08", "awards": 5}, {"period": "2025-09", "awards": 7}, {"period": "2025-10", "awards": 9}, {"period": "2025-11", "awards": 5}, {"period": "2025-12", "awards": 7}], "HR": [{"period": "2025-01", "awards": 9}, {"period": "2025-02", "awards": 5}, {"period": "2025-03", "awards": 4}, {"period": "2025-04", "awards": 7}, {"period": "2025-05", "awards": 11}, {"period": "2025-06", "awards": 7}, {"period": "2025-07", "awards": 5}, {"period": "2025-08", "awards": 7}, {"period": "2025-09", "awards": 4}, {"period": "2025-10", "awards": 4}, {"period": "2025-11", "awards": 4}, {"period": "2025-12", "awards": 10}], "IT": [{"period": "2025-01", "awards": 4}, {"period": "2025-02", "awards": 4}, {"period": "2025-03", "awards": 3}, {"period": "2025-04", "awards": 10}, {"period": "2025-05", "awards": 7}, {"period": "2025-06", "awards": 6}, {"period": "2025-07", "awards": 10}, {"period": "2025-08", "awards": 4}, {"period": "2025-09", "awards": 9}, {"period": "2025-10", "awards": 3}, {"period": "2025-11", "awards": 7}, {"period": "2025-12", "awards": 8}], "Legal": [{"period": "2025-01", "awards": 5}, {"period": "2025-02", "awards": 8}, {"period": "2025-03", "awards": 9}, {"period": "2025-04", "awards": 6}, {"period": "2025-05", "awards": 10}, {"period": "2025-06", "awards": 5}, {"period": "2025-07", "awards": 8}, {"period": "2025-08", "awards": 4}, {"period": "2025-09", "awards": 5}, {"period": "2025-10", "awards": 9}, {"period": "2025-11", "awards": 7}, {"period": "2025-12", "awards": 5}], "Marketing": [{"period": "2025-01", "awards": 8}, {"period": "2025-02", "awards": 9}, {"period": "2025-03", "awards": 4}, {"period": "2025-04", "awards": 11}, {"period": "2025-05", "awards": 14}, {"period": "2025-06", "awards": 8}, {"period": "2025-07", "awards": 8}, {"period": "2025-08", "awards": 4}, {"period": "2025-09", "awards": 10}, {"period": "2025-10", "awards": 10}, {"period": "2025-11", "awards": 10}, {"period": "2025-12", "awards": 4}], "Operations": [{"period": "2025-01", "awards": 10}, {"period": "2025-02", "awards": 5}, {"period": "2025-03", "awards": 4}, {"period": "2025-04", "awards": 2}, {"period": "2025-05", "awards": 7}, {"period": "2025-06", "awards": 6}, {"period": "2025-07", "awards": 2}, {"period": "2025-08", "awards": 6}, {"period": "2025-09", "awards": 9}, {"period": "2025-10", "awards": 3}, {"period": "2025-11", "awards": 4}, {"period": "2025-12", "awards": 6}], "Product": [{"period": "2025-01", "awards": 2}, {"period": "2025-02", "awards": 7}, {"period": "2025-03", "awards": 9}, {"period": "2025-04", "awards": 8}, {"period": "2025-05", "awards": 12}, {"period": "2025-06", "awards": 3}, {"period": "2025-07", "awards": 8}, {"period": "2025-08", "awards": 5}, {"period": "2025-09", "awards": 6}, {"period": "2025-10", "awards": 8}, {"period": "2025-11", "awards": 10}, {"period": "2025-12", "awards": 8}], "Sales": [{"period": "2025-01", "awards": 3}, {"period": "2025-02", "awards": 8}, {"period": "2025-03", "awards": 6}, {"period": "2025-04", "awards": 8}, {"period": "2025-05", "awards": 9}, {"period": "2025-06", "awards": 8}, {"period": "2025-07", "awards": 6}, {"period": "2025-08", "awards": 5}, {"period": "2025-09", "awards": 7}, {"period": "2025-10", "awards": 4}, {"period": "2025-11", "awards": 7}, {"period": "2025-12", "awards": 10}, {"period": "2026-01", "awards": 1}]}};

// ── DEPT COLORS ───────────────────────────────────────────────────────────────
const DC: Record<string,string> = {
  "Marketing":"#FD79A8","Data Science":"#4ECDC4","Finance":"#F9CA24",
  "Customer Service":"#FF6B6B","Product":"#00CEC9","Design":"#45B7D1",
  "Sales":"#FDCB6E","Legal":"#A29BFE","HR":"#DDA15E","IT":"#6C5CE7",
  "Engineering":"#96CEB4","Operations":"#74B9FF"
};

const SEN_ORDER = ["IC","Senior IC","Manager","Senior Manager","Director","VP"];

// ── TINY SPARKLINE ────────────────────────────────────────────────────────────
function Spark({ data, color = "#F96400", h = 28, w = 80 }: { data: {period:string;awards:number}[]; color?: string; h?: number; w?: number }) {
  if (!data || data.length < 2) return <span style={{color:"#ccc",fontSize:10}}>—</span>;
  const vals = data.map(d => d.awards);
  const mx = Math.max(...vals, 1), mn = Math.min(...vals);
  const rng = mx - mn || 1;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * (w - 4) + 2;
    const y = h - 2 - ((v - mn) / rng) * (h - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const last = (pts.split(" ").at(-1) ?? "").split(",");
  return (
    <svg width={w} height={h} style={{overflow:"visible"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx={last[0]} cy={last[1]} r="3" fill={color}/>
    </svg>
  );
}

// ── RISK BADGE ────────────────────────────────────────────────────────────────
function RiskBadge({ score }: { score: number }) {
  const level = score >= 75 ? { label:"HIGH", bg:"#FDEDEC", c:"#E74C3C" }
              : score >= 40 ? { label:"MED",  bg:"#FEF9E7", c:"#F39C12" }
              :               { label:"LOW",  bg:"#EAFAF1", c:"#27AE60" };
  return (
    <span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:20,
      background:level.bg,color:level.c,letterSpacing:".08em",fontFamily:"monospace"}}>
      {level.label}
    </span>
  );
}

// ── AVATAR ────────────────────────────────────────────────────────────────────
function Avatar({ name, dept, size = 32 }: { name: string; dept: string; size?: number }) {
  const initials = name.split(" ").map(p=>p[0]).slice(0,2).join("");
  const color = DC[dept] || "#888";
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:color+"22",
      border:`2px solid ${color}`,display:"grid",placeItems:"center",
      fontWeight:700,fontSize:size*0.32,color,flexShrink:0,fontFamily:"monospace"}}>
      {initials}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 1: INVISIBLE CONTRIBUTOR RADAR
// "The people who give the most recognition but receive none"
// ═══════════════════════════════════════════════════════════════════════════════
function InvisibleRadar() {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<string|null>(null);
  
  const depts = ["All", ...new Set(DATA.invisibleContributors.map(x => x.dept))];
  const filtered = filter === "All" 
    ? DATA.invisibleContributors 
    : DATA.invisibleContributors.filter(x => x.dept === filter);
  
  const sel = selected ? DATA.invisibleContributors.find(x => x.id === selected) : null;

  return (
    <div>
      {/* Header callout */}
      <div style={{background:"linear-gradient(135deg,#FDEDEC,#FFF4EE)",border:"1px solid #FDDCC9",
        borderRadius:12,padding:"16px 20px",marginBottom:20,display:"flex",gap:12,alignItems:"flex-start"}}>
        <span style={{fontSize:22}}>⚠️</span>
        <div>
          <div style={{fontWeight:700,fontSize:14,color:"#B03A2E",marginBottom:4}}>
            {DATA.invisibleContributors.length} Invisible Contributors Detected
          </div>
          <p style={{fontSize:12,color:"#922B21",lineHeight:1.6}}>
            These employees actively nominate colleagues but have <strong>never been recognized themselves</strong>.
            Research shows unrecognized high-givers are <strong>3.2× more likely to disengage</strong> within 6 months.
            HR should proactively ensure these people feel seen.
          </p>
        </div>
      </div>

      {/* Dept filter */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
        {depts.map(d => (
          <button key={d} onClick={() => setFilter(d)}
            style={{padding:"5px 13px",borderRadius:20,fontSize:11,fontWeight:600,border:"1px solid",
              borderColor: filter===d ? (DC[d]||"#0B3954") : "#E9ECEF",
              background: filter===d ? (DC[d]||"#0B3954")+"18" : "white",
              color: filter===d ? (DC[d]||"#0B3954") : "#6C757D", cursor:"pointer"}}>
            {d}
          </button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:selected?"1fr 360px":"1fr",gap:16}}>
        {/* Table */}
        <div style={{background:"white",border:"1px solid #E9ECEF",borderRadius:12,overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:"#FAFBFC",borderBottom:"2px solid #E9ECEF"}}>
                {["Person","Dept","Title","Seniority","Nominations Given","Risk","Action"].map(h=>(
                  <th key={h} style={{padding:"10px 14px",textAlign:"left",fontFamily:"monospace",
                    fontSize:9,letterSpacing:".12em",textTransform:"uppercase",color:"#6C757D",fontWeight:400}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} onClick={() => setSelected(selected===p.id?null:p.id)}
                  style={{borderBottom:"1px solid #E9ECEF",cursor:"pointer",
                    background: selected===p.id ? "#FFF4EE" : i%2===0?"white":"#FAFBFC",
                    transition:"background .1s"}}>
                  <td style={{padding:"12px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <Avatar name={p.name} dept={p.dept} size={28}/>
                      <span style={{fontWeight:600,color:"#0B3954"}}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{padding:"12px 14px"}}>
                    <span style={{fontSize:11,padding:"2px 8px",borderRadius:12,
                      background:(DC[p.dept]||"#888")+"18",color:DC[p.dept]||"#888",fontWeight:600}}>
                      {p.dept}
                    </span>
                  </td>
                  <td style={{padding:"12px 14px",color:"#6C757D",fontSize:11}}>{p.title}</td>
                  <td style={{padding:"12px 14px",color:"#6C757D",fontSize:11}}>{p.seniority}</td>
                  <td style={{padding:"12px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontFamily:"monospace",fontWeight:800,fontSize:18,color:"#F96400"}}>{p.given}</span>
                      <div style={{width:50,height:4,background:"#E9ECEF",borderRadius:2}}>
                        <div style={{height:"100%",width:`${(p.given/7)*100}%`,
                          background:"linear-gradient(90deg,#F96400,#FFAB73)",borderRadius:2}}/>
                      </div>
                    </div>
                  </td>
                  <td style={{padding:"12px 14px"}}><RiskBadge score={p.riskScore}/></td>
                  <td style={{padding:"12px 14px"}}>
                    <button style={{fontSize:10,padding:"4px 10px",borderRadius:6,
                      background:"#F96400",color:"white",border:"none",cursor:"pointer",fontWeight:600}}>
                      Nominate →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {sel && (
          <div style={{background:"white",border:"1px solid #E9ECEF",borderRadius:12,padding:20,
            animation:"fadeUp .25s ease"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <Avatar name={sel.name} dept={sel.dept} size={44}/>
              <div>
                <div style={{fontWeight:700,fontSize:15,color:"#0B3954"}}>{sel.name}</div>
                <div style={{fontSize:11,color:"#6C757D"}}>{sel.title} · {sel.dept}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
              {[
                {l:"Nominations Given",v:sel.given,c:"#F96400"},
                {l:"Recognition Received",v:sel.received,c:"#E74C3C"},
                {l:"Seniority",v:sel.seniority,c:"#3B5BDB"},
                {l:"Disengagement Risk",v:sel.riskScore+"%",c:"#E74C3C"},
              ].map(s=>(
                <div key={s.l} style={{padding:"10px 12px",background:"#F8F9FA",borderRadius:8}}>
                  <div style={{fontFamily:"monospace",fontSize:8,color:"#6C757D",textTransform:"uppercase",
                    letterSpacing:".1em",marginBottom:4}}>{s.l}</div>
                  <div style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{background:"#E8F8F5",borderRadius:8,padding:"12px 14px",marginBottom:12}}>
              <div style={{fontFamily:"monospace",fontSize:9,color:"#00A98F",textTransform:"uppercase",
                letterSpacing:".1em",marginBottom:6}}>💡 RECOMMENDED ACTION</div>
              <p style={{fontSize:12,color:"#0B3954",lineHeight:1.6}}>
                {sel.seniority==="VP"||sel.seniority==="Director"
                  ? `Senior leaders often feel recognition "should go down not up." Prompt their manager or CEO to specifically call out ${sel.name.split(" ")[0]}'s generosity in the next all-hands.`
                  : `Reach out to ${sel.name.split(" ")[0]}'s manager today. Share that they've given ${sel.given} nominations and ask the manager to submit recognition within the week.`}
              </p>
            </div>
            <button onClick={() => setSelected(null)}
              style={{width:"100%",padding:"8px",borderRadius:8,background:"#F8F9FA",
                border:"1px solid #E9ECEF",cursor:"pointer",fontSize:12,color:"#6C757D"}}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 2: MOMENTUM TRACKER (Rising Stars + Declining)
// "Who is accelerating — and who is fading"
// ═══════════════════════════════════════════════════════════════════════════════
function MomentumTracker() {
  const [view, setView] = useState("rising");
  const [hovered, setHovered] = useState<string|null>(null);

  const people = view === "rising" ? DATA.risingStars : DATA.decliningRecognition;
  const maxSlope = Math.max(...DATA.risingStars.map(x => x.slope), 0.01);
  const minSlope = Math.min(...DATA.decliningRecognition.map(x => x.slope), -0.01);

  return (
    <div>
      {/* Explainer */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
        <div style={{padding:"14px 16px",borderRadius:10,background:"#EAFAF1",border:"1px solid #A9DFBF"}}>
          <div style={{fontWeight:700,fontSize:13,color:"#1E8449",marginBottom:4}}>
            🚀 {DATA.risingStars.length} Rising Stars
          </div>
          <p style={{fontSize:11,color:"#239B56",lineHeight:1.5}}>
            Recognition accelerating over time — high potential for promotion pipeline or leadership roles.
          </p>
        </div>
        <div style={{padding:"14px 16px",borderRadius:10,background:"#FDEDEC",border:"1px solid #F5B7B1"}}>
          <div style={{fontWeight:700,fontSize:13,color:"#B03A2E",marginBottom:4}}>
            ⚠️ {DATA.decliningRecognition.length} Declining Trend
          </div>
          <p style={{fontSize:11,color:"#922B21",lineHeight:1.5}}>
            Recognition momentum declining — possible disengagement signal. Schedule 1:1 check-ins.
          </p>
        </div>
      </div>

      {/* Toggle */}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[{id:"rising",label:"🚀 Rising Stars",color:"#27AE60"},
          {id:"declining",label:"⚠️ Declining",color:"#E74C3C"}].map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            style={{padding:"7px 18px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",
              border:`2px solid ${view===v.id?v.color:"#E9ECEF"}`,
              background: view===v.id ? v.color+"18" : "white",
              color: view===v.id ? v.color : "#6C757D"}}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Grid of person cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {people.slice(0,12).map(p => {
          const isRising = view === "rising";
          const absSlope = Math.abs(p.slope);
          const intensity = isRising 
            ? absSlope / maxSlope 
            : absSlope / Math.abs(minSlope);
          const color = isRising ? "#27AE60" : "#E74C3C";
          const bg = isRising ? "#EAFAF1" : "#FDEDEC";
          const sparkColor = isRising ? "#27AE60" : "#E74C3C";

          return (
            <div key={p.id}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              style={{padding:"14px 16px",borderRadius:10,border:`1px solid ${color}33`,
                background: hovered===p.id ? bg : "white",
                transition:"all .2s",cursor:"default",
                boxShadow: hovered===p.id ? `0 4px 12px ${color}22` : "0 1px 3px rgba(0,0,0,.05)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <Avatar name={p.name} dept={p.dept} size={30}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:12,color:"#0B3954",
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                  <div style={{fontSize:10,color:"#6C757D"}}>{p.dept}</div>
                </div>
              </div>

              {/* Sparkline */}
              <div style={{marginBottom:10}}>
                <Spark data={p.monthlyData} color={sparkColor} h={32} w={120}/>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4}}>
                <div style={{textAlign:"center",padding:"6px 4px",background:"#F8F9FA",borderRadius:6}}>
                  <div style={{fontFamily:"monospace",fontSize:8,color:"#6C757D",textTransform:"uppercase"}}>Total</div>
                  <div style={{fontWeight:700,fontSize:14,color:"#0B3954"}}>{p.total}</div>
                </div>
                <div style={{textAlign:"center",padding:"6px 4px",background:bg,borderRadius:6}}>
                  <div style={{fontFamily:"monospace",fontSize:8,color:"#6C757D",textTransform:"uppercase"}}>Slope</div>
                  <div style={{fontWeight:700,fontSize:14,color}}>{isRising?"+":""}{p.slope.toFixed(2)}</div>
                </div>
                <div style={{textAlign:"center",padding:"6px 4px",background:"#F8F9FA",borderRadius:6}}>
                  <div style={{fontFamily:"monospace",fontSize:8,color:"#6C757D",textTransform:"uppercase"}}>Recent</div>
                  <div style={{fontWeight:700,fontSize:14,color:"#0B3954"}}>{p.recent}</div>
                </div>
              </div>

              {/* Momentum bar */}
              <div style={{marginTop:10,height:3,background:"#E9ECEF",borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${intensity*100}%`,
                  background:`linear-gradient(90deg,${color}66,${color})`,borderRadius:2}}/>
              </div>
              <div style={{fontFamily:"monospace",fontSize:8,color:"#ADB5BD",marginTop:3}}>
                {p.seniority} · {p.months} months tracked
              </div>
            </div>
          );
        })}
      </div>

      {/* Action footer */}
      <div style={{marginTop:16,padding:"14px 18px",background:"#EDF2FF",borderRadius:10,
        border:"1px solid #BFD0FF",display:"flex",gap:10,alignItems:"flex-start"}}>
        <span style={{fontSize:18}}>📋</span>
        <p style={{fontSize:12,color:"#2C3E8C",lineHeight:1.6}}>
          <strong>HR Action:</strong> Export rising stars to your promotion review pipeline.
          For declining employees, set up automated manager nudges 30 days before their last recognition date.
          Consider a <em>&quot;Recognition Streak&quot;</em> feature in your platform to gamify consistency.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 3: CROSS-DEPT INFLUENCE MAP
// "Which teams champion other teams? Where are the silos?"
// ═══════════════════════════════════════════════════════════════════════════════
function CrossDeptMap() {
  const [highlight, setHighlight] = useState<string|null>(null);
  const [view, setView] = useState("matrix"); // matrix | givers | receivers
  const depts = DATA.depts;

  // Build matrix lookup
  const matrix: Record<string, Record<string,number>> = {};
  DATA.crossDeptFlow.forEach(f => {
    if (!matrix[f.from]) matrix[f.from] = {};
    matrix[f.from][f.to] = f.value;
  });

  const getVal = (from: string, to: string): number | null => (from === to ? null : (matrix[from]?.[to] || 0));

  // Max for color scale
  const maxFlow = Math.max(...DATA.crossDeptFlow.map(f => f.value));

  const heatColor = (v: number | null): string => {
    if (v == null || v === 0) return "transparent";
    const t = (v as number) / maxFlow;
    const r = Math.round(249 * t + 240 * (1-t));
    const g = Math.round(100 * t + 240 * (1-t));
    const b = Math.round(0 * t + 240 * (1-t));
    return `rgb(${r},${g},${b})`;
  };

  // Givers: depts that push recognition outward most
  const giverTotals = depts.map(d => ({
    dept: d,
    total: depts.reduce((s, r) => d !== r ? s + (getVal(d,r)||0) : s, 0)
  })).sort((a,b) => b.total - a.total);

  // Receivers: depts that pull recognition from most other depts
  const receiverTotals = depts.map(d => ({
    dept: d,
    total: depts.reduce((s, g) => d !== g ? s + (getVal(g,d)||0) : s, 0),
    uniqueSources: depts.filter(g => d !== g && (getVal(g,d)||0) > 0).length
  })).sort((a,b) => b.total - a.total);

  const maxGiver = giverTotals[0]?.total || 1;
  const maxReceiver = receiverTotals[0]?.total || 1;

  return (
    <div>
      <div style={{background:"linear-gradient(135deg,#E8F8F5,#EDF2FF)",border:"1px solid #B2EBE3",
        borderRadius:12,padding:"14px 18px",marginBottom:20,display:"flex",gap:10}}>
        <span style={{fontSize:20}}>🗺️</span>
        <p style={{fontSize:12,color:"#0B3954",lineHeight:1.6}}>
          <strong>Cross-departmental recognition reveals your org&apos;s informal influence network.</strong>
          High outflow depts are <em>culture amplifiers</em> — they see value across the org. 
          Low inflow depts may be <em>isolated silos</em> needing cross-functional project opportunities.
        </p>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[{id:"matrix",label:"Heat Map"},
          {id:"givers",label:"🏆 Top Givers"},
          {id:"receivers",label:"⭐ Top Receivers"}].map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            style={{padding:"6px 16px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",
              border:`1px solid ${view===v.id?"#00A98F":"#E9ECEF"}`,
              background: view===v.id ? "#E8F8F5" : "white",
              color: view===v.id ? "#00A98F" : "#6C757D"}}>
            {v.label}
          </button>
        ))}
      </div>

      {view === "matrix" && (
        <div style={{overflowX:"auto"}}>
          <table style={{borderCollapse:"collapse",fontSize:11,minWidth:600}}>
            <thead>
              <tr>
                <th style={{padding:"6px 8px",fontFamily:"monospace",fontSize:8,color:"#6C757D",
                  textTransform:"uppercase",borderBottom:"2px solid #E9ECEF",minWidth:90,textAlign:"left"}}>
                  FROM ↓ TO →
                </th>
                {depts.map(d => (
                  <th key={d} style={{padding:"4px 6px",fontFamily:"monospace",fontSize:8,
                    color: highlight===d ? (DC[d]||"#888") : "#6C757D",
                    textAlign:"center",borderBottom:"2px solid #E9ECEF",
                    cursor:"pointer",transition:"color .2s",
                    fontWeight: highlight===d ? 700 : 400,
                    minWidth:56}}
                    onClick={() => setHighlight(highlight===d?null:d)}>
                    {d.length > 8 ? d.slice(0,7)+"." : d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {depts.map(from => (
                <tr key={from}>
                  <td style={{padding:"4px 8px",fontFamily:"monospace",fontSize:9,
                    color: highlight===from ? (DC[from]||"#888") : "#6C757D",
                    fontWeight: highlight===from ? 700 : 400,
                    borderBottom:"1px solid #F0F0F0",cursor:"pointer",whiteSpace:"nowrap"}}
                    onClick={() => setHighlight(highlight===from?null:from)}>
                    {from}
                  </td>
                  {depts.map(to => {
                    const v = getVal(from, to);
                    const isSelf = from === to;
                    const isHL = highlight && (highlight===from||highlight===to);
                    const dimmed = highlight && !isHL;
                    return (
                      <td key={to} style={{padding:"3px 4px",textAlign:"center",
                        borderBottom:"1px solid #F0F0F0",
                        background: isSelf ? "#F8F9FA" : heatColor(v),
                        opacity: dimmed ? 0.25 : 1,
                        transition:"opacity .2s"}}>
                        {isSelf
                          ? <span style={{color:"#E9ECEF",fontSize:10}}>—</span>
                          : (v ?? 0) > 0
                            ? <span style={{fontFamily:"monospace",fontSize:10,fontWeight:700,
                                color: (v ?? 0) >= maxFlow*0.7 ? "white" : (v ?? 0) >= maxFlow*0.4 ? "#B03A2E" : "#6C757D"}}>
                                {v}
                              </span>
                            : <span style={{color:"#E9ECEF",fontSize:9}}>·</span>
                        }
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{marginTop:8,display:"flex",gap:16,alignItems:"center",fontSize:10,color:"#6C757D"}}>
            <span>Click a dept name to highlight its row/column</span>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              {[0,.25,.5,.75,1].map(t => (
                <div key={t} style={{width:16,height:10,borderRadius:2,
                  background:heatColor(t*maxFlow)}}/>
              ))}
              <span>Low → High</span>
            </div>
          </div>
        </div>
      )}

      {view === "givers" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {giverTotals.map((g, i) => (
            <div key={g.dept} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",
              borderRadius:8,background:i===0?"#E8F8F5":"#FAFBFC",
              border:`1px solid ${i===0?"#B2EBE3":"#E9ECEF"}`}}>
              <div style={{width:28,height:28,borderRadius:6,background:DC[g.dept]||"#888",
                display:"grid",placeItems:"center",color:"white",fontWeight:800,fontSize:11,flexShrink:0}}>
                {i+1}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:13,color:"#0B3954"}}>{g.dept}</div>
                <div style={{fontSize:10,color:"#6C757D",marginTop:2}}>
                  Champions {g.total} employees in other departments
                </div>
              </div>
              <div style={{width:120,height:6,background:"#E9ECEF",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(g.total/maxGiver)*100}%`,
                  background:DC[g.dept]||"#888",borderRadius:3}}/>
              </div>
              <div style={{fontFamily:"monospace",fontWeight:800,fontSize:16,
                color:i===0?"#00A98F":"#0B3954",minWidth:24,textAlign:"right"}}>{g.total}</div>
            </div>
          ))}
        </div>
      )}

      {view === "receivers" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {receiverTotals.map((r, i) => (
            <div key={r.dept} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",
              borderRadius:8,background:i===0?"#FFF4EE":"#FAFBFC",
              border:`1px solid ${i===0?"#FDDCC9":"#E9ECEF"}`}}>
              <div style={{width:28,height:28,borderRadius:6,background:DC[r.dept]||"#888",
                display:"grid",placeItems:"center",color:"white",fontWeight:800,fontSize:11,flexShrink:0}}>
                {i+1}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:13,color:"#0B3954"}}>{r.dept}</div>
                <div style={{fontSize:10,color:"#6C757D",marginTop:2}}>
                  Recognized by {r.uniqueSources} other depts · {r.total} cross-dept awards
                </div>
              </div>
              <div style={{width:120,height:6,background:"#E9ECEF",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(r.total/maxReceiver)*100}%`,
                  background:DC[r.dept]||"#888",borderRadius:3}}/>
              </div>
              <div style={{fontFamily:"monospace",fontWeight:800,fontSize:16,
                color:i===0?"#F96400":"#0B3954",minWidth:24,textAlign:"right"}}>{r.total}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 4: EQUITY LENS
// "Is recognition equitably distributed across seniority levels?"
// ═══════════════════════════════════════════════════════════════════════════════
function EquityLens() {
  const [metric, setMetric] = useState("count");
  const eq = DATA.equityData;
  
  const ORDER = ["IC","Senior IC","Manager","Senior Manager","Director","VP"];
  const sorted = [...eq].sort((a,b) => ORDER.indexOf(a.recipient_seniority) - ORDER.indexOf(b.recipient_seniority));
  
  const maxCount = Math.max(...sorted.map(x => x.count));
  const maxValue = Math.max(...sorted.map(x => x.avg_value));
  const maxHighPct = Math.max(...sorted.map(x => x.high_value_pct));
  
  const barVal = (row: {recipient_seniority:string;count:number;avg_value:number;high_value_pct:number;total_value:number;high_value:number}) => {
    if (metric==="count") return {v:row.count, max:maxCount, label:`${row.count} awards`, fmt:row.count};
    if (metric==="avg_value") return {v:row.avg_value, max:maxValue, label:`$${row.avg_value}`, fmt:`$${row.avg_value}`};
    return {v:row.high_value_pct, max:maxHighPct, label:`${row.high_value_pct}%`, fmt:`${row.high_value_pct}%`};
  };

  // Compute inequality score (coefficient of variation)
  const vals = sorted.map(x => barVal(x).v);
  const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
  const std = Math.sqrt(vals.reduce((s,v)=>s+(v-mean)**2,0)/vals.length);
  const cv = (std/mean*100).toFixed(1);
  const isEquitable = parseFloat(cv) < 10;

  const SENIORITY_COLORS: Record<string,string> = {
    "IC":"#45B7D1","Senior IC":"#4ECDC4","Manager":"#F9CA24",
    "Senior Manager":"#F96400","Director":"#FF6B6B","VP":"#6C5CE7"
  };

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
        <div style={{padding:"14px 16px",borderRadius:10,
          background:isEquitable?"#EAFAF1":"#FEF9E7",
          border:`1px solid ${isEquitable?"#A9DFBF":"#FAD7A0"}`}}>
          <div style={{fontFamily:"monospace",fontSize:9,color:isEquitable?"#1E8449":"#9A7D0A",
            textTransform:"uppercase",letterSpacing:".1em",marginBottom:6}}>Equity Score</div>
          <div style={{fontWeight:800,fontSize:28,color:isEquitable?"#27AE60":"#F39C12",
            fontFamily:"monospace"}}>{isEquitable?"✓":"~"}</div>
          <div style={{fontSize:11,color:isEquitable?"#1E8449":"#9A7D0A",marginTop:4}}>
            CV = {cv}% · {isEquitable?"Well distributed":"Moderate variance"}
          </div>
        </div>
        <div style={{padding:"14px 16px",borderRadius:10,background:"#EDF2FF",border:"1px solid #BFD0FF"}}>
          <div style={{fontFamily:"monospace",fontSize:9,color:"#3B5BDB",textTransform:"uppercase",
            letterSpacing:".1em",marginBottom:6}}>Most Recognized</div>
          <div style={{fontWeight:700,fontSize:15,color:"#0B3954",marginBottom:2}}>
            {sorted.sort((a,b)=>b.count-a.count)[0]?.recipient_seniority}
          </div>
          <div style={{fontSize:11,color:"#3B5BDB"}}>
            {sorted.sort((a,b)=>b.count-a.count)[0]?.count} total awards
          </div>
        </div>
        <div style={{padding:"14px 16px",borderRadius:10,background:"#FFF4EE",border:"1px solid #FDDCC9"}}>
          <div style={{fontFamily:"monospace",fontSize:9,color:"#F96400",textTransform:"uppercase",
            letterSpacing:".1em",marginBottom:6}}>Highest Avg Value</div>
          <div style={{fontWeight:700,fontSize:15,color:"#0B3954",marginBottom:2}}>
            {[...eq].sort((a,b)=>b.avg_value-a.avg_value)[0]?.recipient_seniority}
          </div>
          <div style={{fontSize:11,color:"#F96400"}}>
            ${[...eq].sort((a,b)=>b.avg_value-a.avg_value)[0]?.avg_value} avg
          </div>
        </div>
      </div>

      {/* Metric toggle */}
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {[{id:"count",label:"Award Count"},
          {id:"avg_value",label:"Avg Value"},
          {id:"high_value_pct",label:"High-Value Rate"}].map(m => (
          <button key={m.id} onClick={() => setMetric(m.id)}
            style={{padding:"5px 14px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",
              border:"1px solid",borderColor:metric===m.id?"#0B3954":"#E9ECEF",
              background:metric===m.id?"#0B3954":"white",
              color:metric===m.id?"white":"#6C757D"}}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Bar chart by seniority */}
      <div style={{background:"white",border:"1px solid #E9ECEF",borderRadius:12,padding:"20px 24px",
        marginBottom:16}}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {sorted.sort((a,b)=>ORDER.indexOf(a.recipient_seniority)-ORDER.indexOf(b.recipient_seniority)).map(row => {
            const {v, max, fmt} = barVal(row);
            const pct = (v/max)*100;
            const color = SENIORITY_COLORS[row.recipient_seniority] || "#888";
            return (
              <div key={row.recipient_seniority}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:color}}/>
                    <span style={{fontSize:13,fontWeight:600,color:"#0B3954"}}>
                      {row.recipient_seniority}
                    </span>
                  </div>
                  <span style={{fontFamily:"monospace",fontSize:12,fontWeight:700,color}}>{fmt}</span>
                </div>
                <div style={{height:8,background:"#F0F0F0",borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:4,
                    transition:"width .8s cubic-bezier(.22,.68,0,1.2)"}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Equity insight */}
      <div style={{background:"#EDF2FF",borderRadius:10,padding:"14px 18px",display:"flex",gap:10}}>
        <span style={{fontSize:18}}>⚖️</span>
        <div>
          <div style={{fontFamily:"monospace",fontSize:9,color:"#3B5BDB",textTransform:"uppercase",
            letterSpacing:".1em",marginBottom:4}}>EQUITY INSIGHT</div>
          <p style={{fontSize:12,color:"#0B3954",lineHeight:1.6}}>
            Recognition distribution across seniority levels shows CV of<strong>{cv}%</strong>.
            {parseFloat(cv) < 10 
              ? " This indicates healthy equity — recognition is not skewed toward senior employees."
              : " Consider reviewing if Junior ICs are being overlooked. High-value ($500+) awards skewing toward Senior Manager+ may signal a cultural bias worth addressing."}
            {" "}Benchmark target: all levels within <strong>±15%</strong> of each other.
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SHELL
// ═══════════════════════════════════════════════════════════════════════════════
const FEATURES = [
  {
    id: "invisible",
    icon: "👁️",
    label: "Invisible Contributors",
    subtitle: "Givers who go unrecognized",
    color: "#E74C3C",
    bg: "#FDEDEC",
    component: InvisibleRadar,
    badge: DATA.invisibleContributors.length + " at risk"
  },
  {
    id: "momentum",
    icon: "📈",
    label: "Momentum Tracker",
    subtitle: "Rising stars & declining trends",
    color: "#27AE60",
    bg: "#EAFAF1",
    component: MomentumTracker,
    badge: DATA.risingStars.length + " rising"
  },
  {
    id: "crossdept",
    icon: "🗺️",
    label: "Influence Map",
    subtitle: "Cross-dept recognition flows",
    color: "#00A98F",
    bg: "#E8F8F5",
    component: CrossDeptMap,
    badge: DATA.crossDeptFlow.length + " flows"
  },
  {
    id: "equity",
    icon: "⚖️",
    label: "Equity Lens",
    subtitle: "Recognition fairness by seniority",
    color: "#3B5BDB",
    bg: "#EDF2FF",
    component: EquityLens,
    badge: "6 levels"
  },
];

export default function HRIntelligence() {
  const [active, setActive] = useState("invisible");
  const feat = FEATURES.find(f => f.id === active);

  return (
    <div style={{fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",background:"#F8F9FA",
      minHeight:"100vh",padding:"0 0 40px"}}>
      
      {/* Top bar */}
      <div style={{background:"white",borderBottom:"1px solid #E9ECEF",padding:"16px 28px",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        position:"sticky",top:0,zIndex:10,backdropFilter:"blur(8px)"}}>
        <div>
          <div style={{fontWeight:800,fontSize:17,color:"#0B3954",letterSpacing:"-.02em"}}>
            🧠 HR Intelligence Suite
          </div>
          <div style={{fontFamily:"monospace",fontSize:9,color:"#ADB5BD",letterSpacing:".12em",
            textTransform:"uppercase",marginTop:2}}>
            4 diagnostic features · awards_enriched.csv · 1,000 awards
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {FEATURES.map(f => (
            <button key={f.id} onClick={() => setActive(f.id)}
              style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,
                border:`2px solid ${active===f.id?f.color:"#E9ECEF"}`,cursor:"pointer",
                background:active===f.id?f.bg:"white",transition:"all .2s"}}>
              <span style={{fontSize:14}}>{f.icon}</span>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:11,fontWeight:700,
                  color:active===f.id?f.color:"#0B3954",lineHeight:1.2}}>{f.label}</div>
                <div style={{fontFamily:"monospace",fontSize:8,
                  color:active===f.id?f.color+"99":"#ADB5BD"}}>{f.badge}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Feature header */}
      <div style={{padding:"20px 28px 0"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
          <div style={{width:36,height:36,borderRadius:10,background:feat?.bg,
            display:"grid",placeItems:"center",fontSize:18,border:`1px solid ${feat?.color}33`}}>
            {feat?.icon}
          </div>
          <div>
            <div style={{fontWeight:800,fontSize:18,color:"#0B3954",letterSpacing:"-.02em"}}>
              {feat?.label}
            </div>
            <div style={{fontSize:12,color:"#6C757D"}}>{feat?.subtitle}</div>
          </div>
        </div>
        
        {/* Feature content */}
        {active === "invisible" && <InvisibleRadar />}
        {active === "momentum"  && <MomentumTracker />}
        {active === "crossdept" && <CrossDeptMap />}
        {active === "equity"    && <EquityLens />}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        * { box-sizing: border-box; }
        button:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #DEE2E6; border-radius: 4px; }
      `}</style>
    </div>
  );
}