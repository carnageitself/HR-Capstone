"use client";

import { useState, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// EMBEDDED DATA — computed from employees.json + awards_enriched.csv
// ─────────────────────────────────────────────────────────────────────────────
const ACTIONS = [{"id":"inv_1036","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize Joseph Hernandez — has given 3 awards, received none","detail":"Manager in Customer Service · 1.6yr tenure · 3 nominations given","owner":"Department Manager","dept":"Customer Service","metric":"3 given, 0 received","action":"Nominate Joseph Hernandez this week. Alert their manager immediately.","name":"Joseph Hernandez"},{"id":"inv_1227","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize Sarah Lee — has given 5 awards, received none","detail":"VP in Customer Service · 4.7yr tenure · 5 nominations given","owner":"Department Manager","dept":"Customer Service","metric":"5 given, 0 received","action":"Nominate Sarah Lee this week. Alert their manager immediately.","name":"Sarah Lee"},{"id":"inv_1274","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize Christopher Thomas — has given 5 awards, received none","detail":"Manager in Customer Service · 8.5yr tenure · 5 nominations given","owner":"Department Manager","dept":"Customer Service","metric":"5 given, 0 received","action":"Nominate Christopher Thomas this week. Alert their manager immediately.","name":"Christopher Thomas"},{"id":"ltr_1064","type":"long_tenured_unrecognized","urgency":"critical","category":"Retention Risk","title":"Recognize Matthew Davis — 8.3yr employee never recognized","detail":"Manager in Customer Service · joined 2017-09","owner":"HR Business Partner","dept":"Customer Service","metric":"8.3yr · 0 awards","action":"HRBP to contact Matthew Davis's manager within 5 days. Schedule recognition.","name":"Matthew Davis"},{"id":"ltr_1274","type":"long_tenured_unrecognized","urgency":"critical","category":"Retention Risk","title":"Recognize Christopher Thomas — 8.5yr employee never recognized","detail":"Manager in Customer Service · joined 2017-06","owner":"HR Business Partner","dept":"Customer Service","metric":"8.5yr · 0 awards","action":"HRBP to contact Christopher Thomas's manager within 5 days. Schedule recognition.","name":"Christopher Thomas"},{"id":"inv_1386","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize William Thompson — has given 3 awards, received none","detail":"Manager in Data Science · 2.1yr tenure · 3 nominations given","owner":"Department Manager","dept":"Data Science","metric":"3 given, 0 received","action":"Nominate William Thompson this week. Alert their manager immediately.","name":"William Thompson"},{"id":"inv_1497","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize Susan Hernandez — has given 4 awards, received none","detail":"Director in Data Science · 3.6yr tenure · 4 nominations given","owner":"Department Manager","dept":"Data Science","metric":"4 given, 0 received","action":"Nominate Susan Hernandez this week. Alert their manager immediately.","name":"Susan Hernandez"},{"id":"inv_1039","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize Patricia Martinez — has given 5 awards, received none","detail":"Director in Design · 4.3yr tenure · 5 nominations given","owner":"Department Manager","dept":"Design","metric":"5 given, 0 received","action":"Nominate Patricia Martinez this week. Alert their manager immediately.","name":"Patricia Martinez"},{"id":"inv_1429","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize Jessica Garcia — has given 3 awards, received none","detail":"Senior IC in Design · 5.5yr tenure · 3 nominations given","owner":"Department Manager","dept":"Design","metric":"3 given, 0 received","action":"Nominate Jessica Garcia this week. Alert their manager immediately.","name":"Jessica Garcia"},{"id":"inv_1318","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize Elizabeth Williams — has given 3 awards, received none","detail":"Manager in Engineering · 8.8yr tenure · 3 nominations given","owner":"Department Manager","dept":"Engineering","metric":"3 given, 0 received","action":"Nominate Elizabeth Williams this week. Alert their manager immediately.","name":"Elizabeth Williams"},{"id":"inv_1488","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize Linda Hernandez — has given 3 awards, received none","detail":"VP in Engineering · 1.6yr tenure · 3 nominations given","owner":"Department Manager","dept":"Engineering","metric":"3 given, 0 received","action":"Nominate Linda Hernandez this week. Alert their manager immediately.","name":"Linda Hernandez"},{"id":"ltr_1112","type":"long_tenured_unrecognized","urgency":"critical","category":"Retention Risk","title":"Recognize Robert Thomas — 9.6yr employee never recognized","detail":"Senior Manager in Engineering · joined 2016-05","owner":"HR Business Partner","dept":"Engineering","metric":"9.6yr · 0 awards","action":"HRBP to contact Robert Thomas's manager within 5 days. Schedule recognition.","name":"Robert Thomas"},{"id":"ltr_1318","type":"long_tenured_unrecognized","urgency":"critical","category":"Retention Risk","title":"Recognize Elizabeth Williams — 8.8yr employee never recognized","detail":"Manager in Engineering · joined 2017-03","owner":"HR Business Partner","dept":"Engineering","metric":"8.8yr · 0 awards","action":"HRBP to contact Elizabeth Williams's manager within 5 days. Schedule recognition.","name":"Elizabeth Williams"},{"id":"ltr_1399","type":"long_tenured_unrecognized","urgency":"critical","category":"Retention Risk","title":"Recognize Mary Lee — 8.3yr employee never recognized","detail":"Director in Engineering · joined 2017-09","owner":"HR Business Partner","dept":"Engineering","metric":"8.3yr · 0 awards","action":"HRBP to contact Mary Lee's manager within 5 days. Schedule recognition.","name":"Mary Lee"},{"id":"inv_1163","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize David Lee — has given 4 awards, received none","detail":"IC in Finance · 1.7yr tenure · 4 nominations given","owner":"Department Manager","dept":"Finance","metric":"4 given, 0 received","action":"Nominate David Lee this week. Alert their manager immediately.","name":"David Lee"},{"id":"inv_1250","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize Nancy Jones — has given 3 awards, received none","detail":"VP in Finance · 5.6yr tenure · 3 nominations given","owner":"Department Manager","dept":"Finance","metric":"3 given, 0 received","action":"Nominate Nancy Jones this week. Alert their manager immediately.","name":"Nancy Jones"},{"id":"inv_1302","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize Matthew Hernandez — has given 4 awards, received none","detail":"Manager in Finance · 5.9yr tenure · 4 nominations given","owner":"Department Manager","dept":"Finance","metric":"4 given, 0 received","action":"Nominate Matthew Hernandez this week. Alert their manager immediately.","name":"Matthew Hernandez"},{"id":"ltr_1116","type":"long_tenured_unrecognized","urgency":"critical","category":"Retention Risk","title":"Recognize Thomas Gonzalez — 9.1yr employee never recognized","detail":"Senior Manager in Finance · joined 2016-12","owner":"HR Business Partner","dept":"Finance","metric":"9.1yr · 0 awards","action":"HRBP to contact Thomas Gonzalez's manager within 5 days. Schedule recognition.","name":"Thomas Gonzalez"},{"id":"inv_1296","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize Thomas Martinez — has given 4 awards, received none","detail":"Manager in HR · 4.5yr tenure · 4 nominations given","owner":"Department Manager","dept":"HR","metric":"4 given, 0 received","action":"Nominate Thomas Martinez this week. Alert their manager immediately.","name":"Thomas Martinez"},{"id":"ltr_1099","type":"long_tenured_unrecognized","urgency":"critical","category":"Retention Risk","title":"Recognize Daniel Brown — 8.1yr employee never recognized","detail":"VP in HR · joined 2017-11","owner":"HR Business Partner","dept":"HR","metric":"8.1yr · 0 awards","action":"HRBP to contact Daniel Brown's manager within 5 days. Schedule recognition.","name":"Daniel Brown"},{"id":"ltr_1208","type":"long_tenured_unrecognized","urgency":"critical","category":"Retention Risk","title":"Recognize Charles Anderson — 8.5yr employee never recognized","detail":"IC in HR · joined 2017-07","owner":"HR Business Partner","dept":"HR","metric":"8.5yr · 0 awards","action":"HRBP to contact Charles Anderson's manager within 5 days. Schedule recognition.","name":"Charles Anderson"},{"id":"ltr_1345","type":"long_tenured_unrecognized","urgency":"critical","category":"Retention Risk","title":"Recognize Jennifer Thomas — 7.1yr employee never recognized","detail":"Director in HR · joined 2018-12","owner":"HR Business Partner","dept":"HR","metric":"7.1yr · 0 awards","action":"HRBP to contact Jennifer Thomas's manager within 5 days. Schedule recognition.","name":"Jennifer Thomas"},{"id":"ltr_1415","type":"long_tenured_unrecognized","urgency":"critical","category":"Retention Risk","title":"Recognize Jessica Anderson — 7.8yr employee never recognized","detail":"Manager in HR · joined 2018-03","owner":"HR Business Partner","dept":"HR","metric":"7.8yr · 0 awards","action":"HRBP to contact Jessica Anderson's manager within 5 days. Schedule recognition.","name":"Jessica Anderson"},{"id":"inv_1158","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize Mary Miller — has given 3 awards, received none","detail":"IC in IT · 4.4yr tenure · 3 nominations given","owner":"Department Manager","dept":"IT","metric":"3 given, 0 received","action":"Nominate Mary Miller this week. Alert their manager immediately.","name":"Mary Miller"},{"id":"inv_1378","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize Matthew Martin — has given 5 awards, received none","detail":"IC in IT · 5.7yr tenure · 5 nominations given","owner":"Department Manager","dept":"IT","metric":"5 given, 0 received","action":"Nominate Matthew Martin this week. Alert their manager immediately.","name":"Matthew Martin"},{"id":"ltr_1011","type":"long_tenured_unrecognized","urgency":"critical","category":"Retention Risk","title":"Recognize James Rodriguez — 9.4yr employee never recognized","detail":"Director in IT · joined 2016-08","owner":"HR Business Partner","dept":"IT","metric":"9.4yr · 0 awards","action":"HRBP to contact James Rodriguez's manager within 5 days. Schedule recognition.","name":"James Rodriguez"},{"id":"ltr_1422","type":"long_tenured_unrecognized","urgency":"critical","category":"Retention Risk","title":"Recognize Elizabeth Davis — 8.4yr employee never recognized","detail":"IC in IT · joined 2017-08","owner":"HR Business Partner","dept":"IT","metric":"8.4yr · 0 awards","action":"HRBP to contact Elizabeth Davis's manager within 5 days. Schedule recognition.","name":"Elizabeth Davis"},{"id":"inv_1034","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize Jennifer Wilson — has given 3 awards, received none","detail":"IC in Legal · 2.9yr tenure · 3 nominations given","owner":"Department Manager","dept":"Legal","metric":"3 given, 0 received","action":"Nominate Jennifer Wilson this week. Alert their manager immediately.","name":"Jennifer Wilson"},{"id":"inv_1249","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize Thomas Martinez — has given 3 awards, received none","detail":"VP in Legal · 1.6yr tenure · 3 nominations given","owner":"Department Manager","dept":"Legal","metric":"3 given, 0 received","action":"Nominate Thomas Martinez this week. Alert their manager immediately.","name":"Thomas Martinez"},{"id":"inv_1299","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize Linda Wilson — has given 3 awards, received none","detail":"Senior Manager in Legal · 1.5yr tenure · 3 nominations given","owner":"Department Manager","dept":"Legal","metric":"3 given, 0 received","action":"Nominate Linda Wilson this week. Alert their manager immediately.","name":"Linda Wilson"},{"id":"inv_1341","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize Richard Rodriguez — has given 4 awards, received none","detail":"VP in Legal · 5.5yr tenure · 4 nominations given","owner":"Department Manager","dept":"Legal","metric":"4 given, 0 received","action":"Nominate Richard Rodriguez this week. Alert their manager immediately.","name":"Richard Rodriguez"},{"id":"ltr_1289","type":"long_tenured_unrecognized","urgency":"critical","category":"Retention Risk","title":"Recognize Susan Brown — 7.7yr employee never recognized","detail":"Senior Manager in Legal · joined 2018-04","owner":"HR Business Partner","dept":"Legal","metric":"7.7yr · 0 awards","action":"HRBP to contact Susan Brown's manager within 5 days. Schedule recognition.","name":"Susan Brown"},{"id":"ltr_1416","type":"long_tenured_unrecognized","urgency":"critical","category":"Retention Risk","title":"Recognize Linda Davis — 9.2yr employee never recognized","detail":"VP in Legal · joined 2016-11","owner":"HR Business Partner","dept":"Legal","metric":"9.2yr · 0 awards","action":"HRBP to contact Linda Davis's manager within 5 days. Schedule recognition.","name":"Linda Davis"},{"id":"ltr_1417","type":"long_tenured_unrecognized","urgency":"critical","category":"Retention Risk","title":"Recognize Elizabeth Martinez — 7.1yr employee never recognized","detail":"Senior Manager in Legal · joined 2018-12","owner":"HR Business Partner","dept":"Legal","metric":"7.1yr · 0 awards","action":"HRBP to contact Elizabeth Martinez's manager within 5 days. Schedule recognition.","name":"Elizabeth Martinez"},{"id":"inv_1101","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize David Garcia — has given 5 awards, received none","detail":"Manager in Marketing · 6.3yr tenure · 5 nominations given","owner":"Department Manager","dept":"Marketing","metric":"5 given, 0 received","action":"Nominate David Garcia this week. Alert their manager immediately.","name":"David Garcia"},{"id":"inv_1188","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize Jessica Smith — has given 3 awards, received none","detail":"Manager in Operations · 4.6yr tenure · 3 nominations given","owner":"Department Manager","dept":"Operations","metric":"3 given, 0 received","action":"Nominate Jessica Smith this week. Alert their manager immediately.","name":"Jessica Smith"},{"id":"inv_1407","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize Joseph Anderson — has given 3 awards, received none","detail":"VP in Operations · 5.4yr tenure · 3 nominations given","owner":"Department Manager","dept":"Operations","metric":"3 given, 0 received","action":"Nominate Joseph Anderson this week. Alert their manager immediately.","name":"Joseph Anderson"},{"id":"ltr_1159","type":"long_tenured_unrecognized","urgency":"critical","category":"Retention Risk","title":"Recognize Barbara Lopez — 8.2yr employee never recognized","detail":"IC in Operations · joined 2017-10","owner":"HR Business Partner","dept":"Operations","metric":"8.2yr · 0 awards","action":"HRBP to contact Barbara Lopez's manager within 5 days. Schedule recognition.","name":"Barbara Lopez"},{"id":"ltr_1271","type":"long_tenured_unrecognized","urgency":"critical","category":"Retention Risk","title":"Recognize Jessica Jones — 8.0yr employee never recognized","detail":"Director in Operations · joined 2018-01","owner":"HR Business Partner","dept":"Operations","metric":"8.0yr · 0 awards","action":"HRBP to contact Jessica Jones's manager within 5 days. Schedule recognition.","name":"Jessica Jones"},{"id":"inv_1089","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize Thomas Brown — has given 7 awards, received none","detail":"Director in Product · 6.0yr tenure · 7 nominations given","owner":"Department Manager","dept":"Product","metric":"7 given, 0 received","action":"Nominate Thomas Brown this week. Alert their manager immediately.","name":"Thomas Brown"},{"id":"ltr_1469","type":"long_tenured_unrecognized","urgency":"critical","category":"Retention Risk","title":"Recognize Christopher Martin — 7.9yr employee never recognized","detail":"Senior Manager in Product · joined 2018-01","owner":"HR Business Partner","dept":"Product","metric":"7.9yr · 0 awards","action":"HRBP to contact Christopher Martin's manager within 5 days. Schedule recognition.","name":"Christopher Martin"},{"id":"inv_1135","type":"invisible_contributor","urgency":"critical","category":"Retention Risk","title":"Recognize Daniel Williams — has given 3 awards, received none","detail":"Director in Sales · 7.5yr tenure · 3 nominations given","owner":"Department Manager","dept":"Sales","metric":"3 given, 0 received","action":"Nominate Daniel Williams this week. Alert their manager immediately.","name":"Daniel Williams"},{"id":"ltr_1115","type":"long_tenured_unrecognized","urgency":"critical","category":"Retention Risk","title":"Recognize Barbara Anderson — 7.7yr employee never recognized","detail":"Director in Sales · joined 2018-05","owner":"HR Business Partner","dept":"Sales","metric":"7.7yr · 0 awards","action":"HRBP to contact Barbara Anderson's manager within 5 days. Schedule recognition.","name":"Barbara Anderson"},{"id":"ltr_1135","type":"long_tenured_unrecognized","urgency":"critical","category":"Retention Risk","title":"Recognize Daniel Williams — 7.5yr employee never recognized","detail":"Director in Sales · joined 2018-06","owner":"HR Business Partner","dept":"Sales","metric":"7.5yr · 0 awards","action":"HRBP to contact Daniel Williams's manager within 5 days. Schedule recognition.","name":"Daniel Williams"},{"id":"mgr_1008","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Lisa Moore has never nominated a peer or team member","detail":"Director in Customer Service · 3.8yr tenure","owner":"HR Business Partner","dept":"Customer Service","metric":"0 nominations given","action":"Schedule recognition coaching session with Lisa Moore. Target: 2 nominations in 30 days.","name":"Lisa Moore"},{"id":"mgr_1017","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"David Perez has never nominated a peer or team member","detail":"Senior Manager in Customer Service · 3.3yr tenure","owner":"HR Business Partner","dept":"Customer Service","metric":"0 nominations given","action":"Schedule recognition coaching session with David Perez. Target: 2 nominations in 30 days.","name":"David Perez"},{"id":"mgr_1078","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"David Garcia has never nominated a peer or team member","detail":"Director in Customer Service · 5.8yr tenure","owner":"HR Business Partner","dept":"Customer Service","metric":"0 nominations given","action":"Schedule recognition coaching session with David Garcia. Target: 2 nominations in 30 days.","name":"David Garcia"},{"id":"mgr_1094","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Joseph Martin has never nominated a peer or team member","detail":"VP in Customer Service · 3.6yr tenure","owner":"HR Business Partner","dept":"Customer Service","metric":"0 nominations given","action":"Schedule recognition coaching session with Joseph Martin. Target: 2 nominations in 30 days.","name":"Joseph Martin"},{"id":"mgr_1143","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Patricia Taylor has never nominated a peer or team member","detail":"Director in Customer Service · 9.2yr tenure","owner":"HR Business Partner","dept":"Customer Service","metric":"0 nominations given","action":"Schedule recognition coaching session with Patricia Taylor. Target: 2 nominations in 30 days.","name":"Patricia Taylor"},{"id":"mgr_1423","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Richard Brown has never nominated a peer or team member","detail":"VP in Customer Service · 6.7yr tenure","owner":"HR Business Partner","dept":"Customer Service","metric":"0 nominations given","action":"Schedule recognition coaching session with Richard Brown. Target: 2 nominations in 30 days.","name":"Richard Brown"},{"id":"mgr_1476","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Jennifer Brown has never nominated a peer or team member","detail":"Manager in Customer Service · 3.9yr tenure","owner":"HR Business Partner","dept":"Customer Service","metric":"0 nominations given","action":"Schedule recognition coaching session with Jennifer Brown. Target: 2 nominations in 30 days.","name":"Jennifer Brown"},{"id":"mgr_1033","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Elizabeth Johnson has never nominated a peer or team member","detail":"Manager in Data Science · 3.2yr tenure","owner":"HR Business Partner","dept":"Data Science","metric":"0 nominations given","action":"Schedule recognition coaching session with Elizabeth Johnson. Target: 2 nominations in 30 days.","name":"Elizabeth Johnson"},{"id":"mgr_1152","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Linda Wilson has never nominated a peer or team member","detail":"VP in Data Science · 9.8yr tenure","owner":"HR Business Partner","dept":"Data Science","metric":"0 nominations given","action":"Schedule recognition coaching session with Linda Wilson. Target: 2 nominations in 30 days.","name":"Linda Wilson"},{"id":"mgr_1157","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Daniel Garcia has never nominated a peer or team member","detail":"VP in Data Science · 6.1yr tenure","owner":"HR Business Partner","dept":"Data Science","metric":"0 nominations given","action":"Schedule recognition coaching session with Daniel Garcia. Target: 2 nominations in 30 days.","name":"Daniel Garcia"},{"id":"mgr_1224","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Sarah Lee has never nominated a peer or team member","detail":"Manager in Data Science · 4.3yr tenure","owner":"HR Business Partner","dept":"Data Science","metric":"0 nominations given","action":"Schedule recognition coaching session with Sarah Lee. Target: 2 nominations in 30 days.","name":"Sarah Lee"},{"id":"mgr_1325","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"James Hernandez has never nominated a peer or team member","detail":"Manager in Data Science · 2.0yr tenure","owner":"HR Business Partner","dept":"Data Science","metric":"0 nominations given","action":"Schedule recognition coaching session with James Hernandez. Target: 2 nominations in 30 days.","name":"James Hernandez"},{"id":"mgr_1007","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"William Jackson has never nominated a peer or team member","detail":"VP in Design · 4.4yr tenure","owner":"HR Business Partner","dept":"Design","metric":"0 nominations given","action":"Schedule recognition coaching session with William Jackson. Target: 2 nominations in 30 days.","name":"William Jackson"},{"id":"mgr_1028","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Barbara Garcia has never nominated a peer or team member","detail":"Senior Manager in Design · 7.0yr tenure","owner":"HR Business Partner","dept":"Design","metric":"0 nominations given","action":"Schedule recognition coaching session with Barbara Garcia. Target: 2 nominations in 30 days.","name":"Barbara Garcia"},{"id":"mgr_1136","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"William Hernandez has never nominated a peer or team member","detail":"Director in Design · 6.2yr tenure","owner":"HR Business Partner","dept":"Design","metric":"0 nominations given","action":"Schedule recognition coaching session with William Hernandez. Target: 2 nominations in 30 days.","name":"William Hernandez"},{"id":"mgr_1137","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Robert Taylor has never nominated a peer or team member","detail":"VP in Design · 2.8yr tenure","owner":"HR Business Partner","dept":"Design","metric":"0 nominations given","action":"Schedule recognition coaching session with Robert Taylor. Target: 2 nominations in 30 days.","name":"Robert Taylor"},{"id":"mgr_1192","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Sarah Lopez has never nominated a peer or team member","detail":"VP in Design · 9.5yr tenure","owner":"HR Business Partner","dept":"Design","metric":"0 nominations given","action":"Schedule recognition coaching session with Sarah Lopez. Target: 2 nominations in 30 days.","name":"Sarah Lopez"},{"id":"mgr_1421","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Christopher Jackson has never nominated a peer or team member","detail":"VP in Design · 2.5yr tenure","owner":"HR Business Partner","dept":"Design","metric":"0 nominations given","action":"Schedule recognition coaching session with Christopher Jackson. Target: 2 nominations in 30 days.","name":"Christopher Jackson"},{"id":"mgr_1061","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Thomas Jackson has never nominated a peer or team member","detail":"Director in Finance · 8.4yr tenure","owner":"HR Business Partner","dept":"Finance","metric":"0 nominations given","action":"Schedule recognition coaching session with Thomas Jackson. Target: 2 nominations in 30 days.","name":"Thomas Jackson"},{"id":"mgr_1129","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Richard Garcia has never nominated a peer or team member","detail":"Director in Finance · 6.0yr tenure","owner":"HR Business Partner","dept":"Finance","metric":"0 nominations given","action":"Schedule recognition coaching session with Richard Garcia. Target: 2 nominations in 30 days.","name":"Richard Garcia"},{"id":"mgr_1147","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Daniel Thomas has never nominated a peer or team member","detail":"Director in Finance · 7.1yr tenure","owner":"HR Business Partner","dept":"Finance","metric":"0 nominations given","action":"Schedule recognition coaching session with Daniel Thomas. Target: 2 nominations in 30 days.","name":"Daniel Thomas"},{"id":"mgr_1245","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Lisa Lee has never nominated a peer or team member","detail":"Senior Manager in Finance · 7.5yr tenure","owner":"HR Business Partner","dept":"Finance","metric":"0 nominations given","action":"Schedule recognition coaching session with Lisa Lee. Target: 2 nominations in 30 days.","name":"Lisa Lee"},{"id":"mgr_1467","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Robert Lee has never nominated a peer or team member","detail":"Senior Manager in Finance · 4.3yr tenure","owner":"HR Business Partner","dept":"Finance","metric":"0 nominations given","action":"Schedule recognition coaching session with Robert Lee. Target: 2 nominations in 30 days.","name":"Robert Lee"},{"id":"cov_Finance","type":"low_coverage_dept","urgency":"warning","category":"Coverage Gap","title":"Finance has only 82% recognition coverage — below threshold","detail":"37 of 45 employees recognized · 8 unreached","owner":"Department Head","dept":"Finance","metric":"82% coverage","action":"Department head to identify and recognize 8 unreached employees within 30 days.","name":null},{"id":"mgr_1006","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Joseph Rodriguez has never nominated a peer or team member","detail":"VP in HR · 8.6yr tenure","owner":"HR Business Partner","dept":"HR","metric":"0 nominations given","action":"Schedule recognition coaching session with Joseph Rodriguez. Target: 2 nominations in 30 days.","name":"Joseph Rodriguez"},{"id":"mgr_1235","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Matthew Jackson has never nominated a peer or team member","detail":"Senior Manager in HR · 3.9yr tenure","owner":"HR Business Partner","dept":"HR","metric":"0 nominations given","action":"Schedule recognition coaching session with Matthew Jackson. Target: 2 nominations in 30 days.","name":"Matthew Jackson"},{"id":"mgr_1415","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Jessica Anderson has never nominated a peer or team member","detail":"Manager in HR · 7.8yr tenure","owner":"HR Business Partner","dept":"HR","metric":"0 nominations given","action":"Schedule recognition coaching session with Jessica Anderson. Target: 2 nominations in 30 days.","name":"Jessica Anderson"},{"id":"cov_HR","type":"low_coverage_dept","urgency":"warning","category":"Coverage Gap","title":"HR has only 80% recognition coverage — below threshold","detail":"33 of 41 employees recognized · 8 unreached","owner":"Department Head","dept":"HR","metric":"80% coverage","action":"Department head to identify and recognize 8 unreached employees within 30 days.","name":null},{"id":"mgr_1011","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"James Rodriguez has never nominated a peer or team member","detail":"Director in IT · 9.4yr tenure","owner":"HR Business Partner","dept":"IT","metric":"0 nominations given","action":"Schedule recognition coaching session with James Rodriguez. Target: 2 nominations in 30 days.","name":"James Rodriguez"},{"id":"mgr_1035","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Joseph Johnson has never nominated a peer or team member","detail":"Senior Manager in IT · 3.4yr tenure","owner":"HR Business Partner","dept":"IT","metric":"0 nominations given","action":"Schedule recognition coaching session with Joseph Johnson. Target: 2 nominations in 30 days.","name":"Joseph Johnson"},{"id":"mgr_1207","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Charles Anderson has never nominated a peer or team member","detail":"Director in IT · 8.8yr tenure","owner":"HR Business Partner","dept":"IT","metric":"0 nominations given","action":"Schedule recognition coaching session with Charles Anderson. Target: 2 nominations in 30 days.","name":"Charles Anderson"},{"id":"mgr_1328","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Mary Gonzalez has never nominated a peer or team member","detail":"Director in IT · 7.0yr tenure","owner":"HR Business Partner","dept":"IT","metric":"0 nominations given","action":"Schedule recognition coaching session with Mary Gonzalez. Target: 2 nominations in 30 days.","name":"Mary Gonzalez"},{"id":"mgr_1139","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Joseph Martinez has never nominated a peer or team member","detail":"Manager in Legal · 9.0yr tenure","owner":"HR Business Partner","dept":"Legal","metric":"0 nominations given","action":"Schedule recognition coaching session with Joseph Martinez. Target: 2 nominations in 30 days.","name":"Joseph Martinez"},{"id":"mgr_1169","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Daniel Garcia has never nominated a peer or team member","detail":"Manager in Legal · 6.6yr tenure","owner":"HR Business Partner","dept":"Legal","metric":"0 nominations given","action":"Schedule recognition coaching session with Daniel Garcia. Target: 2 nominations in 30 days.","name":"Daniel Garcia"},{"id":"mgr_1484","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Patricia Jones has never nominated a peer or team member","detail":"Senior Manager in Legal · 3.5yr tenure","owner":"HR Business Partner","dept":"Legal","metric":"0 nominations given","action":"Schedule recognition coaching session with Patricia Jones. Target: 2 nominations in 30 days.","name":"Patricia Jones"},{"id":"cov_Legal","type":"low_coverage_dept","urgency":"warning","category":"Coverage Gap","title":"Legal has only 78% recognition coverage — below threshold","detail":"38 of 49 employees recognized · 11 unreached","owner":"Department Head","dept":"Legal","metric":"78% coverage","action":"Department head to identify and recognize 11 unreached employees within 30 days.","name":null},{"id":"mgr_1359","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Susan Lee has never nominated a peer or team member","detail":"Senior Manager in Marketing · 5.4yr tenure","owner":"HR Business Partner","dept":"Marketing","metric":"0 nominations given","action":"Schedule recognition coaching session with Susan Lee. Target: 2 nominations in 30 days.","name":"Susan Lee"},{"id":"mgr_1477","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Susan Martinez has never nominated a peer or team member","detail":"Senior Manager in Marketing · 5.0yr tenure","owner":"HR Business Partner","dept":"Marketing","metric":"0 nominations given","action":"Schedule recognition coaching session with Susan Martinez. Target: 2 nominations in 30 days.","name":"Susan Martinez"},{"id":"mgr_1111","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Elizabeth Davis has never nominated a peer or team member","detail":"Director in Operations · 4.5yr tenure","owner":"HR Business Partner","dept":"Operations","metric":"0 nominations given","action":"Schedule recognition coaching session with Elizabeth Davis. Target: 2 nominations in 30 days.","name":"Elizabeth Davis"},{"id":"mgr_1271","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Jessica Jones has never nominated a peer or team member","detail":"Director in Operations · 8.0yr tenure","owner":"HR Business Partner","dept":"Operations","metric":"0 nominations given","action":"Schedule recognition coaching session with Jessica Jones. Target: 2 nominations in 30 days.","name":"Jessica Jones"},{"id":"mgr_1465","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"James Jones has never nominated a peer or team member","detail":"VP in Operations · 3.5yr tenure","owner":"HR Business Partner","dept":"Operations","metric":"0 nominations given","action":"Schedule recognition coaching session with James Jones. Target: 2 nominations in 30 days.","name":"James Jones"},{"id":"cov_Operations","type":"low_coverage_dept","urgency":"warning","category":"Coverage Gap","title":"Operations has only 80% recognition coverage — below threshold","detail":"28 of 35 employees recognized · 7 unreached","owner":"Department Head","dept":"Operations","metric":"80% coverage","action":"Department head to identify and recognize 7 unreached employees within 30 days.","name":null},{"id":"mgr_1200","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Barbara Anderson has never nominated a peer or team member","detail":"VP in Product · 7.0yr tenure","owner":"HR Business Partner","dept":"Product","metric":"0 nominations given","action":"Schedule recognition coaching session with Barbara Anderson. Target: 2 nominations in 30 days.","name":"Barbara Anderson"},{"id":"mgr_1202","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Karen Lee has never nominated a peer or team member","detail":"Senior Manager in Product · 5.7yr tenure","owner":"HR Business Partner","dept":"Product","metric":"0 nominations given","action":"Schedule recognition coaching session with Karen Lee. Target: 2 nominations in 30 days.","name":"Karen Lee"},{"id":"mgr_1314","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Linda Rodriguez has never nominated a peer or team member","detail":"Director in Product · 9.7yr tenure","owner":"HR Business Partner","dept":"Product","metric":"0 nominations given","action":"Schedule recognition coaching session with Linda Rodriguez. Target: 2 nominations in 30 days.","name":"Linda Rodriguez"},{"id":"mgr_1384","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Daniel Martinez has never nominated a peer or team member","detail":"Director in Product · 6.7yr tenure","owner":"HR Business Partner","dept":"Product","metric":"0 nominations given","action":"Schedule recognition coaching session with Daniel Martinez. Target: 2 nominations in 30 days.","name":"Daniel Martinez"},{"id":"mgr_1326","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Sarah Williams has never nominated a peer or team member","detail":"Manager in Sales · 7.5yr tenure","owner":"HR Business Partner","dept":"Sales","metric":"0 nominations given","action":"Schedule recognition coaching session with Sarah Williams. Target: 2 nominations in 30 days.","name":"Sarah Williams"},{"id":"mgr_1373","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"Jennifer Hernandez has never nominated a peer or team member","detail":"Manager in Sales · 5.8yr tenure","owner":"HR Business Partner","dept":"Sales","metric":"0 nominations given","action":"Schedule recognition coaching session with Jennifer Hernandez. Target: 2 nominations in 30 days.","name":"Jennifer Hernandez"},{"id":"mgr_1382","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"James Williams has never nominated a peer or team member","detail":"Director in Sales · 7.8yr tenure","owner":"HR Business Partner","dept":"Sales","metric":"0 nominations given","action":"Schedule recognition coaching session with James Williams. Target: 2 nominations in 30 days.","name":"James Williams"},{"id":"mgr_1464","type":"inactive_manager","urgency":"warning","category":"Manager Effectiveness","title":"David Martin has never nominated a peer or team member","detail":"VP in Sales · 5.3yr tenure","owner":"HR Business Partner","dept":"Sales","metric":"0 nominations given","action":"Schedule recognition coaching session with David Martin. Target: 2 nominations in 30 days.","name":"David Martin"},{"id":"stale_1218","type":"stale_high_performer","urgency":"info","category":"Engagement","title":"Sarah Thomas was a top recipient but has had no recognition for 7 months","detail":"IC in Customer Service · 3 lifetime awards · last: 2025-05-23","owner":"Line Manager","dept":"Customer Service","metric":"7mo gap","action":"Line manager to check in with Sarah Thomas and look for a recognition opportunity.","name":"Sarah Thomas"},{"id":"stale_1423","type":"stale_high_performer","urgency":"info","category":"Engagement","title":"Richard Brown was a top recipient but has had no recognition for 10 months","detail":"VP in Customer Service · 3 lifetime awards · last: 2025-02-17","owner":"Line Manager","dept":"Customer Service","metric":"10mo gap","action":"Line manager to check in with Richard Brown and look for a recognition opportunity.","name":"Richard Brown"},{"id":"stale_1243","type":"stale_high_performer","urgency":"info","category":"Engagement","title":"Sarah Davis was a top recipient but has had no recognition for 10 months","detail":"Director in Data Science · 4 lifetime awards · last: 2025-02-18","owner":"Line Manager","dept":"Data Science","metric":"10mo gap","action":"Line manager to check in with Sarah Davis and look for a recognition opportunity.","name":"Sarah Davis"},{"id":"stale_1192","type":"stale_high_performer","urgency":"info","category":"Engagement","title":"Sarah Lopez was a top recipient but has had no recognition for 7 months","detail":"VP in Design · 3 lifetime awards · last: 2025-06-09","owner":"Line Manager","dept":"Design","metric":"7mo gap","action":"Line manager to check in with Sarah Lopez and look for a recognition opportunity.","name":"Sarah Lopez"},{"id":"stale_1434","type":"stale_high_performer","urgency":"info","category":"Engagement","title":"Robert Martinez was a top recipient but has had no recognition for 9 months","detail":"Director in Finance · 3 lifetime awards · last: 2025-03-25","owner":"Line Manager","dept":"Finance","metric":"9mo gap","action":"Line manager to check in with Robert Martinez and look for a recognition opportunity.","name":"Robert Martinez"},{"id":"stale_1298","type":"stale_high_performer","urgency":"info","category":"Engagement","title":"James Davis was a top recipient but has had no recognition for 7 months","detail":"Director in HR · 3 lifetime awards · last: 2025-06-17","owner":"Line Manager","dept":"HR","metric":"7mo gap","action":"Line manager to check in with James Davis and look for a recognition opportunity.","name":"James Davis"},{"id":"stale_1030","type":"stale_high_performer","urgency":"info","category":"Engagement","title":"Matthew Hernandez was a top recipient but has had no recognition for 7 months","detail":"Senior IC in IT · 3 lifetime awards · last: 2025-06-04","owner":"Line Manager","dept":"IT","metric":"7mo gap","action":"Line manager to check in with Matthew Hernandez and look for a recognition opportunity.","name":"Matthew Hernandez"},{"id":"stale_1002","type":"stale_high_performer","urgency":"info","category":"Engagement","title":"Susan Hernandez was a top recipient but has had no recognition for 9 months","detail":"Manager in Legal · 3 lifetime awards · last: 2025-04-05","owner":"Line Manager","dept":"Legal","metric":"9mo gap","action":"Line manager to check in with Susan Hernandez and look for a recognition opportunity.","name":"Susan Hernandez"},{"id":"stale_1205","type":"stale_high_performer","urgency":"info","category":"Engagement","title":"Charles Thompson was a top recipient but has had no recognition for 6 months","detail":"Manager in Legal · 3 lifetime awards · last: 2025-06-25","owner":"Line Manager","dept":"Legal","metric":"6mo gap","action":"Line manager to check in with Charles Thompson and look for a recognition opportunity.","name":"Charles Thompson"},{"id":"stale_1174","type":"stale_high_performer","urgency":"info","category":"Engagement","title":"David Jones was a top recipient but has had no recognition for 8 months","detail":"VP in Marketing · 4 lifetime awards · last: 2025-05-03","owner":"Line Manager","dept":"Marketing","metric":"8mo gap","action":"Line manager to check in with David Jones and look for a recognition opportunity.","name":"David Jones"},{"id":"stale_1322","type":"stale_high_performer","urgency":"info","category":"Engagement","title":"Nancy Lee was a top recipient but has had no recognition for 8 months","detail":"VP in Marketing · 3 lifetime awards · last: 2025-05-09","owner":"Line Manager","dept":"Marketing","metric":"8mo gap","action":"Line manager to check in with Nancy Lee and look for a recognition opportunity.","name":"Nancy Lee"},{"id":"stale_1145","type":"stale_high_performer","urgency":"info","category":"Engagement","title":"Thomas Davis was a top recipient but has had no recognition for 8 months","detail":"Director in Product · 3 lifetime awards · last: 2025-04-21","owner":"Line Manager","dept":"Product","metric":"8mo gap","action":"Line manager to check in with Thomas Davis and look for a recognition opportunity.","name":"Thomas Davis"},{"id":"stale_1091","type":"stale_high_performer","urgency":"info","category":"Engagement","title":"Karen Williams was a top recipient but has had no recognition for 7 months","detail":"Senior IC in Sales · 3 lifetime awards · last: 2025-05-21","owner":"Line Manager","dept":"Sales","metric":"7mo gap","action":"Line manager to check in with Karen Williams and look for a recognition opportunity.","name":"Karen Williams"},{"id":"stale_1454","type":"stale_high_performer","urgency":"info","category":"Engagement","title":"Christopher Brown was a top recipient but has had no recognition for 6 months","detail":"Manager in Sales · 3 lifetime awards · last: 2025-06-26","owner":"Line Manager","dept":"Sales","metric":"6mo gap","action":"Line manager to check in with Christopher Brown and look for a recognition opportunity.","name":"Christopher Brown"}];

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
type Urgency = "critical" | "warning" | "info";
type ActionType = "invisible_contributor" | "long_tenured_unrecognized" | "inactive_manager" | "low_coverage_dept" | "stale_high_performer";

const URGENCY_CONFIG: Record<Urgency, {
  dot: string; label: string; bar: string;
  rowBg: string; rowHover: string; chipBg: string; chipText: string;
}> = {
  critical: { dot:"#DC2626", label:"Urgent",  bar:"#DC2626", rowBg:"#fff",    rowHover:"#FFF8F8", chipBg:"#FEF2F2", chipText:"#B91C1C" },
  warning:  { dot:"#D97706", label:"Monitor", bar:"#D97706", rowBg:"#fff",    rowHover:"#FFFBF0", chipBg:"#FFFBEB", chipText:"#B45309" },
  info:     { dot:"#6B7280", label:"Watch",   bar:"#6B7280", rowBg:"#fff",    rowHover:"#F9FAFB", chipBg:"#F3F4F6", chipText:"#374151" },
};

const TYPE_CONFIG: Record<ActionType, { label: string; color: string; bg: string }> = {
  invisible_contributor:    { label:"Never Recognized",  color:"#F96400", bg:"#FFF4EE" },
  long_tenured_unrecognized:{ label:"Long Tenure Gap",   color:"#6C5CE7", bg:"#F0EEFF" },
  inactive_manager:         { label:"Inactive Manager",  color:"#00A98F", bg:"#E8F8F5" },
  low_coverage_dept:        { label:"Coverage Gap",      color:"#FDCB6E", bg:"#FFFDF0" },
  stale_high_performer:     { label:"Engagement Gap",    color:"#74B9FF", bg:"#EFF6FF" },
};

const DEPT_COLORS: Record<string, string> = {
  "Customer Service":"#FF6B6B","Data Science":"#4ECDC4","Design":"#45B7D1",
  "Engineering":"#96CEB4","Finance":"#F9CA24","HR":"#DDA15E",
  "IT":"#6C5CE7","Legal":"#A29BFE","Marketing":"#FD79A8",
  "Operations":"#74B9FF","Product":"#00CEC9","Sales":"#FDCB6E",
};

const SEN_COLORS: Record<string, string> = {
  "IC":"#ADB5BD","Senior IC":"#74B9FF","Manager":"#00A98F",
  "Senior Manager":"#FDCB6E","Director":"#F96400","VP":"#6C5CE7",
};

// Parses "Manager in Customer Service · 8.5yr tenure" → { seniority, dept, rest }
function parseDetail(detail: string) {
  const match = detail.match(/^(.+?)\s+in\s+([^·]+)·?(.*)$/);
  if (!match) return { seniority: null, dept: null, rest: detail };
  return {
    seniority: match[1].trim(),
    dept:      match[2].trim(),
    rest:      match[3].trim(),
  };
}

// Most senior active manager per department (derived from employees.json + awards_enriched.csv)
const DEPT_MANAGERS: Record<string, string> = {
  "Customer Service": "Robert Thompson",
  "Data Science":     "Richard Lopez",
  "Design":           "Michael Wilson",
  "Engineering":      "Matthew Moore",
  "Finance":          "Nancy Jones",
  "HR":               "Daniel Brown",
  "IT":               "Christopher Miller",
  "Legal":            "Michael Brown",
  "Marketing":        "David Jones",
  "Operations":       "Christopher Lee",
  "Product":          "Nancy Gonzalez",
  "Sales":            "Karen Perez",
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function ActionQueue({ dismissed, setDismissed }: {
  dismissed: Set<string>;
  setDismissed: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const [urgencyFilter, setUrgencyFilter] = useState<Urgency | "all">("all");
  const [typeFilter,    setTypeFilter]    = useState<ActionType | "all">("all");
  const [deptFilter,    setDeptFilter]    = useState<string>("all");
  const [search,        setSearch]        = useState("");
  const [expanded,      setExpanded]      = useState<Set<string>>(new Set());

  const allDepts = Array.from(new Set(ACTIONS.map(a => a.dept))).sort();

  const filtered = useMemo(() => {
    return ACTIONS.filter(a => {
      if (dismissed.has(a.id)) return false;
      if (urgencyFilter !== "all" && a.urgency !== urgencyFilter) return false;
      if (typeFilter    !== "all" && a.type    !== typeFilter)    return false;
      if (deptFilter    !== "all" && a.dept    !== deptFilter)    return false;
      if (search) {
        const q = search.toLowerCase();
        if (!a.title.toLowerCase().includes(q) &&
            !a.dept.toLowerCase().includes(q)  &&
            !(a.name?.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [urgencyFilter, typeFilter, deptFilter, search, dismissed]);

  const counts = {
    critical: ACTIONS.filter(a => a.urgency === "critical" && !dismissed.has(a.id)).length,
    warning:  ACTIONS.filter(a => a.urgency === "warning"  && !dismissed.has(a.id)).length,
    info:     ACTIONS.filter(a => a.urgency === "info"     && !dismissed.has(a.id)).length,
  };

  const toggleExpand = (id: string) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const dismiss = (id: string) =>
    setDismissed(prev => new Set([...prev, id]));

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily:"var(--sans,'Plus Jakarta Sans',sans-serif)" }}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div>
        {/* Title row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-mono text-[9px] tracking-[.18em] uppercase mb-1"
              style={{ color:"#9CA3AF" }}>HR Operations · FY 2025</div>
            <h2 className="text-[20px] font-bold tracking-tight m-0" style={{ color:"#0B3954" }}>
              Action Priority Queue
            </h2>
          </div>
          <span className="font-mono text-[10px]" style={{ color:"#9CA3AF" }}>Jan 2026</span>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          {(["critical","warning","info"] as Urgency[]).map(u => {
            const cfg   = URGENCY_CONFIG[u];
            const count = u === "critical" ? counts.critical : u === "warning" ? counts.warning : counts.info;
            const isActive = urgencyFilter === u;
            // Using the same palette as seniority: VP=#6C5CE7, Director=#F96400, Manager=#00A98F
            const cardStyles: Record<Urgency, { accent: string; bg: string; border: string }> = {
              critical: { accent:"#F96400", bg:"#FFF4EE", border:"#FDDCC9" },
              warning:  { accent:"#6C5CE7", bg:"#F0EEFF", border:"#D4CAFF" },
              info:     { accent:"#00A98F", bg:"#E8F8F5", border:"#B2EBE3" },
            };
            const cs = cardStyles[u];
            return (
              <button key={u} onClick={() => setUrgencyFilter(isActive ? "all" : u)}
                className="flex flex-col px-5 py-4 rounded-xl cursor-pointer text-left transition-all"
                style={{
                  background: cs.bg,
                  border: `1px solid ${isActive ? cs.accent : cs.border}`,
                  boxShadow: isActive ? `0 0 0 2px ${cs.accent}33` : "none",
                  outline: "none",
                }}>
                <div className="font-mono text-[9px] uppercase tracking-[.14em] mb-2"
                  style={{ color: cs.accent }}>
                  {cfg.label}
                </div>
                <div className="text-[30px] font-extrabold leading-none tracking-tight mb-1"
                  style={{ color:"#0B3954" }}>
                  {count}
                </div>
                <div className="text-[11px]" style={{ color: cs.accent, opacity: 0.85 }}>
                  {u === "critical" ? "require immediate action" : u === "warning" ? "need monitoring" : "low priority items"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── FILTERS ────────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] pointer-events-none"
            style={{ color:"#9CA3AF" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name or department…"
            className="w-full py-2 pl-8 pr-3 rounded-lg text-[12px] outline-none"
            style={{ border:"1px solid #E5E7EB", background:"#fff", color:"#111827" }} />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as ActionType | "all")}
          className="py-2 px-3 rounded-lg text-[12px] outline-none cursor-pointer"
          style={{ border:"1px solid #E5E7EB", background:"#fff", color:"#374151" }}>
          <option value="all">All types</option>
          {Object.entries(TYPE_CONFIG).map(([k,v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="py-2 px-3 rounded-lg text-[12px] outline-none cursor-pointer"
          style={{ border:"1px solid #E5E7EB", background:"#fff", color:"#374151" }}>
          <option value="all">All departments</option>
          {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <span className="font-mono text-[11px] ml-auto" style={{ color:"#9CA3AF" }}>
          {filtered.length} of {ACTIONS.length - dismissed.size} shown
        </span>
      </div>

      {/* ── ACTION LIST ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        {filtered.length === 0 ? (
          <div className="py-14 text-center rounded-xl"
            style={{ background:"#fff", border:"1px solid #E5E7EB" }}>
            <div className="text-[13px] font-medium" style={{ color:"#9CA3AF" }}>
              No actions match your filters
            </div>
          </div>
        ) : filtered.map((a, i) => {
          const cfg    = URGENCY_CONFIG[a.urgency as Urgency];
          const type   = TYPE_CONFIG[a.type as ActionType];
          const isOpen = expanded.has(a.id);

          return (
            <div key={a.id}
              className="rounded-xl overflow-hidden transition-all"
              style={{
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderLeft: `3px solid ${type.color}`,
              }}>

              {/* Row */}
              <div
                className="flex items-center gap-4 px-5 py-3.5 cursor-pointer"
                style={{ background: isOpen ? "#F9FAFB" : cfg.rowBg }}
                onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = cfg.rowHover; }}
                onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = cfg.rowBg; }}
                onClick={() => toggleExpand(a.id)}>

                {/* Index */}
                <span className="font-mono text-[10px] w-5 shrink-0 text-right"
                  style={{ color:"#D1D5DB" }}>{i + 1}</span>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-semibold" style={{ color:"#111827" }}>
                    {a.title}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {(() => {
                      const { seniority, dept, rest } = parseDetail(a.detail);
                      const senColor  = seniority ? (SEN_COLORS[seniority]  || "#9CA3AF") : "#9CA3AF";
                      const deptColor = dept      ? (DEPT_COLORS[dept]      || "#9CA3AF") : "#9CA3AF";
                      return (
                        <>
                          {seniority && (
                            <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded"
                              style={{ background:`${senColor}18`, color: senColor }}>
                              {seniority}
                            </span>
                          )}
                          {dept && (
                            <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded"
                              style={{ background:`${deptColor}18`, color: deptColor }}>
                              {dept}
                            </span>
                          )}
                          {rest && (
                            <span className="font-mono text-[10px]" style={{ color:"#9CA3AF" }}>
                              · {rest}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Type badge */}
                <span className="font-mono text-[9px] font-bold px-2 py-1 rounded shrink-0"
                  style={{ background: type.bg, color: type.color, border:`1px solid ${type.color}33`, letterSpacing:".06em" }}>
                  {type.label}
                </span>

                {/* Priority chip */}
                <span className="font-mono text-[9px] font-bold px-2.5 py-1 rounded-full shrink-0"
                  style={{ background: cfg.chipBg, color: cfg.chipText }}>
                  {cfg.label}
                </span>

                {/* Dismiss + chevron */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); dismiss(a.id); }}
                    className="w-6 h-6 rounded flex items-center justify-center text-[11px] cursor-pointer transition-colors"
                    title="Dismiss"
                    style={{ color:"#D1D5DB", background:"transparent", border:"none" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#9CA3AF")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#D1D5DB")}>
                    ✕
                  </button>
                  <span className="text-[10px]" style={{ color:"#9CA3AF" }}>
                    {isOpen ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* Expanded panel */}
              {isOpen && (
                <div className="px-5 py-4" style={{ borderTop:"1px solid #F3F4F6", background:"#FAFAFA" }}>
                  {/* Action text */}
                  <div className="flex gap-3 mb-4">
                    <span className="font-mono text-[9px] uppercase tracking-[.12em] shrink-0 pt-0.5"
                      style={{ color:"#9CA3AF" }}>Recommended</span>
                    <p className="text-[13px] font-medium leading-relaxed m-0" style={{ color:"#111827" }}>
                      {a.action}
                    </p>
                  </div>

                  {/* Footer row */}
                  <div className="flex items-center gap-3 flex-wrap pt-3"
                    style={{ borderTop:"1px solid #E5E7EB" }}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-[.1em]"
                        style={{ color:"#9CA3AF" }}>Assign to</span>
                      <span className="text-[12px] font-semibold" style={{ color:"#0B3954" }}>
                        {a.owner}
                      </span>
                      <span style={{ color:"#E5E7EB" }}>·</span>
                      <span className="text-[12px]" style={{ color:"#374151" }}>
                        {a.dept}
                      </span>
                      {DEPT_MANAGERS[a.dept] && (
                        <>
                          <span style={{ color:"#E5E7EB" }}>·</span>
                          <span className="text-[12px] font-medium" style={{ color:"#374151" }}>
                            {DEPT_MANAGERS[a.dept]}
                          </span>
                        </>
                      )}
                    </div>
                    <span className="font-mono text-[9px] px-2 py-0.5 rounded ml-1"
                      style={{ background:"#F3F4F6", color:"#6B7280" }}>
                      {a.category}
                    </span>
                    <button onClick={() => dismiss(a.id)}
                      className="ml-auto text-[12px] font-semibold px-4 py-1.5 rounded-lg cursor-pointer transition-colors"
                      style={{ background:"#0B3954", color:"#fff", border:"none" }}>
                      Mark as done
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {dismissed.size > 0 && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg"
          style={{ background:"#F9FAFB", border:"1px solid #E5E7EB" }}>
          <span className="font-mono text-[11px]" style={{ color:"#9CA3AF" }}>
            {dismissed.size} item{dismissed.size > 1 ? "s" : ""} dismissed this session
          </span>
          <button onClick={() => setDismissed(new Set())}
            className="font-mono text-[10px] font-medium px-3 py-1.5 rounded-lg cursor-pointer"
            style={{ background:"#fff", color:"#374151", border:"1px solid #E5E7EB" }}>
            Restore all
          </button>
        </div>
      )}
    </div>
  );
}