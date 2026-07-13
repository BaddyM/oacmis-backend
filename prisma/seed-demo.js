/* eslint-disable */
// prisma/seed-demo.js — rich demo data for every OACMIS feature (~20 rows/table).
//
// Highlights:
//  - Students across Nursery / Lower Primary / Upper Primary classes.
//  - Exam RESULTS for the CURRENT subjects already in the DB, unique per student:
//      * Upper Primary pupils do English, Mathematics, Social Studies, Science only.
//      * Everyone else does all subjects.
//      * Nursery pupils get COMMENTS (no score); primary pupils get SCORES.
//      * Results are filed per period (BOT/MOT/EOT) for Term 1.
//  - Idempotent: gated by an AppSetting marker + upserts on natural keys, so it is
//    safe to run once. Remove the `demo_seed_v1` app-setting to re-seed.
//
// Run:  node prisma/seed-demo.js
const { PrismaClient, UserRole } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const MARKER = 'demo_seed_v1';
const TERM = 'Term 1';
const YEAR = 2026;
const PERIODS = ['BOT', 'MOT', 'EOT'];

// The real curriculum already in the DB.
const ALL_SUBJECTS = ['English', 'Mathematics', 'Science', 'Social Studies', 'Literacy 1', 'Literacy 2'];
const UPPER_PRIMARY_SUBJECTS = ['English', 'Mathematics', 'Social Studies', 'Science'];

