/* =========================================================================
   faqs.js — ADCET FAQ knowledge base (rule-based, no AI key needed)
   -------------------------------------------------------------------------
   Structure: categories -> each has an id, label, icon, and a list of FAQs.
   Every FAQ has: q (question), keywords (for matching), a (answer),
   sample (true if the answer is a PLACEHOLDER, not verified ADCET data),
   and follow (suggested follow-up questions).

   NOTE ON ACCURACY: Answers marked sample:true are illustrative placeholders.
   Replace them with verified details from the official ADCET office before
   publishing. Do NOT treat them as official fees, dates or policies.
   ========================================================================= */

const FAQ_DATA = {
  categories: [
    /* ---------------------------------------------------------------- */
    {
      id: "admissions",
      label: "Admissions",
      icon: "🎓",
      faqs: [
        {
          q: "What is the admission process at ADCET?",
          keywords: ["admission", "process", "apply", "how", "join", "procedure"],
          a: "Sample answer: Admission to first-year engineering programs is generally granted through the Maharashtra State CET Cell's centralized admission process (CAP), based on your MHT-CET / JEE (Main) score and seat-availability rules. institute-level and Management/NRI quota seats may follow a separate process. Confirm the current year's exact steps with the ADCET admission office.",
          sample: true,
          follow: ["What is the eligibility criteria?", "What documents are required?", "When is the admission deadline?"],
        },
        {
          q: "What is the eligibility criteria for B.E./B.Tech?",
          keywords: ["eligibility", "criteria", "eligible", "qualification", "12th", "hsc", "percent", "marks"],
          a: "Sample answer: For undergraduate engineering programs, candidates typically need to have passed HSC (10+2) or an equivalent examination with Physics, Mathematics, and one additional subject (Chemistry/Biology/Technical Vocational subject), plus a qualifying score in MHT-CET or JEE (Main) as per AICTE / State CET Cell norms. Check the official admission notice for the exact percentage requirements for the current year.",
          sample: true,
          follow: ["What is the admission process?", "Are direct second-year (DSE) admissions available?"],
        },
        {
          q: "How do I get the admission application form?",
          keywords: ["form", "application", "apply", "registration", "apply form", "how to apply"],
          a: "Sample answer: Most applications are submitted online through the Maharashtra State CET Cell portal during the CAP rounds. For institute-level or postgraduate admissions, forms are usually available on the college website or from the admission office in person. Always verify the current link on the official ADCET website before applying.",
          sample: true,
          follow: ["What is the admission deadline?", "What is the admission process?"],
        },
        {
          q: "What is the admission deadline?",
          keywords: ["deadline", "last date", "due date", "when", "date", "closing", "time"],
          a: "Sample answer: Admission dates change every year and are announced by the State CET Cell and the college. There is no single fixed deadline — each CAP round has its own schedule, and institute-level rounds follow separately. Please check the Notices section of the ADCET website or contact the admission office for the current year's calendar.",
          sample: true,
          follow: ["Where can I find the academic calendar?", "How do I get the admission application form?"],
        },
        {
          q: "Are direct second-year (DSE / lateral entry) admissions available?",
          keywords: ["direct", "second year", "dse", "lateral", "diploma", "bsc", "entry"],
          a: "Sample answer: Yes, Diploma holders in relevant engineering branches and B.Sc (with Mathematics) graduates can typically seek admission directly to the second year of B.E./B.Tech under the lateral-entry (DSE) process, subject to seat availability and eligibility norms. Confirm the process and document list with the admission office.",
          sample: true,
          follow: ["What is the eligibility criteria?", "What documents are required?"],
        },
        {
          q: "What documents are required for admission?",
          keywords: ["document", "papers", "certificate", "marksheet", "id", "proof", "required"],
          a: "Sample answer: You will usually be asked for: SSC & HSC mark sheets and passing certificates, school leaving certificate, MHT-CET/JEE score card, caste/income/domicile certificates (if applicable), Aadhaar and passport-size photographs, and any category-specific documents (PH, Defence, etc.). The exact list varies by quota — please collect the official checklist from the admission office.",
          sample: true,
          follow: ["What is the admission process?", "What is the admission deadline?"],
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    {
      id: "fees",
      label: "Fees & Payments",
      icon: "💰",
      faqs: [
        {
          q: "What are the tuition fees?",
          keywords: ["fee", "fees", "tuition", "cost", "price", "charge", "how much"],
          a: "Sample answer: Fee structures differ by program (B.E./B.Tech, M.E./M.Tech, MBA/MCA), by category (State/All-India/Management/NRI), and are revised by the institute from time to time as per government and fees-regulator approvals. No verified figure is published in this demo. Please contact the college office for the current fee structure.",
          sample: true,
          follow: ["How can I pay the fees?", "Are scholarships available?"],
        },
        {
          q: "How can I pay the fees? Which payment methods are accepted?",
          keywords: ["pay", "payment", "mode", "method", "online", "cash", "card", "upi", "neft", "dd"],
          a: "Sample answer: Colleges commonly accept payment via online transfer, UPI, debit/credit card, demand draft, or at the college accounts counter. The exact accepted channels and the official payment gateway/portal should be confirmed with the accounts office before making any payment.",
          sample: true,
          follow: ["What are the tuition fees?", "Are scholarships available?"],
        },
        {
          q: "Are scholarships available?",
          keywords: ["scholarship", "stipend", "financial", "help", "concession", "ebc", "sc", "st", "minority"],
          a: "Sample answer: Yes — eligible students can typically apply for government scholarships such as Post-Matric Scholarship (SC/ST/VJ/DT/NT/SBC), EBC/others (as per state policy), merit-cum-means and minority scholarships, plus any institute-level aid. Scholarships usually require caste/income certificates and on-time application through the state scholarship portal. Confirm current eligibility with the college's scholarship cell.",
          sample: true,
          follow: ["What are the tuition fees?", "How can I pay the fees?"],
        },
        {
          q: "Can I pay the fees in installments?",
          keywords: ["installment", "instalment", "emi", "part payment", "split", "two part"],
          a: "Sample answer: Installment or分期 payment options, if offered, depend on institute policy for the current year and may carry additional conditions. This demo does not verify any installment scheme — please ask the accounts office directly.",
          sample: true,
          follow: ["How can I pay the fees?", "What are the tuition fees?"],
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    {
      id: "departments",
      label: "Departments",
      icon: "🏛️",
      faqs: [
        {
          q: "Which departments and courses does ADCET offer?",
          keywords: ["department", "course", "program", "branch", "btech", "be", "mtech", "mba", "mca", "offered"],
          a: "Sample answer: ADCET typically runs undergraduate engineering (B.E./B.Tech) programs across core branches such as Computer Engineering, IT, Electronics & Telecommunication, Electrical, Mechanical and Civil, along with postgraduate (M.E./M.Tech) and management/applications programs. The exact list of active branches and intake changes year to year — please check the official website or prospectus for the current list.",
          sample: true,
          follow: ["How many seats are there in each branch?", "Tell me about the faculty"],
        },
        {
          q: "How many seats are there in each branch?",
          keywords: ["seat", "intake", "capacity", "how many", "strength", "quota"],
          a: "Sample answer: Seat intake is approved each year by the AICTE / State CET Cell and differs per branch and per category (State, All-India, Management, NRI). The current sanctioned intake is published in the college prospectus and on the official website — this demo does not state specific numbers.",
          sample: true,
          follow: ["Which departments and courses does ADCET offer?", "What is the admission process?"],
        },
        {
          q: "Tell me about the faculty",
          keywords: ["faculty", "professor", "teacher", "staff", "qualification", "phd", "department"],
          a: "Sample answer: ADCET's teaching staff includes qualified faculty members across all engineering departments, many holding postgraduate and doctoral qualifications with experience in academics and industry. You can browse department-wise faculty profiles (name, designation, qualifications, subjects) in the Faculty section of the official website. This demo does not reproduce individual names or details.",
          sample: true,
          follow: ["Which departments and courses does ADCET offer?", "What is the student-faculty ratio like?"],
        },
        {
          q: "What is the student-faculty ratio like?",
          keywords: ["ratio", "class size", "how many students", "batch"],
          a: "Sample answer: Class and batch sizes vary by branch and year. For verified student-faculty ratios or average class strength, please refer to the college's NBA/NAAC self-study reports or ask the respective department office — no specific ratio is claimed here.",
          sample: true,
          follow: ["Tell me about the faculty", "What laboratory facilities are available?"],
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    {
      id: "hostel",
      label: "Hostel",
      icon: "🏠",
      faqs: [
        {
          q: "Does ADCET provide hostel facilities?",
          keywords: ["hostel", "accommodation", "stay", "room", "living", "mess", "residence"],
          a: "Sample answer: Yes, on-campus hostel accommodation is generally available for outstation students, with separate blocks for boys and girls, shared rooms, common reading areas, and mess/dining facilities. Allocation is usually first-come-first-served based on distance from home and availability — confirm current vacancy with the hostel office.",
          sample: true,
          follow: ["What are the hostel fees?", "Is food included in the hostel?"],
        },
        {
          q: "What are the hostel fees?",
          keywords: ["hostel fee", "hostel fees", "room charge", "mess charge", "stay cost", "rent"],
          a: "Sample answer: Hostel and mess charges depend on the room type (shared/single), the facilities opted for, and are revised by the institute from time to time. This demo does not publish any specific amount. Please contact the hostel office for the current year's fee structure.",
          sample: true,
          follow: ["Does ADCET provide hostel facilities?", "Is food included in the hostel?"],
        },
        {
          q: "Is food included in the hostel? How is the mess?",
          keywords: ["food", "mess", "meal", "dining", "eat", "breakfast", "lunch", "dinner", "veg"],
          a: "Sample answer: Hostel mess usually operates on a monthly menu plan with vegetarian options, and charges are billed separately (or as a combined hostel+mess package, depending on policy). Special diet needs should be discussed with the warden. Verify current menu and charges with the hostel office.",
          sample: true,
          follow: ["What are the hostel fees?", "Are there other campus facilities?"],
        },
        {
          q: "What are the hostel rules and timings?",
          keywords: ["rule", "timing", "curfew", "gate", "night", "permission", "visitor", "discipline"],
          a: "Sample answer: Hostels typically enforce entry/exit timings, an attendance and gate-pass process, and visitor policies, with wardens and resident mentors available for support. The exact rules for the current year are issued in the hostel handbook — please collect it from the hostel office.",
          sample: true,
          follow: ["Does ADCET provide hostel facilities?", "Is there Wi-Fi on campus?"],
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    {
      id: "placements",
      label: "Placements",
      icon: "💼",
      faqs: [
        {
          q: "Does ADCET have a placement cell?",
          keywords: ["placement", "job", "career", "training", "tpo", "recruitment", "employment"],
          a: "Sample answer: Yes, ADCET operates a Training & Placement (T&P) cell that coordinates pre-placement training, aptitude and soft-skills sessions, internships, and campus recruitment drives for final-year students. Students should register with the T&P cell and keep their resume and academic records updated.",
          sample: true,
          follow: ["Which companies visit for placements?", "What training is given before placements?"],
        },
        {
          q: "Which companies visit for placements?",
          keywords: ["company", "recruiter", "visit", "mnc", "which", "firms", "drive"],
          a: "Sample answer: A range of IT/Software, core engineering, analytics, banking and manufacturing companies have historically taken part in campus drives at colleges in this region. This demo does NOT publish any specific company names or placement statistics. Please check the official T&P cell page or placement reports for verified recruiter lists.",
          sample: true,
          follow: ["What is the highest package offered?", "What training is given before placements?"],
        },
        {
          q: "What is the highest package offered?",
          keywords: ["package", "salary", "highest", "average", "ctc", "stipend", "amount", "stats"],
          a: "Sample answer: Placement packages vary widely by branch, company and year. This demo intentionally does not quote any highest/average CTC figures, as verified numbers should come from official placement reports published by the institute. Please refer to the T&P cell's annual placement report for accurate statistics.",
          sample: true,
          follow: ["Which companies visit for placements?", "Does ADCET have a placement cell?"],
        },
        {
          q: "What training is given before placements?",
          keywords: ["training", "aptitude", "soft skill", "preparation", "mock", "resume", "gd"],
          a: "Sample answer: T&P cells commonly organize aptitude and reasoning practice, technical/mock interviews, group-discussion sessions, resume-building workshops, communication and personality-development sessions, and sometimes domain-specific bootcamps with industry partners. Exact modules for the current year are shared by the T&P cell at the start of the season.",
          sample: true,
          follow: ["Which companies visit for placements?", "Do internships also happen through the placement cell?"],
        },
        {
          q: "Do internships also happen through the placement cell?",
          keywords: ["internship", "intern", "training", "industrial", "stipend", "summer"],
          a: "Sample answer: Many students do secure internships via the T&P cell's industry connections, and some programs include a mandatory industrial-training period. Internship availability depends on the branch and the recruiting partner for that year. Connect with your department's T&P coordinator for the current opportunities.",
          sample: true,
          follow: ["What training is given before placements?", "Does ADCET have a placement cell?"],
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    {
      id: "transport",
      label: "Transport",
      icon: "🚌",
      faqs: [
        {
          q: "Does ADCET provide transport facilities?",
          keywords: ["transport", "bus", "travel", "commute", "route", "shuttle", "vehicle"],
          a: "Sample answer: Colleges in this region typically run their own bus service covering nearby towns and railway stations for students and staff. Whether ADCET operates in-house buses or uses a private operator, and the current route list, should be confirmed with the college transport office.",
          sample: true,
          follow: ["What are the bus routes and timings?", "What are the transport charges?"],
        },
        {
          q: "What are the bus routes and timings?",
          keywords: ["route", "timing", "time", "bus", "schedule", "stop", "which place", "when"],
          a: "Sample answer: Bus routes and daily timings are finalized each academic year based on student demand and are displayed on the college notice board / official website. This demo does not publish specific stops, pick-up times or distances. Please collect the current route chart and timetable from the transport office.",
          sample: true,
          follow: ["Does ADCET provide transport facilities?", "What are the transport charges?"],
        },
        {
          q: "What are the transport charges?",
          keywords: ["transport fee", "bus fee", "charge", "cost", "fare", "how much"],
          a: "Sample answer: Transport charges depend on the route distance and are revised by the institute periodically. No specific amount is stated here — please ask the transport/accounts office for the current year's route-wise fees and payment schedule.",
          sample: true,
          follow: ["What are the bus routes and timings?", "Does ADCET provide transport facilities?"],
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    /* "General" is not shown as a card, but is searchable by keywords.  */
    /* ---------------------------------------------------------------- */
    {
      id: "general",
      label: "General",
      icon: "ℹ️",
      showAsCard: false,
      faqs: [
        {
          q: "How can I contact the college office?",
          keywords: ["contact", "phone", "number", "email", "office", "address", "call", "reach"],
          a: "Sample answer: The college office can be reached during working hours via the phone numbers and email addresses published on the official ADCET website's Contact page, or by visiting the administrative office on campus in person. This demo does not display specific contact numbers — always use the official published contacts.",
          sample: true,
          follow: ["Where is the college located?", "Where can I find the academic calendar?"],
        },
        {
          q: "Where is the college located?",
          keywords: ["location", "address", "where", "map", "direction", "ashta", "sangli"],
          a: "Sample answer: ADCET is located at Ashta, in the Sangli district of Maharashtra, India. For the exact campus address, map pin and travel directions, please refer to the official Contact page of the ADCET website.",
          sample: true,
          follow: ["How can I contact the college office?", "Does ADCET provide transport facilities?"],
        },
        {
          q: "Where can I find the academic calendar?",
          keywords: ["calendar", "academic", "exam", "semester", "holiday", "schedule", "term"],
          a: "Sample answer: The academic calendar (semester start/end dates, internal exams, mid-term breaks, and vacation periods) is published by the college/affiliating university before each academic year and is usually available in the Notices section of the official website or on department notice boards.",
          sample: true,
          follow: ["What library facilities are available?", "What laboratory facilities are available?"],
        },
        {
          q: "What library facilities are available?",
          keywords: ["library", "book", "journal", "reading", "borrow", "ebook", "study"],
          a: "Sample answer: College libraries typically provide text and reference books, national/international journals and magazines, digital e-resources/e-journals, a reading hall, and borrowing services for students and faculty. Membership rules, timings and digital-access portals are shared by the library at the start of the academic year.",
          sample: true,
          follow: ["What laboratory facilities are available?", "Where can I find the academic calendar?"],
        },
        {
          q: "What laboratory facilities are available?",
          keywords: ["lab", "laboratory", "equipment", "practical", "workshop", "experiment", "machines"],
          a: "Sample answer: Engineering departments normally maintain practical laboratories for their core subjects (e.g., programming/CS labs, electronics/electrical labs, civil and mechanical workshops) with the equipment required by the university syllabus. For a list of specific instruments or lab sessions, please contact the respective department.",
          sample: true,
          follow: ["What library facilities are available?", "Which departments and courses does ADCET offer?"],
        },
        {
          q: "Are there sports and cultural activities on campus?",
          keywords: ["sport", "culture", "fest", "event", "activity", "gym", "nss", "club", "extra"],
          a: "Sample answer: Campus life usually includes sports facilities, student clubs, NSS/NCC units, and annual cultural and technical festivals where students can participate. The current list of clubs and events is announced by the student affairs / cultural committee at the start of each year.",
          sample: true,
          follow: ["What library facilities are available?", "Does ADCET provide hostel facilities?"],
        },
        {
          q: "Is there Wi-Fi on campus?",
          keywords: ["wifi", "wi-fi", "internet", "network", "online", "lab computer"],
          a: "Sample answer: Many campuses provide internet/Wi-Fi access in academic blocks, labs and hostels for academic use. Coverage areas, login credentials and acceptable-use rules for the current year should be confirmed with the college IT/ computer center.",
          sample: true,
          follow: ["What laboratory facilities are available?", "Does ADCET provide hostel facilities?"],
        },
      ],
    },
  ],
};

export default FAQ_DATA;