// ---- deterministic pseudo-random so re-runs are stable -------------------
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rand01 = (s) => { let t = hash(s) + 0x6D2B79F5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
const pick = (arr, s) => arr[Math.floor(rand01(s) * arr.length)];
const between = (s, lo, hi) => lo + Math.floor(rand01(s) * (hi - lo + 1));

const FIRST = ['Grace', 'Brian', 'Sarah', 'Kevin', 'Mercy', 'Daniel', 'Ruth', 'Samuel', 'Esther', 'Isaac', 'Joan', 'Peter', 'Faith', 'Moses', 'Lydia', 'Aaron', 'Rebecca', 'Timothy', 'Diana', 'Joshua', 'Naomi', 'Caleb', 'Hannah', 'Elijah', 'Miriam'];
const LAST = ['Okello', 'Nakato', 'Mugisha', 'Achieng', 'Wanyama', 'Namuli', 'Kato', 'Auma', 'Ssentongo', 'Nabirye', 'Byaruhanga', 'Akello', 'Tumusiime', 'Nalwoga', 'Opio', 'Kirabo', 'Wasswa', 'Nabukenya', 'Ochieng', 'Namara', 'Kizza', 'Atim', 'Bwalya', 'Lubega', 'Nansubuga'];

// class name -> level
const CLASS_DEFS = [
  { name: 'Baby', level: 'Nursery', room: 'N1', color: '#f472b6' },
  { name: 'Middle', level: 'Nursery', room: 'N2', color: '#fb7185' },
  { name: 'Top', level: 'Nursery', room: 'N3', color: '#f59e0b' },
  { name: 'P1', level: 'Lower Primary', room: 'A1', color: '#34d399' },
  { name: 'P2', level: 'Lower Primary', room: 'A2', color: '#10b981' },
  { name: 'P3', level: 'Lower Primary', room: 'A3', color: '#059669' },
  { name: 'P4', level: 'Upper Primary', room: 'B1', color: '#60a5fa' },
  { name: 'P5', level: 'Upper Primary', room: 'B2', color: '#3b82f6' },
  { name: 'P6', level: 'Upper Primary', room: 'B3', color: '#2563eb' },
  { name: 'P7', level: 'Upper Primary', room: 'B4', color: '#1d4ed8' },
];

// 20 demo pupils: [className, level, gender]
const ROSTER = [
  ['Baby', 'Nursery', 'Female'], ['Baby', 'Nursery', 'Male'],
  ['Middle', 'Nursery', 'Female'], ['Middle', 'Nursery', 'Male'],
  ['Top', 'Nursery', 'Female'], ['Top', 'Nursery', 'Male'],
  ['P1', 'Lower Primary', 'Female'], ['P1', 'Lower Primary', 'Male'], ['P1', 'Lower Primary', 'Female'],
  ['P2', 'Lower Primary', 'Male'], ['P2', 'Lower Primary', 'Female'],
  ['P3', 'Lower Primary', 'Male'], ['P3', 'Lower Primary', 'Female'],
  ['P4', 'Upper Primary', 'Male'], ['P4', 'Upper Primary', 'Female'],
  ['P5', 'Upper Primary', 'Male'], ['P5', 'Upper Primary', 'Female'],
  ['P6', 'Upper Primary', 'Male'], ['P6', 'Upper Primary', 'Female'],
  ['P7', 'Upper Primary', 'Male'],
];

const HOUSES = ['Red', 'Blue', 'Green', 'Yellow'];
const pad = (n) => String(n).padStart(3, '0');

async function main() {
  if (await prisma.appSetting.findUnique({ where: { key: MARKER } })) {
    console.log(`Demo data already seeded (${MARKER} present). Delete that app-setting to re-seed.`);
    return;
  }

  const counts = {};
  const bump = (k, n = 1) => { counts[k] = (counts[k] || 0) + n; };

  // ---- Subjects: make sure the curriculum exists (keep existing) ----------
  for (const name of ALL_SUBJECTS) {
    await prisma.subject.upsert({ where: { name }, update: {}, create: { name, code: name.slice(0, 3).toUpperCase() } });
  }

  // ---- Classes ------------------------------------------------------------
  for (const c of CLASS_DEFS) {
    const existing = await prisma.class.findFirst({ where: { name: c.name } });
    if (existing) {
      await prisma.class.update({ where: { id: existing.id }, data: { room: c.room, color: c.color } });
    } else {
      await prisma.class.create({ data: { name: c.name, room: c.room, color: c.color, schedule: 'Mon–Fri 8:00–4:00' } });
      bump('classes');
    }
  }

  // ---- Students -----------------------------------------------------------
  const demoStudents = [];
  for (let i = 0; i < ROSTER.length; i++) {
    const [className, level, gender] = ROSTER[i];
    const firstName = FIRST[i % FIRST.length];
    const lastName = LAST[(i * 3 + 5) % LAST.length];
    const admissionNo = `OAC-D${pad(i + 1)}`;
    const s = await prisma.student.upsert({
      where: { admissionNo },
      update: { className, level, gender },
      create: {
        admissionNo, firstName, lastName, className, level, gender,
        stream: pick(['A', 'B'], admissionNo),
        schoolPayNumber: `SP${between(admissionNo, 100000, 999999)}`,
        house: pick(HOUSES, admissionNo),
        dateOfBirth: `20${between(admissionNo, 14, 20)}-0${between(admissionNo + 'm', 1, 9)}-1${between(admissionNo + 'd', 0, 9)}`,
        email: `${firstName}.${lastName}${i + 1}`.toLowerCase() + '@pupils.oacmis.local',
        phone: `+2567${between(admissionNo, 10000000, 99999999)}`,
        location: pick(['Kampala', 'Wakiso', 'Mukono', 'Jinja'], admissionNo),
        parentName: `${pick(FIRST, admissionNo + 'p')} ${lastName}`,
        parentPhone: `+2567${between(admissionNo + 'pp', 10000000, 99999999)}`,
        parentEmail: `parent.${lastName}${i + 1}`.toLowerCase() + '@oacmis.local',
        parentRelation: pick(['Father', 'Mother', 'Guardian'], admissionNo),
        parentAddress: 'P.O. Box ' + between(admissionNo, 100, 9999) + ', Kampala',
      },
    });
    demoStudents.push(s);
    bump('students');
  }

  // Every pupil in the DB (incl. any pre-existing ones) gets results.
  const allStudents = await prisma.student.findMany();

  // ---- Staff --------------------------------------------------------------
  const STAFF_ROLES = ['Teacher', 'Teacher', 'Teacher', 'Teacher', 'Teacher', 'Accountant', 'Librarian', 'Nurse', 'Driver', 'Warden'];
  const demoStaff = [];
  for (let i = 0; i < 20; i++) {
    const firstName = FIRST[(i * 2 + 1) % FIRST.length];
    const lastName = LAST[(i * 2 + 7) % LAST.length];
    const role = STAFF_ROLES[i % STAFF_ROLES.length];
    const email = `${firstName}.${lastName}.staff${i + 1}`.toLowerCase() + '@oacmis.local';
    const st = await prisma.staff.upsert({
      where: { email },
      update: {},
      create: {
        firstName, lastName, role, email, isActive: true,
        phone: `+2567${between(email, 10000000, 99999999)}`,
        address: 'Plot ' + between(email, 1, 200) + ', Kampala',
        salary: String(between(email, 600, 2500) * 1000),
        socials: { twitter: '', facebook: '' },
      },
    });
    demoStaff.push(st);
    bump('staff');
  }
  const teacherEmails = demoStaff.filter((s) => s.role === 'Teacher').map((s) => s.email).concat(['george@gmail.com']);

  // ---- Users --------------------------------------------------------------
  const hashed = await bcrypt.hash('password123', 10);
  for (let i = 0; i < 20; i++) {
    const role = i < 8 ? UserRole.student : i < 14 ? UserRole.parent : i < 19 ? UserRole.teacher : UserRole.staff;
    const firstName = FIRST[(i * 4 + 2) % FIRST.length];
    const lastName = LAST[(i * 4 + 9) % LAST.length];
    const email = `${firstName}.${lastName}.user${i + 1}`.toLowerCase() + '@oacmis.local';
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { name: `${firstName} ${lastName}`, email, password: hashed, role, isActive: true },
    });
    bump('users');
  }

  // ---- Exam assignments (subject teachers per class) ----------------------
  const teachableClasses = CLASS_DEFS.filter((c) => ['Nursery', 'Lower Primary', 'Upper Primary'].includes(c.level));
  let asgIdx = 0;
  for (const c of teachableClasses) {
    const subs = c.level === 'Upper Primary' ? UPPER_PRIMARY_SUBJECTS : ALL_SUBJECTS;
    for (const subject of subs.slice(0, 2)) { // ~2 per class → ~20 total
      const teacherEmail = teacherEmails[asgIdx % teacherEmails.length];
      const exists = await prisma.examAssignment.findFirst({ where: { className: c.name, subject, level: 'all' } });
      if (!exists) {
        await prisma.examAssignment.create({ data: { level: 'all', className: c.name, subject, teacherEmail, term: TERM, year: YEAR } });
        bump('examAssignments');
      }
      asgIdx++;
    }
  }

  // ---- Exam RESULTS — unique per student ---------------------------------
  const NUR_ADJ = ['excellent', 'good', 'steady', 'encouraging', 'remarkable', 'improving'];
  const NUR_VERB = ['participates actively', 'follows instructions well', 'shares nicely with friends', 'concentrates well', 'asks thoughtful questions', 'needs gentle encouragement'];
  for (const s of allStudents) {
    const isUpper = s.level === 'Upper Primary';
    const isNursery = s.level === 'Nursery';
    const subjects = isUpper ? UPPER_PRIMARY_SUBJECTS : ALL_SUBJECTS;
    for (const subject of subjects) {
      for (const topic of PERIODS) {
        const seed = `${s.id}|${subject}|${topic}`;
        const data = isNursery
          ? { score: 0, comment: `${s.firstName} ${pick(NUR_VERB, seed)} and shows ${pick(NUR_ADJ, seed + topic)} progress in ${subject} this ${topic}.` }
          : { score: between(seed, 45, 96), comment: null };
        await prisma.examMark.upsert({
          where: { level_term_className_subject_topic_studentId: { level: 'all', term: TERM, className: s.className, subject, topic, studentId: s.id } },
          update: data,
          create: { level: 'all', term: TERM, className: s.className, subject, topic, studentId: s.id, year: YEAR, ...data },
        });
        bump('examMarks');
      }
    }
  }

  // ---- Helpers for the remaining domain tables ----------------------------
  const pupil = (i) => demoStudents[i % demoStudents.length];
  const staffOf = (i) => demoStaff[i % demoStaff.length];
  const dateStr = (i) => `2026-0${(i % 6) + 1}-` + pad10(between('d' + i, 1, 28));
  function pad10(n) { return String(n).padStart(2, '0'); }

  // ---- GradeRecord --------------------------------------------------------
  {
    const rows = [];
    for (let i = 0; i < 20; i++) {
      const s = pupil(i);
      const subject = pick(ALL_SUBJECTS, s.id + i);
      const midterm = between(s.id + subject + 'm', 45, 95);
      const final = between(s.id + subject + 'f', 45, 95);
      const overall = Math.round((midterm + final) / 2);
      rows.push({ student: `${s.firstName} ${s.lastName}`, className: s.className, subject, midterm, final, overall: String(overall), gpa: Number((overall / 20).toFixed(2)), term: TERM, year: YEAR });
    }
    await prisma.gradeRecord.createMany({ data: rows }); bump('gradeRecords', rows.length);
  }

  // ---- AttendanceRecord (unique date+class+student) -----------------------
  {
    const rows = [];
    const seen = new Set();
    for (let i = 0; i < 24; i++) {
      const s = pupil(i);
      const date = `2026-07-${pad10((i % 20) + 1)}`;
      const key = `${date}|${s.className}|${s.id}`;
      if (seen.has(key)) continue; seen.add(key);
      rows.push({ date, className: s.className, studentId: s.id, status: pick(['present', 'present', 'present', 'absent', 'late'], key), term: TERM, year: YEAR });
    }
    await prisma.attendanceRecord.createMany({ data: rows, skipDuplicates: true }); bump('attendanceRecords', rows.length);
  }

  // ---- FeeRecord + FeePayment --------------------------------------------
  {
    const feeRows = [];
    for (let i = 0; i < 20; i++) {
      const s = pupil(i);
      const amount = between(s.id + 'fee', 300, 900) * 1000;
      const paid = i % 3 === 0 ? amount : i % 3 === 1 ? Math.round(amount / 2) : 0;
      feeRows.push({
        studentId: s.id, studentName: `${s.firstName} ${s.lastName}`, class: s.className, term: TERM,
        feeType: pick(['Tuition', 'Transport', 'Lunch', 'Examination'], s.id + i), amount, paidAmount: paid,
        status: paid >= amount ? 'paid' : paid > 0 ? 'partial' : 'unpaid', dueDate: '2026-07-31', year: YEAR,
      });
    }
    const createdFees = [];
    for (const f of feeRows) { createdFees.push(await prisma.feeRecord.create({ data: f })); bump('feeRecords'); }

    const payRows = [];
    for (let i = 0; i < 20; i++) {
      const f = createdFees[i];
      if (!f.paidAmount) continue;
      payRows.push({
        studentId: f.studentId, studentName: f.studentName, invoiceRef: `INV-${YEAR}-${pad(i + 1)}`, feeRecordId: f.id,
        amount: f.paidAmount, method: pick(['card', 'mobile-money', 'bank', 'cash'], f.id), cardLast4: pad(between(f.id, 0, 9999)).slice(-4),
        status: 'success', paidAt: '2026-07-1' + (i % 9),
      });
    }
    await prisma.feePayment.createMany({ data: payRows }); bump('feePayments', payRows.length);
  }

  // ---- Certificates -------------------------------------------------------
  {
    const rows = [];
    for (let i = 0; i < 20; i++) {
      const s = pupil(i);
      rows.push({ studentName: `${s.firstName} ${s.lastName}`, studentId: s.id, certificateType: pick(['Completion', 'Merit', 'Best Performer', 'Attendance'], s.id + i), issuedDate: dateStr(i), signedBy: 'Head Teacher', description: 'Awarded for outstanding effort.' });
    }
    await prisma.certificate.createMany({ data: rows }); bump('certificates', rows.length);
  }

  // ---- HealthRecord -------------------------------------------------------
  {
    const rows = [];
    for (let i = 0; i < 20; i++) {
      const s = pupil(i);
      rows.push({ studentName: `${s.firstName} ${s.lastName}`, bloodType: pick(['O+', 'A+', 'B+', 'AB+', 'O-'], s.id), allergies: pick(['None', 'Peanuts', 'Dust', 'Pollen'], s.id + 'a'), conditions: pick(['None', 'Asthma', 'None', 'None'], s.id + 'c'), immunizations: 'Up to date', emergencyContact: s.parentName || 'Parent', emergencyPhone: s.parentPhone || '+256700000000' });
    }
    await prisma.healthRecord.createMany({ data: rows }); bump('healthRecords', rows.length);
  }

  // ---- DisciplineIncident -------------------------------------------------
  {
    const rows = [];
    for (let i = 0; i < 20; i++) {
      const s = pupil(i + 3);
      rows.push({ studentName: `${s.firstName} ${s.lastName}`, date: dateStr(i), type: pick(['Late coming', 'Noise making', 'Uniform', 'Fighting'], s.id + i), severity: pick(['low', 'medium', 'high'], s.id), description: 'Reported by class teacher.', action: pick(['Warning', 'Counselling', 'Parent notified'], s.id + 'x') });
    }
    await prisma.disciplineIncident.createMany({ data: rows }); bump('disciplineIncidents', rows.length);
  }

  // ---- InventoryItem ------------------------------------------------------
  {
    const items = ['Chalk Box', 'Whiteboard Marker', 'Exercise Book', 'Ream of Paper', 'Football', 'Desk', 'Chair', 'Textbook', 'First Aid Kit', 'Broom', 'Printer Toner', 'Stapler', 'Globe', 'Ruler Set', 'Science Kit', 'Mop', 'Dustbin', 'Projector', 'Extension Cable', 'Notebook'];
    const rows = items.map((name, i) => ({ name, category: pick(['Stationery', 'Furniture', 'Sports', 'Cleaning', 'Electronics'], name), sku: `SKU-${pad(i + 1)}`, quantity: between(name, 5, 200), minStock: 10, unitPrice: between(name + 'p', 1, 200) * 1000, supplier: pick(['Aponye', 'Nakumatt', 'Office Point'], name), location: 'Store ' + ((i % 3) + 1), status: 'in-stock' }));
    await prisma.inventoryItem.createMany({ data: rows, skipDuplicates: true }); bump('inventoryItems', rows.length);
  }

  // ---- Books + BorrowRecords ---------------------------------------------
  {
    const titles = ['Fun with Numbers', 'English Grammar', 'Our Environment', 'Science Explorer', 'Reading Stars', 'Map Skills', 'Basic Algebra', 'Poems for Kids', 'World History', 'Body Systems', 'Spelling Bee', 'Geometry Basics', 'Folk Tales', 'Weather & Climate', 'Plants Around Us', 'Great Leaders', 'Number Patterns', 'Creative Writing', 'Rivers & Lakes', 'Healthy Living'];
    const books = titles.map((title, i) => ({ title, author: `${pick(FIRST, title)} ${pick(LAST, title)}`, isbn: `978-${between(title, 1000000000, 9999999999)}`, category: pick(ALL_SUBJECTS, title), totalCopies: between(title, 3, 20), availableCopies: between(title + 'a', 0, 3), status: 'available' }));
    const createdBooks = [];
    for (const b of books) { createdBooks.push(await prisma.book.create({ data: b })); bump('books'); }
    const borrow = [];
    for (let i = 0; i < 20; i++) {
      const s = pupil(i); const b = createdBooks[i];
      borrow.push({ bookTitle: b.title, studentName: `${s.firstName} ${s.lastName}`, studentId: s.id, borrowDate: dateStr(i), dueDate: '2026-08-01', status: i % 4 === 0 ? 'returned' : 'borrowed' });
    }
    await prisma.borrowRecord.createMany({ data: borrow }); bump('borrowRecords', borrow.length);
  }

  // ---- Transport: BusRoute + RouteAssignment ------------------------------
  {
    const routes = [];
    for (let i = 0; i < 20; i++) {
      routes.push({ routeName: `Route ${String.fromCharCode(65 + (i % 26))}${i}`, busNumber: `UAX ${between('bus' + i, 100, 999)}${String.fromCharCode(65 + (i % 26))}`, driverName: `${pick(FIRST, 'drv' + i)} ${pick(LAST, 'drv' + i)}`, capacity: between('cap' + i, 14, 45), studentsCount: between('sc' + i, 5, 30), startTime: '06:30', endTime: '17:30', status: 'active' });
    }
    const createdRoutes = [];
    for (const r of routes) { createdRoutes.push(await prisma.busRoute.create({ data: r })); bump('busRoutes'); }
    const ra = [];
    for (let i = 0; i < 20; i++) { const s = pupil(i); const r = createdRoutes[i]; ra.push({ routeId: r.id, studentId: s.id, studentName: `${s.firstName} ${s.lastName}`, className: s.className }); }
    await prisma.routeAssignment.createMany({ data: ra, skipDuplicates: true }); bump('routeAssignments', ra.length);
  }

  // ---- Hostel: HostelRoom + RoomAssignment --------------------------------
  {
    const rooms = [];
    for (let i = 0; i < 20; i++) {
      rooms.push({ hostelName: pick(['Unity', 'Peace', 'Hope'], 'h' + i), roomNumber: `R${pad(i + 1)}`, type: pick(['Dormitory', 'Single', 'Double'], 'r' + i), gender: i % 2 ? 'Male' : 'Female', capacity: between('rc' + i, 2, 12), occupied: between('ro' + i, 0, 2), warden: `${pick(FIRST, 'w' + i)} ${pick(LAST, 'w' + i)}`, status: 'open', monthlyFee: between('mf' + i, 100, 300) * 1000 });
    }
    const createdRooms = [];
    for (const r of rooms) { createdRooms.push(await prisma.hostelRoom.create({ data: r })); bump('hostelRooms'); }
    const rms = [];
    for (let i = 0; i < 20; i++) { const s = pupil(i + 1); const r = createdRooms[i]; rms.push({ roomId: r.id, studentId: s.id, studentName: `${s.firstName} ${s.lastName}`, className: s.className }); }
    await prisma.roomAssignment.createMany({ data: rms, skipDuplicates: true }); bump('roomAssignments', rms.length);
  }

  // ---- Payroll ------------------------------------------------------------
  {
    const rows = [];
    for (let i = 0; i < 20; i++) {
      const st = staffOf(i); const base = between(st.id + 'b', 600, 2500) * 1000; const allow = between(st.id + 'a', 50, 300) * 1000; const ded = between(st.id + 'd', 20, 150) * 1000;
      rows.push({ employeeId: st.id, name: `${st.firstName} ${st.lastName}`, position: st.role, department: pick(['Academics', 'Administration', 'Support'], st.id), baseSalary: base, allowances: allow, deductions: ded, netSalary: base + allow - ded, month: 'July', year: YEAR, status: 'paid' });
    }
    await prisma.payrollRecord.createMany({ data: rows }); bump('payrollRecords', rows.length);
  }

  // ---- LeaveRequest -------------------------------------------------------
  {
    const rows = [];
    for (let i = 0; i < 20; i++) { const st = staffOf(i); rows.push({ employeeName: `${st.firstName} ${st.lastName}`, type: pick(['Sick', 'Annual', 'Maternity', 'Study'], st.id + i), startDate: dateStr(i), endDate: dateStr(i + 3), reason: 'Personal reasons.', status: pick(['pending', 'approved', 'rejected'], st.id) }); }
    await prisma.leaveRequest.createMany({ data: rows }); bump('leaveRequests', rows.length);
  }

  // ---- Admissions ---------------------------------------------------------
  {
    const rows = [];
    for (let i = 0; i < 20; i++) { const fn = FIRST[(i * 5) % FIRST.length]; const ln = LAST[(i * 5 + 2) % LAST.length]; rows.push({ applicantName: `${fn} ${ln}`, dob: `20${between('adob' + i, 14, 20)}-05-10`, gradeApplied: pick(['Baby', 'Middle', 'Top', 'P1', 'P4', 'P6'], 'g' + i), parentName: `${pick(FIRST, 'ap' + i)} ${ln}`, parentEmail: `apply.${ln}${i}`.toLowerCase() + '@mail.com', parentPhone: `+2567${between('aph' + i, 10000000, 99999999)}`, priorSchool: pick(['Little Angels', 'Bright Kids', 'Home', 'Sunrise'], 'ps' + i), status: pick(['pending', 'accepted', 'waitlisted'], 'as' + i) }); }
    await prisma.admission.createMany({ data: rows }); bump('admissions', rows.length);
  }

  // ---- Alumni -------------------------------------------------------------
  {
    const rows = [];
    for (let i = 0; i < 20; i++) { const fn = FIRST[(i * 7) % FIRST.length]; const ln = LAST[(i * 7 + 3) % LAST.length]; rows.push({ fullName: `${fn} ${ln}`, graduationYear: 2000 + (i % 24), occupation: pick(['Engineer', 'Teacher', 'Doctor', 'Trader', 'Farmer', 'Nurse'], 'oc' + i), email: `${fn}.${ln}.alum${i}`.toLowerCase() + '@mail.com', phone: `+2567${between('alp' + i, 10000000, 99999999)}`, isDonor: i % 4 === 0 }); }
    await prisma.alumnus.createMany({ data: rows }); bump('alumni', rows.length);
  }

  // ---- Events -------------------------------------------------------------
  {
    const names = ['Sports Day', 'Parents Meeting', 'Music Gala', 'Science Fair', 'Prize Giving', 'Career Talk', 'Open Day', 'Cultural Day', 'Debate', 'Charity Walk', 'Health Camp', 'Art Exhibition', 'Reading Week', 'Maths Contest', 'Drama Night', 'Founders Day', 'Clean-up Drive', 'Talent Show', 'Graduation', 'Book Fair'];
    const rows = names.map((title, i) => ({ title, date: dateStr(i), type: pick(['academic', 'sports', 'social', 'meeting'], title), audience: pick(['All', 'Parents', 'Staff', 'Pupils'], title), description: `${title} for the school community.` }));
    await prisma.event.createMany({ data: rows }); bump('events', rows.length);
  }

  // ---- Timetable ----------------------------------------------------------
  {
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const rows = [];
    for (let i = 0; i < 20; i++) {
      const c = teachableClasses[i % teachableClasses.length];
      const subs = c.level === 'Upper Primary' ? UPPER_PRIMARY_SUBJECTS : ALL_SUBJECTS;
      rows.push({ className: c.name, day: DAYS[i % DAYS.length], startTime: `0${8 + (i % 4)}:00`, endTime: `0${9 + (i % 4)}:00`, subject: subs[i % subs.length], teacher: teacherEmails[i % teacherEmails.length], room: c.room, term: TERM, year: YEAR });
    }
    await prisma.timetableEntry.createMany({ data: rows }); bump('timetableEntries', rows.length);
  }

  // ---- Assignments + Submissions -----------------------------------------
  {
    const createdA = [];
    for (let i = 0; i < 20; i++) {
      const c = teachableClasses[i % teachableClasses.length];
      const subs = c.level === 'Upper Primary' ? UPPER_PRIMARY_SUBJECTS : ALL_SUBJECTS;
      const subject = subs[i % subs.length];
      const a = await prisma.assignment.create({ data: { title: `${subject} Homework ${i + 1}`, subject, className: c.name, dueDate: '2026-07-25', description: `Complete the ${subject} exercises.`, createdBy: teacherEmails[i % teacherEmails.length], active: true, term: TERM, year: YEAR } });
      createdA.push(a); bump('assignments');
    }
    const subs = [];
    for (let i = 0; i < 20; i++) { const s = pupil(i); subs.push({ assignmentId: createdA[i].id, studentName: `${s.firstName} ${s.lastName}`, content: 'My completed work.', submittedAt: dateStr(i) }); }
    await prisma.assignmentSubmission.createMany({ data: subs }); bump('assignmentSubmissions', subs.length);
  }

  // ---- Quizzes + Submissions ---------------------------------------------
  {
    const createdQ = [];
    for (let i = 0; i < 20; i++) {
      const c = teachableClasses[i % teachableClasses.length];
      const subs = c.level === 'Upper Primary' ? UPPER_PRIMARY_SUBJECTS : ALL_SUBJECTS;
      const subject = subs[i % subs.length];
      const questions = [
        { q: `${subject} question 1?`, options: ['A', 'B', 'C', 'D'], answer: i % 4 },
        { q: `${subject} question 2?`, options: ['A', 'B', 'C', 'D'], answer: (i + 1) % 4 },
      ];
      const q = await prisma.quiz.create({ data: { title: `${subject} Quiz ${i + 1}`, subject, classTarget: c.name, description: `A short ${subject} quiz.`, durationMinutes: 20, deadline: '2026-07-28', totalPoints: 2, status: 'published', createdBy: teacherEmails[i % teacherEmails.length], questions, term: TERM, year: YEAR } });
      createdQ.push(q); bump('quizzes');
    }
    const qsubs = [];
    for (let i = 0; i < 20; i++) { const s = pupil(i); qsubs.push({ quizId: createdQ[i].id, studentId: s.id, studentName: `${s.firstName} ${s.lastName}`, submittedAt: dateStr(i), answers: [i % 4, (i + 1) % 4], score: between(s.id + 'q', 0, 2), autoGraded: true, released: i % 2 === 0 }); }
    await prisma.quizSubmission.createMany({ data: qsubs }); bump('quizSubmissions', qsubs.length);
  }

  // ---- Messaging: Messages + Blasts + BulkNotifications -------------------
  {
    const msgs = [];
    for (let i = 0; i < 20; i++) { const s = pupil(i); msgs.push({ from: teacherEmails[i % teacherEmails.length], to: s.parentEmail || 'parent@oacmis.local', subject: pick(['Progress update', 'Reminder', 'Meeting', 'Well done'], s.id + i), body: 'Please see the note about your child.', sentAt: dateStr(i) }); }
    await prisma.message.createMany({ data: msgs }); bump('messages', msgs.length);

    const blasts = [];
    for (let i = 0; i < 20; i++) { blasts.push({ channel: pick(['sms', 'email', 'push'], 'bl' + i), audience: pick(['All Parents', 'All Staff', 'P7 Parents'], 'ba' + i), subject: `Notice ${i + 1}`, body: 'School-wide announcement.', recipients: between('br' + i, 10, 300), sentAt: dateStr(i) }); }
    await prisma.blast.createMany({ data: blasts }); bump('blasts', blasts.length);

    const bulk = [];
    for (let i = 0; i < 20; i++) { bulk.push({ title: `Bulk Notice ${i + 1}`, message: 'Important information for recipients.', type: pick(['info', 'warning', 'success'], 'bn' + i), recipients: pick(['parents', 'staff', 'students'], 'bnr' + i), recipientCount: between('bnc' + i, 10, 300), sentDate: dateStr(i), status: 'sent', createdBy: 'admin@oacmis.local' }); }
    await prisma.bulkNotification.createMany({ data: bulk }); bump('bulkNotifications', bulk.length);
  }

  // ---- Notifications ------------------------------------------------------
  {
    const rows = [];
    for (let i = 0; i < 20; i++) { rows.push({ title: `Notification ${i + 1}`, message: pick(['New result published', 'Fees reminder', 'Event scheduled', 'Report ready'], 'nt' + i), type: pick(['info', 'warning', 'success', 'error'], 'nty' + i), read: i % 3 === 0 }); }
    await prisma.notification.createMany({ data: rows }); bump('notifications', rows.length);
  }

  // ---- RFID: Devices + Attendance ----------------------------------------
  {
    const devices = [];
    for (let i = 0; i < 20; i++) { const d = await prisma.rFIDDevice.create({ data: { name: `Reader ${i + 1}`, location: pick(['Main Gate', 'Library', 'Dining Hall', 'Lab'], 'dev' + i), status: 'online', lastSync: dateStr(i) } }); devices.push(d); bump('rfidDevices'); }
    const rows = [];
    for (let i = 0; i < 20; i++) { const s = pupil(i); rows.push({ studentId: s.id, studentName: `${s.firstName} ${s.lastName}`, rfidTag: `TAG-${pad(i + 1)}`, timestamp: `2026-07-${pad10((i % 20) + 1)}T07:${pad10(i)}:00`, status: pick(['in', 'out'], s.id + i), scannedBy: devices[i % devices.length].name }); }
    await prisma.rFIDAttendanceRecord.createMany({ data: rows }); bump('rfidAttendanceRecords', rows.length);
  }

  // ---- Resources ----------------------------------------------------------
  {
    const rows = [];
    for (let i = 0; i < 20; i++) { const subject = ALL_SUBJECTS[i % ALL_SUBJECTS.length]; const c = teachableClasses[i % teachableClasses.length]; rows.push({ title: `${subject} Notes ${i + 1}`, type: pick(['pdf', 'video', 'slides', 'link'], 'res' + i), subject, className: c.name, fileUrl: `https://files.oacmis.local/${subject.toLowerCase().replace(/ /g, '-')}-${i + 1}.pdf` }); }
    await prisma.resource.createMany({ data: rows }); bump('resources', rows.length);
  }

  // ---- AuditLog -----------------------------------------------------------
  {
    const rows = [];
    for (let i = 0; i < 20; i++) { rows.push({ action: pick(['create', 'update', 'delete', 'login'], 'al' + i), entity: pick(['Student', 'FeeRecord', 'ExamMark', 'Staff'], 'ale' + i), entityId: 'demo-' + i }); }
    await prisma.auditLog.createMany({ data: rows }); bump('auditLogs', rows.length);
  }

  // ---- School profile (only if not already set) + marker ------------------
  if (!(await prisma.appSetting.findUnique({ where: { key: 'school_profile' } }))) {
    await prisma.appSetting.create({ data: { key: 'school_profile', value: { name: 'OACMIS School', motto: 'Toil For Success', contacts: '+256 700 000 000', address: 'P.O. Box 123, Kampala' } } });
  }

  // Nursery report needs a subject list whose NAMES match the curriculum so the
  // per-period comments entered on Exams can be matched onto the report.
  if (!(await prisma.appSetting.findUnique({ where: { key: 'nursery_report_template' } }))) {
    await prisma.appSetting.create({
      data: {
        key: 'nursery_report_template',
        value: {
          title: 'Nursery Progress Report',
          subjects: ALL_SUBJECTS.map((name) => ({ id: 'nsub-' + name.toLowerCase().replace(/ /g, '-'), name, image: '' })),
        },
      },
    });
  }
  await prisma.appSetting.create({ data: { key: MARKER, value: { at: new Date().toISOString(), term: TERM, year: YEAR } } });

  console.log('Demo data seeded. Row additions:');
  console.table(counts);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
