// database/seed.js
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ============================================================
// CAMPUS LOCATIONS — Accurate Parul University GPS (from 2026 PDF)
// ============================================================
const LOCATIONS = [
  // ACADEMIC
  { code:'A1',  name:'PIET — Main Block',        category:'academic', campus:'main', lat:22.29106, lng:73.36292, description:'Parul Institute of Engineering & Technology', image_url:'https://picsum.photos/seed/piet1/800/500' },
  { code:'A3',  name:'PIET — D Block',            category:'academic', campus:'main', lat:22.29166, lng:73.36313, description:'PIET D Block — labs and workshops', image_url:'https://picsum.photos/seed/piet3/800/500' },
  { code:'A14', name:'Business Administration',   category:'academic', campus:'main', lat:22.29202, lng:73.36260, description:'Parul Institute of Business Administration', image_url:'https://picsum.photos/seed/mba/800/500' },
  { code:'A15', name:'Faculty of Management',     category:'academic', campus:'main', lat:22.29236, lng:73.36301, description:'Faculty of Management Studies (FMS)', image_url:'https://picsum.photos/seed/fms/800/500' },
  { code:'A22', name:'Design, Fine Arts & Performing Arts', category:'academic', campus:'main', lat:22.29312, lng:73.36697, description:'Parul Institute of Design, Fine Arts and Performing Arts', image_url:'https://picsum.photos/seed/arts/800/500' },
  { code:'A23', name:'Bose Bhawan — Law & Commerce', category:'academic', campus:'main', lat:22.29390, lng:73.36515, description:'Law, Commerce, Agriculture, Social Work', image_url:'https://picsum.photos/seed/bose/800/500' },
  { code:'A24', name:'Bhagat Singh Bhawan',       category:'academic', campus:'main', lat:22.29414, lng:73.36559, description:'Parul Institute of Computer Application & PIET', image_url:'https://picsum.photos/seed/bhagat/800/500' },
  { code:'A25', name:'CV Raman Centre',            category:'academic', campus:'main', lat:22.29439, lng:73.36603, description:'Centre of Excellence for Advanced Computational Skills', image_url:'https://picsum.photos/seed/raman/800/500' },
  { code:'A28', name:'Lakshya 2047 Centre',        category:'academic', campus:'main', lat:22.29407, lng:73.36405, description:'Centre for Future Skills', image_url:'https://picsum.photos/seed/lakshya/800/500' },
  // ADMIN
  { code:'C1',  name:'Central Admin & Library',   category:'admin', campus:'main', lat:22.29147, lng:73.36383, description:'Student section, scholarship, accounts, Central Library, Harmony Hall', image_url:'https://picsum.photos/seed/admin/800/500' },
  { code:'C2',  name:'Admission & Placement Cell',category:'admin', campus:'main', lat:22.29175, lng:73.36405, description:'Admissions, placements, IQAC, MIS', image_url:'https://picsum.photos/seed/admin2/800/500' },
  { code:'C3',  name:'International Relations',   category:'admin', campus:'main', lat:22.29184, lng:73.36371, description:'Office of CEO, International Affairs, Alumni, Innovation Cell', image_url:'https://picsum.photos/seed/intl/800/500' },
  // HOSPITAL / MEDICAL
  { code:'E1',  name:'Parul Ayurved Hospital',    category:'medical', campus:'main', lat:22.28966, lng:73.36410, description:'Ayurvedic hospital and research', image_url:'https://picsum.photos/seed/ayurved/800/500' },
  { code:'E2',  name:'Parul Sevashram Hospital',  category:'medical', campus:'main', lat:22.28943, lng:73.36502, description:'Multi-specialty 750-bed hospital, 24/7', image_url:'https://picsum.photos/seed/hospital/800/500' },
  // FOOD COURTS
  { code:'F1',  name:'Main Food Court (East)',    category:'food', campus:'main', lat:22.29279, lng:73.36729, description:'Large food court near hostels', image_url:'https://picsum.photos/seed/food1/800/500' },
  { code:'F5',  name:'West Food Court',           category:'food', campus:'main', lat:22.29180, lng:73.36162, description:'Food court near A20 area', image_url:'https://picsum.photos/seed/food5/800/500' },
  { code:'F7',  name:'Central Food Court',        category:'food', campus:'main', lat:22.29311, lng:73.36435, description:'Central campus food court', image_url:'https://picsum.photos/seed/food7/800/500' },
  { code:'F8',  name:'South-East Food Court',     category:'food', campus:'main', lat:22.29176, lng:73.36731, description:'Food court near H23/H24 hostels', image_url:'https://picsum.photos/seed/food8/800/500' },
  // SPORTS (main campus)
  { code:'G1',  name:'PU Football Ground',        category:'sports', campus:'main', lat:22.29235, lng:73.36459, description:'Main football ground', image_url:'https://picsum.photos/seed/football/800/500' },
  { code:'G3',  name:'Multi-Purpose Ground',      category:'sports', campus:'main', lat:22.29314, lng:73.36350, description:'Multi-purpose / football ground', image_url:'https://picsum.photos/seed/ground3/800/500' },
  { code:'G4',  name:'Cricket Ground',            category:'sports', campus:'main', lat:22.29272, lng:73.36574, description:'Main cricket ground', image_url:'https://picsum.photos/seed/cricket/800/500' },
  { code:'G11', name:'Indoor Sports Complex',     category:'sports', campus:'main', lat:22.29489, lng:73.36629, description:'Indoor sports — badminton, basketball, gym', image_url:'https://picsum.photos/seed/indoor/800/500' },
  { code:'S',   name:'Swimming Pool',             category:'sports', campus:'main', lat:22.29183, lng:73.36687, description:'Olympic-size swimming pool', image_url:'https://picsum.photos/seed/pool/800/500' },
  // HOSTELS (main campus)
  { code:'H15', name:'Tagore Bhawan A',           category:'hostel', campus:'main', lat:22.29262, lng:73.36545, description:'Tagore Hostel A block', image_url:'https://picsum.photos/seed/tagore/800/500' },
  { code:'H16', name:'Tagore Bhawan B',           category:'hostel', campus:'main', lat:22.29291, lng:73.36568, description:'Tagore Hostel B block', image_url:'https://picsum.photos/seed/tagore2/800/500' },
  { code:'H19', name:'Teresa Bhawan A/B/C/D',     category:'hostel', campus:'main', lat:22.29091, lng:73.36632, description:'Teresa Hostel blocks', image_url:'https://picsum.photos/seed/teresa/800/500' },
  { code:'H23', name:'Shakuntala Bhawan A/B',     category:'hostel', campus:'main', lat:22.29185, lng:73.36759, description:'Shakuntala Hostel blocks', image_url:'https://picsum.photos/seed/shakuntala/800/500' },
  { code:'H25', name:'Atal Bhawan A1/A2',         category:'hostel', campus:'main', lat:22.29311, lng:73.36824, description:'Atal Hostel blocks', image_url:'https://picsum.photos/seed/atal/800/500' },
  // EAST CAMPUS (across road) — 5 locations
  { code:'H33', name:'Azad Bhawan A (East)',      category:'hostel', campus:'east', lat:22.29561, lng:73.36880, description:'Azad Hostel — east campus across SH158', image_url:'https://picsum.photos/seed/azad/800/500' },
  { code:'H35', name:'Rani Laxmibai Bhawan A',   category:'hostel', campus:'east', lat:22.29616, lng:73.36987, description:'Rani Laxmibai Hostel A', image_url:'https://picsum.photos/seed/rani/800/500' },
  { code:'H36', name:'Rani Laxmibai Bhawan B',   category:'hostel', campus:'east', lat:22.29500, lng:73.36499, description:'Rani Laxmibai Hostel B', image_url:'https://picsum.photos/seed/rani2/800/500' },
  { code:'G9',  name:'Sports Ground G9 (East)',   category:'sports', campus:'east', lat:22.29575, lng:73.37085, description:'Sports ground east campus', image_url:'https://picsum.photos/seed/ground9/800/500' },
  { code:'G10', name:'Sports Ground G10 (East)',  category:'sports', campus:'east', lat:22.29559, lng:73.37132, description:'Sports ground east campus', image_url:'https://picsum.photos/seed/ground10/800/500' },
  // SERVICE / OTHER
  { code:'SM',  name:'Campus Supermart',          category:'service', campus:'main', lat:22.28969, lng:73.36356, description:'Supermarket — daily essentials, groceries, stationery', image_url:'https://picsum.photos/seed/super/800/500' },
  { code:'B1',  name:'Central Bank of India',     category:'bank', campus:'main', lat:22.29121, lng:73.36370, description:'Campus bank branch and ATMs', image_url:'https://picsum.photos/seed/bank/800/500' },
  { code:'GATE',name:'Entry Gate',               category:'service', campus:'main', lat:22.28601, lng:73.36518, description:'Main entrance gate — 173ft wide Greek architecture', image_url:'https://picsum.photos/seed/gate/800/500' },
  { code:'WP',  name:"Watcher's Park",            category:'service', campus:'main', lat:22.29253, lng:73.36486, description:'Recreation area, amphitheatre, movie screenings', image_url:'https://picsum.photos/seed/park/800/500' },
  { code:'FG',  name:'Fountain Garden',           category:'service', campus:'main', lat:22.29187, lng:73.36443, description:'Fountain garden — campus center landmark', image_url:'https://picsum.photos/seed/fountain/800/500' },
];

// ============================================================
// MESSES — 15 real Parul messes
// ============================================================
const MESSES = [
  { name:'Tagore A Mess',        hostel_block:'Tagore Bhawan A (H15)' },
  { name:'Tagore B Mess',        hostel_block:'Tagore Bhawan B (H16)' },
  { name:'Tagore C Mess',        hostel_block:'Tagore Bhawan C (H34)' },
  { name:'Shakuntala A Mess',    hostel_block:'Shakuntala Bhawan A (H23)' },
  { name:'Shakuntala B Mess',    hostel_block:'Shakuntala Bhawan B (H24)' },
  { name:'Teresa C Mess',        hostel_block:'Teresa Bhawan C (H21)' },
  { name:'Teresa D Mess',        hostel_block:'Teresa Bhawan D (H22)' },
  { name:'Medical Mess',         hostel_block:'Medical Block (A12)' },
  { name:'PIT Mess',             hostel_block:'PIT Block (A1/A2)' },
  { name:'Atal A Mess',          hostel_block:'Atal Bhawan A1 (H25)' },
  { name:'Atal B Mess',          hostel_block:'Atal Bhawan B (H32)' },
  { name:'Azad Mess',            hostel_block:'Azad Bhawan A (H33)' },
  { name:'Sarojini C Mess',      hostel_block:'Sarojini Bhawan C (H7)' },
  { name:'Shanti Sadan Mess',    hostel_block:'Shanti Sadan (East)' },
  { name:'Rani Laxmibai Mess',   hostel_block:'Rani Laxmibai Bhawan A (H35)' },
];

const MENUS = {
  breakfast: {
    0:['Aloo Paratha','Curd','Pickle','Chai','Boiled Egg','Seasonal Fruit'],
    1:['Idli','Sambar','Coconut Chutney','Milk','Banana'],
    2:['Poha','Sev','Bhajiya','Chai','Boiled Egg'],
    3:['Upma','Coconut Chutney','Toast with Butter','Tea'],
    4:['Bread Toast','Omelette','Banana','Milk','Tea'],
    5:['Idli Vada','Sambar','Green Chutney','Milk','Fruit Salad'],
    6:['Special Paratha Platter','Curd','Achaar','Chai','Fruit'],
  },
  lunch: {
    0:['Special Biryani','Raita','Salad','Gulab Jamun','Papad'],
    1:['Dal Fry','Rice','Roti','Bhindi Masala','Salad','Papad'],
    2:['Rajma Masala','Jeera Rice','Roti','Aloo Gobi','Pickle','Salad'],
    3:['Dal Makhani','Butter Naan','Paneer Butter Masala','Rice','Salad'],
    4:['Chole Bhature','Rice','Dal Tadka','Mixed Veg','Salad'],
    5:['Kadhi Chawal','Roti','Aloo Jeera','Papad','Salad'],
    6:['Special Thali','Rice','Dal Tadka','Shahi Paneer','Gulab Jamun','Papad','Salad'],
  },
  dinner: {
    0:['Roti','Dal Tadka','Seasonal Veg','Rice','Salad'],
    1:['Roti','Chana Masala','Rice','Aloo Palak','Salad','Papad'],
    2:['Roti','Paneer Bhurji','Dal','Jeera Rice','Salad'],
    3:['Roti','Matar Mushroom','Rice','Dal Fry','Kheer','Salad'],
    4:['Roti','Mix Dal','Aloo Matar','Rice','Salad','Papad'],
    5:['Special Roti','Dal Makhani','Shahi Paneer','Rice','Gulab Jamun'],
    6:['Roti','Rajma','Rice','Mixed Sabzi','Salad','Papad'],
  },
};

const CLUBS_DATA = [
  { name:'TechConnect',      category:'tech',     logo_url:'https://picsum.photos/seed/tech/200/200',    banner_url:'https://picsum.photos/seed/techbanner/1200/400',    founded_year:2018, description:'Hackathons, coding contests, open source, and tech talks. The largest tech club on campus.' },
  { name:'Startup Cell PU',  category:'tech',     logo_url:'https://picsum.photos/seed/startup/200/200', banner_url:'https://picsum.photos/seed/startupbanner/1200/400', founded_year:2019, description:'Entrepreneurship, startup ideation, investor connects, and incubation support.' },
  { name:'Drama & Theatre',  category:'cultural', logo_url:'https://picsum.photos/seed/drama/200/200',   banner_url:'https://picsum.photos/seed/dramabanner/1200/400',   founded_year:2016, description:'Campus plays, street theatre, nukkad natak, and intercollege drama competitions.' },
  { name:'Music Society',    category:'cultural', logo_url:'https://picsum.photos/seed/music/200/200',   banner_url:'https://picsum.photos/seed/musicbanner/1200/400',   founded_year:2015, description:'Bands, classical, indie, and fusion. Weekly jam sessions open to all.' },
  { name:'Photography Club', category:'cultural', logo_url:'https://picsum.photos/seed/photo/200/200',   banner_url:'https://picsum.photos/seed/photobanner/1200/400',   founded_year:2017, description:'Campus photography, workshops, exhibitions, and photo walks.' },
  { name:'Dance Crew PU',    category:'cultural', logo_url:'https://picsum.photos/seed/dance/200/200',   banner_url:'https://picsum.photos/seed/dancebanner/1200/400',   founded_year:2016, description:'Contemporary, hip-hop, classical fusion, and annual dance competitions.' },
  { name:'NSS Unit PU',      category:'nss',      logo_url:'https://picsum.photos/seed/nss/200/200',     banner_url:'https://picsum.photos/seed/nssbanner/1200/400',     founded_year:2014, description:'National Service Scheme — 240-hour social service programs, village camps.' },
  { name:'Debate Union',     category:'academic', logo_url:'https://picsum.photos/seed/debate/200/200',  banner_url:'https://picsum.photos/seed/debatebanner/1200/400',  founded_year:2015, description:'MUN, parliamentary debates, public speaking, and elocution competitions.' },
  { name:'Finance Club',     category:'academic', logo_url:'https://picsum.photos/seed/finance/200/200', banner_url:'https://picsum.photos/seed/financebanner/1200/400', founded_year:2019, description:'Stock markets, investment portfolios, case competitions, and CFA workshops.' },
  { name:'Sports Council',   category:'sports',   logo_url:'https://picsum.photos/seed/sports/200/200',  banner_url:'https://picsum.photos/seed/sportsbanner/1200/400',  founded_year:2013, description:'Organizing all campus tournaments — cricket, football, badminton, athletics.' },
  { name:'Film Society',     category:'cultural', logo_url:'https://picsum.photos/seed/film/200/200',    banner_url:'https://picsum.photos/seed/filmbanner/1200/400',    founded_year:2018, description:'Weekly screenings, review sessions, short film production, and workshops.' },
  { name:'Green Campus',     category:'social',   logo_url:'https://picsum.photos/seed/green/200/200',   banner_url:'https://picsum.photos/seed/greenbanner/1200/400',   founded_year:2020, description:'Sustainability, tree plantation drives, waste management, and eco-awareness.' },
];

const USER_NAMES = [
  ['Melody','Rose','CSE',1,'hosteler'],       ['Priya','Patel','MBA',2,'day_scholar'],
  ['Rahul','Mehta','CSE',3,'hosteler'],      ['Sneha','Desai','Pharmacy',2,'hosteler'],
  ['Rohan','Joshi','Law',1,'hosteler'],       ['Ananya','Singh','CSE',2,'hosteler'],
  ['Karan','Kumar','Architecture',3,'hosteler'],['Pooja','Sharma','Design',2,'day_scholar'],
  ['Aditya','Nair','CSE',4,'hosteler'],      ['Divya','Reddy','MBA',1,'day_scholar'],
  ['Vikram','Rao','CSE',3,'hosteler'],       ['Kavya','Gupta','Fine Arts',2,'hosteler'],
  ['Harsh','Malhotra','CSE',2,'hosteler'],   ['Simran','Kaur','Pharmacy',3,'hosteler'],
  ['Nikhil','Verma','CSE',1,'hosteler'],     ['Riya','Kapoor','MBA',2,'day_scholar'],
  ['Siddharth','Iyer','CSE',4,'hosteler'],   ['Meera','Pillai','Law',3,'hosteler'],
  ['Amit','Saxena','CSE',2,'hosteler'],      ['Neha','Agarwal','Design',1,'hosteler'],
  ['Raj','Thakur','CSE',3,'hosteler'],       ['Ishaan','Bose','CSE',2,'hosteler'],
  ['Tanya','Choudhary','MBA',2,'day_scholar'],['Dev','Bansal','CSE',1,'hosteler'],
  ['Aarav','Modi','Architecture',3,'hosteler'],['Kritika','Sinha','Pharmacy',2,'hosteler'],
  ['Yash','Rathore','Law',4,'hosteler'],     ['Pallavi','Jain','CSE',2,'day_scholar'],
  ['Akash','Tiwari','CSE',3,'hosteler'],     ['Shivani','Mishra','MBA',1,'hosteler'],
  ['Pranav','Pandey','CSE',4,'hosteler'],    ['Aditi','Bhatt','Fine Arts',2,'hosteler'],
  ['Kunal','Ghosh','CSE',3,'hosteler'],      ['Nidhi','Tripathi','Design',2,'day_scholar'],
  ['Varun','Das','CSE',1,'hosteler'],        ['Shreya','Khanna','Pharmacy',3,'hosteler'],
  ['Ankit','Srivastava','MBA',2,'hosteler'], ['Madhavi','Nambiar','Law',4,'hosteler'],
  ['Rishabh','Dubey','CSE',2,'hosteler'],    ['Sakshi','Yadav','CSE',1,'day_scholar'],
  ['Saurabh','Bajaj','Architecture',3,'hosteler'],['Tanvi','Kulkarni','Design',2,'hosteler'],
  ['Chirag','Solanki','CSE',4,'hosteler'],   ['Revathi','Krishnan','MBA',1,'day_scholar'],
  ['Mohit','Bhatia','CSE',3,'hosteler'],     ['Ayesha','Khan','Law',2,'hosteler'],
  ['Dhruv','Patil','CSE',2,'hosteler'],      ['Zara','Mirza','Fine Arts',3,'hosteler'],
  ['Sarthak','Joshi','CSE',1,'hosteler'],    ['Isha','Fernandes','MBA',2,'day_scholar'],
  ['Abhinav','Roy','CSE',4,'hosteler'],      ['Swara','Bhatt','Design',3,'hosteler'],
  ['Farhan','Qureshi','Law',2,'hosteler'],   ['Lavanya','Subramaniam','CSE',3,'hosteler'],
  ['Aman','Chauhan','CSE',1,'hosteler'],
];

const POST_TEMPLATES = [
  { content:"Sunset from the terrace of A25 CV Raman Centre 🌅 This view never gets old after late-night coding sessions!", image_urls:['https://picsum.photos/seed/sunset1/800/500'], post_type:'photo' },
  { content:"Our TechConnect team just qualified for the national round of Smart India Hackathon 2024! 🏆 6 months of hard work paying off.", image_urls:['https://picsum.photos/seed/hackathon/800/500','https://picsum.photos/seed/team1/800/500'], post_type:'photo' },
  { content:"Food at the Central Food Court today was actually 🔥 Rajma chawal hits different on a cold morning", image_urls:['https://picsum.photos/seed/food_post/800/500'], post_type:'photo' },
  { content:"Library at 2 AM. Exam season is real 📚 Anyone else still up? The night owls of PIET assemble", image_urls:['https://picsum.photos/seed/library_night/800/500'], post_type:'photo' },
  { content:"The cricket ground after morning practice. Nothing beats this energy before 7 AM", image_urls:['https://picsum.photos/seed/cricket_morning/800/500'], post_type:'photo' },
  { content:"Built a full REST API with JWT auth and PostgreSQL in 4 hours for our project demo. Might write a blog about the architecture 🧵", image_urls:[], post_type:'general' },
  { content:"Dance practice for the Annual Cultural Fest is getting intense 💃 Performing on 15th Dec — come support us!", image_urls:['https://picsum.photos/seed/dance_practice/800/500'], post_type:'photo' },
  { content:"The Fountain Garden early morning is the most peaceful place on campus. Would recommend 6 AM walks", image_urls:['https://picsum.photos/seed/fountain_am/800/500'], post_type:'photo' },
  { content:"Organized my notes for the entire DSA semester. Sharing tomorrow in Study Groups — CSE 3rd years join!", image_urls:['https://picsum.photos/seed/notes/800/500'], post_type:'photo' },
  { content:"The Watcher's Park movie screening last night was amazing. Watching Interstellar on a big outdoor screen with 200+ people ✨", image_urls:['https://picsum.photos/seed/movie_night/800/500'], post_type:'photo' },
  { content:"Gymkhana finally has new equipment! The PU Gym upgrade is real. Come check out the indoor sports complex 💪", image_urls:['https://picsum.photos/seed/gym/800/500'], post_type:'photo' },
  { content:"Registration for the Inter-University Debate Competition is open. 3 spots left from PU. DM if interested", image_urls:[], post_type:'general' },
  { content:"Final year thesis submission stress is real. Coffee count: 7 cups. Sleep: 3 hours. Worth it? We'll find out 😅", image_urls:['https://picsum.photos/seed/thesis/800/500'], post_type:'photo' },
  { content:"NSS camp photos are out! 3 days in Limda village — built 2 toilet blocks, taught 40 kids, cleaned the village tank", image_urls:['https://picsum.photos/seed/nss1/800/500','https://picsum.photos/seed/nss2/800/500'], post_type:'photo' },
  { content:"Architecture studio at 3 AM. Model making is an art form 🏛️ Presentation in 6 hours", image_urls:['https://picsum.photos/seed/arch_studio/800/500'], post_type:'photo' },
  { content:"Missed three weeks of mess because the food wasn't great. Just came back — they actually improved the dinner menu 👍", image_urls:[], post_type:'general' },
  { content:"Placement season is here. Got shortlisted for TCS interview next week. Nervous doesn't cover it", image_urls:[], post_type:'general' },
  { content:"The sunset from Watcher's Park amphitheatre tier seats. This campus has some genuinely beautiful spots people don't know about", image_urls:['https://picsum.photos/seed/amphitheater/800/500'], post_type:'photo' },
  { content:"Our startup idea just got selected for incubation at Parul Innovation Centre! First milestone done 🚀", image_urls:['https://picsum.photos/seed/startup_celebration/800/500'], post_type:'photo' },
  { content:"Photography club monsoon walk — campus is gorgeous when it's raining and empty on Sunday morning", image_urls:['https://picsum.photos/seed/monsoon1/800/500','https://picsum.photos/seed/monsoon2/800/500','https://picsum.photos/seed/monsoon3/800/500'], post_type:'photo' },
];

const CONFESSIONS = [
  "Walked into the wrong lecture hall, sat for 20 minutes, understood nothing, realized it was Pharmacy. Just went with it.",
  "The WiFi goes out at exactly the moment I'm submitting assignments. Every. Single. Time. It's personal.",
  "Genuinely think the cook at Teresa D mess knows what they're doing. The dinner dal is consistently 10/10.",
  "Wasted ₹500 on printing notes I never opened. The PDF is literally on my phone.",
  "If someone is using the treadmill for exactly 60 seconds and then leaving, I see you at the gym. We all see you.",
  "Found out my seniors are also clueless about placements. We're all just guessing out here.",
  "Fell asleep in the library reading room and woke up to 3 people sitting around me in absolute silence. Most peaceful nap of my life.",
  "We need better mango shakes at the food court. This is the hill I will die on.",
];

const EVENTS_DATA = [
  { title:'Smart India Hackathon — Campus Round', banner:'https://picsum.photos/seed/hackathon_event/1200/400', days_from_now:7,  club_idx:0,  location:'CV Raman Centre (A25)', description:'48-hour hackathon. Form teams of 6. Problem statements from government and industry.' },
  { title:'Annual Cultural Fest — PARUL UTSAV 2024', banner:'https://picsum.photos/seed/cultfest/1200/400', days_from_now:14, club_idx:2, location:"Watcher's Park Amphitheatre", description:'2-day cultural extravaganza. Dance, drama, music, fashion, food.' },
  { title:'TED×PU: Voices of Tomorrow', banner:'https://picsum.photos/seed/ted/1200/400', days_from_now:21, club_idx:7, location:'Harmony Hall (C1)', description:'6 speakers, 3 themes: Technology, Sustainability, and Human Stories.' },
  { title:'Inter-Department Cricket Tournament', banner:'https://picsum.photos/seed/cricket_event/1200/400', days_from_now:5, club_idx:9, location:'PU Football Ground (G1)', description:'CSE vs MBA vs Pharmacy vs Law. Round robin + knockout.' },
  { title:'Photography Walk — Campus Architecture', banner:'https://picsum.photos/seed/photoWalk/1200/400', days_from_now:3, club_idx:4, location:'Entry Gate to Fountain Garden', description:'2-hour morning photo walk. Focus: campus architecture, people, light.' },
  { title:'Workshop: Full-Stack with Node & React', banner:'https://picsum.photos/seed/workshop/1200/400', days_from_now:10, club_idx:0, location:'PIET Computer Lab (A1)', description:'2-day hands-on workshop. Build a complete app from scratch.' },
  { title:'Movie Night: Interstellar (Outdoor)', banner:'https://picsum.photos/seed/movie_event/1200/400', days_from_now:2, club_idx:10, location:"Watcher's Park", description:'Classic Christopher Nolan on a 30-ft outdoor screen.' },
  { title:'NSS Blood Donation Camp', banner:'https://picsum.photos/seed/blooddrive/1200/400', days_from_now:4, club_idx:6, location:'Parul Sevashram Hospital (E2)', description:'Annual blood donation drive. Doctor supervision, light refreshments.' },
  { title:'Debate: AI Will Replace Human Jobs?', banner:'https://picsum.photos/seed/debate_event/1200/400', days_from_now:8, club_idx:7, location:'Bhagat Singh Bhawan (A24)', description:'Oxford-style debate. Open to all departments.' },
  { title:'Startup Pitch Night 2024', banner:'https://picsum.photos/seed/pitch/1200/400', days_from_now:18, club_idx:1, location:'East Hall (C2)', description:'Present your startup idea to mentors and investors.' },
  { title:'Classical Dance Recital', banner:'https://picsum.photos/seed/classical_dance/1200/400', days_from_now:12, club_idx:5, location:'Symphony Hall (A12)', description:'Bharatnatyam, Kathak, and Odissi performances.' },
  { title:'Green Campus — Tree Plantation Drive', banner:'https://picsum.photos/seed/plantation/1200/400', days_from_now:6, club_idx:11, location:'Jay Sudha Botanical Garden', description:'Planting 500 trees across campus.' },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const HASH = await bcrypt.hash('password123', 12);
    console.log('🌱 Starting Latent seed...\n');
    console.log('🧹 Truncating tables...');
    await client.query(`
      TRUNCATE TABLE users, posts, post_reactions, comments, follows, 
      locations, checkins, messes, mess_menu, mess_wallet, mess_orders, 
      clubs, club_members, events, event_rsvps, event_memories, study_groups, 
      study_group_members, lost_found, market_listings, notifications RESTART IDENTITY CASCADE;
    `);

    // 1. Locations (38 total)
    console.log('📍 Inserting campus locations...');
    const locationIds = {};
    for (const loc of LOCATIONS) {
      const { rows } = await client.query(
        `INSERT INTO locations (name,code,category,campus,lat,lng,description,image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [loc.name,loc.code,loc.category,loc.campus,loc.lat,loc.lng,loc.description,loc.image_url]
      );
      locationIds[loc.code] = rows[0].id;
    }
    console.log(`   ✓ ${LOCATIONS.length} locations inserted`);

    // 2. Messes (15)
    console.log('🍽️  Inserting messes...');
    const messIds = [];
    for (const mess of MESSES) {
      const { rows } = await client.query(
        `INSERT INTO messes (name,hostel_block) VALUES ($1,$2) RETURNING id`,
        [mess.name, mess.hostel_block]
      );
      messIds.push(rows[0].id);
    }

    // 3. Mess menus (15 messes × 7 days × 3 meals = 315 rows)
    console.log('📋 Inserting mess menus...');
    for (const messId of messIds) {
      for (let day = 0; day < 7; day++) {
        for (const meal of ['breakfast','lunch','dinner']) {
          const items = MENUS[meal][day];
          await client.query(
            `INSERT INTO mess_menu (mess_id,day_of_week,meal_type,items) VALUES ($1,$2,$3,$4)`,
            [messId, day, meal, JSON.stringify(items)]
          );
        }
      }
    }

    // 4. Users (55)
    console.log('👥 Inserting 55 users...');
    const userIds = [];
    for (let i = 0; i < USER_NAMES.length; i++) {
      const [first, last, dept, year, hostel] = USER_NAMES[i];
      const fullName = `${first} ${last}`;
      const email = `${first.toLowerCase()}.${last.toLowerCase()}@paruluniversity.ac.in`;
      const enrollment = `2${String(21+Math.floor(i/10)).padStart(2,'0')}BTECH${String(10001+i).padStart(5,'0')}`;
      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${first}${last}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
      const defaultMess = messIds[i % messIds.length];
      const { rows } = await client.query(
        `INSERT INTO users (name,email,enrollment_no,password_hash,department,year,avatar_url,
          hostel_type,default_mess_id,onboarding_complete,bio)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE,$10) RETURNING id`,
        [fullName, email, enrollment, HASH, dept, year, avatar, hostel, defaultMess,
         `${dept} student at Parul University. Year ${year}. Exploring ${['tech','design','entrepreneurship','research','sports','music'][i%6]}.`]
      );
      const uid = rows[0].id;
      userIds.push(uid);
      await client.query(`INSERT INTO mess_wallet (user_id,balance) VALUES ($1,500.00)`, [uid]);
      // Interests
      const allInterests = ['Coding','Gaming','Music','Sports','Photography','Art','Debate','Dance','Drama','Fitness','Books','Food','Travel','Finance','Movies','Design','Research','Startups','NSS','Robotics'];
      const userInterests = allInterests.sort(()=>Math.random()-0.5).slice(0, 4+Math.floor(Math.random()*4));
      for (const interest of userInterests) {
        await client.query(`INSERT INTO user_interests (user_id,interest) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [uid, interest]);
      }
    }
    console.log(`   ✓ ${USER_NAMES.length} users inserted`);

    // 5. Follows
    console.log('🤝 Creating follow relationships...');
    for (const uid of userIds) {
      const count = 8 + Math.floor(Math.random() * 8);
      const others = userIds.filter(id => id !== uid).sort(()=>Math.random()-0.5).slice(0, count);
      for (const fid of others) {
        await client.query(`INSERT INTO follows (follower_id,following_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [uid, fid]);
      }
    }

    // 6. Clubs (12)
    console.log('🏛️  Inserting clubs...');
    const clubIds = [];
    for (const club of CLUBS_DATA) {
      const { rows } = await client.query(
        `INSERT INTO clubs (name,category,logo_url,banner_url,founded_year,description) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [club.name, club.category, club.logo_url, club.banner_url, club.founded_year, club.description]
      );
      clubIds.push(rows[0].id);
      const members = [...userIds].sort(()=>Math.random()-0.5).slice(0, 5+Math.floor(Math.random()*11));
      for (let mi = 0; mi < members.length; mi++) {
        const role = mi === 0 ? 'president' : mi === 1 ? 'moderator' : 'member';
        await client.query(`INSERT INTO club_members (user_id,club_id,role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`, [members[mi], rows[0].id, role]);
      }
    }

    // 7. Events (12)
    console.log('📅 Inserting events...');
    const eventIds = [];
    for (const ev of EVENTS_DATA) {
      const start = new Date();
      start.setDate(start.getDate() + ev.days_from_now);
      start.setHours(10 + Math.floor(Math.random()*8), 0);
      const end = new Date(start);
      end.setHours(end.getHours() + 2 + Math.floor(Math.random()*4));
      const createdBy = userIds[Math.floor(Math.random() * userIds.length)];
      const clubId = clubIds[ev.club_idx];
      const { rows } = await client.query(
        `INSERT INTO events (title,description,location_name,club_id,banner_url,start_time,end_time,max_capacity,created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [ev.title, ev.description, ev.location, clubId, ev.banner, start, end, 50+Math.floor(Math.random()*200), createdBy]
      );
      eventIds.push(rows[0].id);
      const rsvpUsers = [...userIds].sort(()=>Math.random()-0.5).slice(0, 5+Math.floor(Math.random()*20));
      for (const uid of rsvpUsers) {
        const status = ['going','going','going','interested'][Math.floor(Math.random()*4)];
        await client.query(`INSERT INTO event_rsvps (user_id,event_id,status) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`, [uid, rows[0].id, status]);
      }
    }

    // 8. Posts (220)
    console.log('📝 Inserting 220 posts...');
    const postIds = [];
    const pollPostIds = [];
    for (let pi = 0; pi < 220; pi++) {
      const uid = userIds[pi % userIds.length];
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));
      createdAt.setHours(Math.floor(Math.random() * 24));

      let content, image_urls, post_type, is_anon;

      if (pi < 20) {
        const tmpl = POST_TEMPLATES[pi % POST_TEMPLATES.length];
        content = tmpl.content; image_urls = tmpl.image_urls; post_type = tmpl.post_type; is_anon = false;
      } else if (pi >= 20 && pi < 28) {
        content = CONFESSIONS[pi - 20]; image_urls = []; post_type = 'confession'; is_anon = true;
      } else if (pi >= 28 && pi < 43) {
        content = ['Which mess has the best dinner?','Best club on campus?','Favourite spot to study?',
          'Most needed campus improvement?','Best food at the food court?','Better: morning classes or afternoon?',
          'Is the campus WiFi getting better?','Favourite event of the year?','Best department socials?',
          'Would you use a campus social app?','Best teaching style — theory or practical?',
          'Most important campus facility?','Rate the sports facilities?','Love the new library seating?',
          'Should placement prep start from 1st year?'][pi-28];
        image_urls = []; post_type = 'poll'; is_anon = false;
      } else {
        const rand = Math.random();
        if (rand < 0.5) {
          const tmpl = POST_TEMPLATES[pi % POST_TEMPLATES.length];
          content = tmpl.content; image_urls = [`https://picsum.photos/seed/campus${pi}/800/500`]; post_type = 'photo';
        } else {
          content = ['Just submitted my project. Sleep now.','Anyone else get food from F7 today? The chole was incredible 🍛',
            `3rd year CSE life be like: code, sleep, repeat. Send help.`,`The campus is actually beautiful in the early morning`,
            `Looking for DBMS study group for end sem. CSE students hit me up!`,
            `TechConnect's next session is on System Design. Register now!`,
            `Photography walk this Sunday 7AM from the Entry Gate. Bring a camera!`,
            `Did anyone get placement from TCS drive yesterday? Congrats to everyone who did!`,
            `The Tagore A mess breakfast is underrated. Try the paratha on Wednesday.`,
            `Is there a good xerox shop near A25? The usual one is too crowded before exams.`
          ][pi % 10];
          image_urls = Math.random() < 0.4 ? [`https://picsum.photos/seed/post${pi}/800/500`] : [];
          post_type = image_urls.length > 0 ? 'photo' : 'general';
        }
        is_anon = false;
      }

      const { rows } = await client.query(
        `INSERT INTO posts (user_id,content,image_urls,post_type,is_anonymous,created_at)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [uid, content, JSON.stringify(image_urls), post_type, is_anon, createdAt]
      );
      const pid = rows[0].id;
      postIds.push(pid);
      if (post_type === 'poll') pollPostIds.push(pid);

      if (post_type === 'poll') {
        const pollOptsData = [
          ['Tagore A','Shakuntala','Teresa D','Atal B'],['TechConnect','Drama Club','NSS','Sports Council'],
          ['Library','CV Raman terrace','Food Court','Watcher\'s Park'],
          ['Better WiFi','More food options','Faster mess','More events'],
          ['Chole','Rajma','Paneer','Dal Makhani'],['Morning','Afternoon','No preference','Both equally bad'],
          ['Yes, definitely','Still slow','Same as before','What WiFi?'],
          ['Cultural Fest','Sports Day','Hackathon','Nothing good this year'],
          ['CSE','MBA','Pharmacy','All good'],['Yes!','No','Maybe','What is Latent?'],
          ['Theory lectures','Practical labs','Mixed','Neither'],
          ['Library','Gym','Mess','Hospital'],['Excellent','Good','Average','Poor'],
          ['Love it!','Too crowded','Same as before','Haven\'t been'],
          ['Yes, from Day 1','Only from 3rd year','Final year only','After graduation']
        ][pollPostIds.length % 15];
        const { rows: pollRows } = await client.query(
          `INSERT INTO polls (post_id,question,ends_at) VALUES ($1,$2,NOW()+INTERVAL '7 days') RETURNING id`,
          [pid, content]
        );
        const pollId = pollRows[0].id;
        for (let oi = 0; oi < pollOptsData.length; oi++) {
          await client.query(`INSERT INTO poll_options (poll_id,option_text,position) VALUES ($1,$2,$3)`, [pollId, pollOptsData[oi], oi]);
        }
        const optRows = (await client.query(`SELECT id FROM poll_options WHERE poll_id=$1`, [pollId])).rows;
        const voters = [...userIds].sort(()=>Math.random()-0.5).slice(0, 10+Math.floor(Math.random()*20));
        for (const voter of voters) {
          const opt = optRows[Math.floor(Math.random()*optRows.length)];
          await client.query(`INSERT INTO poll_votes (user_id,poll_id,option_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`, [voter, pollId, opt.id]);
        }
      }
    }
    console.log(`   ✓ ${postIds.length} posts inserted`);

    // 9. Reactions
    console.log('❤️  Adding reactions...');
    const reactionTypes = ['fire','heart','laugh','clap','wow'];
    for (const pid of postIds) {
      const reactors = [...userIds].sort(()=>Math.random()-0.5).slice(0, Math.floor(Math.random()*15));
      for (const reactor of reactors) {
        const rt = reactionTypes[Math.floor(Math.random()*reactionTypes.length)];
        await client.query(`INSERT INTO post_reactions (user_id,post_id,reaction_type) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`, [reactor, pid, rt]);
      }
    }

    // 10. Comments
    console.log('💬 Adding comments...');
    const COMMENT_TEXTS = ['This is incredible!','Same feeling bro 😂','Which semester are you in?',
      'Great work! 🔥','Love this content','Tag me next time!','This is so relatable 😭',
      'The vibes are unmatched 🌟','Respect for this 🙌','Finally someone said it',
      'Which teacher? Don\'t leave us guessing','Come with us next time!','Valid point actually',
      'The canteen one is too real','1000% agree with this'];
    for (let ci = 0; ci < 160; ci++) {
      const pid = postIds[Math.floor(Math.random()*postIds.length)];
      const uid = userIds[Math.floor(Math.random()*userIds.length)];
      const text = COMMENT_TEXTS[Math.floor(Math.random()*COMMENT_TEXTS.length)];
      await client.query(`INSERT INTO comments (user_id,post_id,content) VALUES ($1,$2,$3)`, [uid, pid, text]);
    }

    // 11. Lost & Found (10 items)
    console.log('🔍 Adding lost & found items...');
    const LF_ITEMS = [
      {type:'lost',title:'Blue Sony WH-1000XM4 Headphones',category:'electronics',desc:'Left in library 2nd floor. Has a red sticker on right cup.',loc:'Central Library (C1)',img:'https://picsum.photos/seed/headphones/800/500'},
      {type:'lost',title:'ID Card + Metro Pass Wallet',category:'documents',desc:'Black leather wallet. Has enrollment card inside.',loc:'Main Food Court (F1)',img:''},
      {type:'found',title:'iPhone 15 (Black, cracked screen)',category:'electronics',desc:'Found near the swimming pool. Screen cracked. Handed to security.',loc:'Swimming Pool (S)',img:'https://picsum.photos/seed/phone/800/500'},
      {type:'lost',title:'Organic Chemistry Atkins Textbook',category:'books',desc:'Purple cover. Name written inside — Priya Patel.',loc:'A4 Pharmacy Block',img:'https://picsum.photos/seed/book/800/500'},
      {type:'found',title:'Water Bottle (Blue Milton)',category:'other',desc:'Found after cricket match. Name written in marker.',loc:'Cricket Ground (G4)',img:'https://picsum.photos/seed/bottle/800/500'},
      {type:'lost',title:'EarPods Pro (White)',category:'electronics',desc:'Lost somewhere between Tagore hostel and food court.',loc:'F1 to H15 route',img:''},
      {type:'found',title:'Car Keys — Honda (3 keys on ring)',category:'other',desc:'Found in parking lot P1. Depositing at admin.',loc:'Visitor Parking (P1)',img:'https://picsum.photos/seed/keys/800/500'},
      {type:'lost',title:'Engineering Drawing Kit (Compass Box)',category:'stationery',desc:'Green Staedtler compass box. Missing since Tuesday.',loc:'A1 PIET Drawing Hall',img:''},
      {type:'found',title:'Spectacles — Blue Frame',category:'accessories',desc:'Found in Harmony Hall after Tuesday lecture.',loc:'Harmony Hall (C1)',img:'https://picsum.photos/seed/specs/800/500'},
      {type:'lost',title:'Badminton Racket',category:'sports',desc:'Yonex racket, blue-yellow. Left in sports complex.',loc:'Indoor Sports Complex (G11)',img:''},
    ];
    for (let i = 0; i < LF_ITEMS.length; i++) {
      const item = LF_ITEMS[i];
      const uid = userIds[i % userIds.length];
      await client.query(
        `INSERT INTO lost_found (user_id,type,title,category,description,image_url,location_hint)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [uid,item.type,item.title,item.category,item.desc,item.img,item.loc]
      );
    }

    // 12. Market listings (8 items)
    console.log('🛍️  Adding market listings...');
    const MARKET_ITEMS = [
      {title:"Shigley's Mechanical Engineering (8th Ed)",category:'books',condition:'good',price:250,imgs:['https://picsum.photos/seed/mech_book/800/500'],desc:'Used for 1 semester. Good condition, some highlights.'},
      {title:'Data Structures by CLRS (3rd Ed)',         category:'books',condition:'like_new',price:400,imgs:['https://picsum.photos/seed/clrs/800/500'],desc:'Barely used. No highlights.'},
      {title:'Canon EF 50mm f/1.8 STM Lens',            category:'electronics',condition:'good',price:7500,imgs:['https://picsum.photos/seed/lens/800/500'],desc:'Works perfectly. Selling as upgrading to mirrorless.'},
      {title:'Bicycle — Hero Sprint 21-speed',           category:'cycles',condition:'good',price:3500,imgs:['https://picsum.photos/seed/cycle/800/500'],desc:'Geared cycle, 1.5 years old. New tyres recently fitted.'},
      {title:'MBA Sem 3 Complete Notes Bundle',          category:'notes',condition:'new',price:150,imgs:['https://picsum.photos/seed/notes_set/800/500'],desc:'Printed and spiral bound. All 5 subjects. Exam-ready.'},
      {title:'JBL Clip 4 Portable Speaker',              category:'electronics',condition:'like_new',price:1200,imgs:['https://picsum.photos/seed/speaker/800/500'],desc:'Used twice. Comes with box and cable.'},
      {title:'HP Pavilion Laptop Bag (15.6")',           category:'other',condition:'good',price:350,imgs:['https://picsum.photos/seed/laptop_bag/800/500'],desc:'Padded, waterproof. Minor scratch on zip.'},
      {title:'Formal Shirts (Set of 3 — Size L)',       category:'clothing',condition:'good',price:500,imgs:['https://picsum.photos/seed/shirts/800/500'],desc:'White, light blue, grey. Good for placement interviews.'},
    ];
    for (let i = 0; i < MARKET_ITEMS.length; i++) {
      const item = MARKET_ITEMS[i];
      const uid = userIds[(i+3) % userIds.length];
      await client.query(
        `INSERT INTO market_listings (user_id,title,description,category,condition,price,image_urls)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [uid,item.title,item.desc,item.category,item.condition,item.price,JSON.stringify(item.imgs)]
      );
    }

    // 13. Study groups (10)
    console.log('📚 Adding study groups...');
    const SG = [
      {subject:'Data Structures & Algorithms (DSA)',location_text:'CV Raman Centre (A25), Room 204', hours_from_now:24, max:8},
      {subject:'Database Management Systems',       location_text:'Library 2nd Floor Reading Room', hours_from_now:48, max:6},
      {subject:'Engineering Mathematics Sem 5',     location_text:'PIET A Block, Room 105',         hours_from_now:12, max:10},
      {subject:'Corporate Law & Compliance',        location_text:'Bose Bhawan (A23), Room 301',    hours_from_now:36, max:5},
      {subject:'Financial Management MBA',          location_text:'FMS (A15), Room 202',            hours_from_now:6,  max:6},
      {subject:'Organic Chemistry Revision',        location_text:'Pharmacy Block (A4), Lab 2',     hours_from_now:18, max:8},
      {subject:'Operating Systems — End Sem Prep',  location_text:'Central Library, Group Study Area', hours_from_now:30, max:12},
      {subject:'Architecture Design Portfolio Review',location_text:'A16 Architecture Block Studio',hours_from_now:72, max:6},
      {subject:'Machine Learning — Lab Practice',   location_text:'CV Raman Centre (A25), ML Lab', hours_from_now:20, max:8},
      {subject:'Company Secretary Exam Prep',       location_text:'Commerce Block (A23), Room 112', hours_from_now:40, max:5},
    ];
    for (let i = 0; i < SG.length; i++) {
      const sg = SG[i];
      const creator = userIds[i % userIds.length];
      const scheduledAt = new Date();
      scheduledAt.setHours(scheduledAt.getHours() + sg.hours_from_now);
      const { rows } = await client.query(
        `INSERT INTO study_groups (subject,name,creator_id,location_text,scheduled_at,max_members)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [sg.subject, sg.subject + ' Group', creator, sg.location_text, scheduledAt, sg.max]
      );
      const gid = rows[0].id;
      await client.query(`INSERT INTO study_group_members (group_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [gid, creator]);
      const others = userIds.filter(id=>id!==creator).sort(()=>Math.random()-0.5).slice(0, 2+Math.floor(Math.random()*4));
      for (const m of others) {
        await client.query(`INSERT INTO study_group_members (group_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [gid, m]);
      }
    }

    // 14. Senior mentors (12)
    console.log('🎓 Adding senior mentors...');
    const seniorSubjects = [['DSA','System Design','Backend Dev'],['MBA Finance','Investment Analysis'],['Contract Law','IPR'],['Architecture Design','Urban Planning'],['Organic Chemistry','Pharmacology'],['Full Stack Dev','DevOps']];
    const bios = ['Helping juniors navigate placement season. Ask me anything about coding interviews.','MBA grad with finance internship experience. Happy to mentor on career planning.','Law student with moot court experience. Love helping with case analysis.','Architecture final year — portfolio, thesis, placement all figured out.','Pharmacy research assistant — here to help with academics and lab work.','Full stack dev, 2 internships done. Will help with projects and resume.'];
    for (let i = 0; i < 12; i++) {
      const uid = userIds[userIds.length - 1 - i];
      await client.query(
        `INSERT INTO senior_mentors (user_id,bio_mentor,subjects) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [uid, bios[i%6], JSON.stringify(seniorSubjects[i%6])]
      );
    }

    // 15. Announcements
    console.log('📢 Adding announcements...');
    const ANNOUNCEMENTS = [
      {title:'Fee Payment Deadline — June 30',priority:'urgent',content:'Last date for fee payment is June 30. Pay at finance office or online. Late fee applicable after deadline.',expires_at:new Date(Date.now()+7*86400000)},
      {title:'Mid-Semester Exams: July 8–12',priority:'normal',content:'Mid-semester exams begin July 8th. Timetable uploaded to academic portal. Hall tickets available from July 5th.',expires_at:new Date(Date.now()+20*86400000)},
      {title:'TCS Campus Drive — July 15',priority:'normal',content:'TCS visiting campus July 15. CTC: ₹3.36 LPA (Ninja), ₹7 LPA (Digital). Register at placement portal before July 10.',expires_at:new Date(Date.now()+12*86400000)},
      {title:'Library Closed Sunday July 7',priority:'info',content:'Central Library will be closed on Sunday July 7 for annual maintenance. Regular hours resume Monday July 8.',expires_at:new Date(Date.now()+10*86400000)},
      {title:'Mess Menu Updated for July',priority:'info',content:'July mess menus have been updated. Special Sunday meals added. Check the Mess section in Latent.',expires_at:new Date(Date.now()+30*86400000)},
    ];
    for (const ann of ANNOUNCEMENTS) {
      await client.query(
        `INSERT INTO announcements (title,priority,content,expires_at) VALUES ($1,$2,$3,$4)`,
        [ann.title, ann.priority, ann.content, ann.expires_at]
      );
    }

    await client.query('COMMIT');
    console.log('\n✅ Latent seed complete!');
    console.log(`   👥 ${USER_NAMES.length} users created`);
    console.log(`   📍 ${LOCATIONS.length} campus locations`);
    console.log(`   🍽️  ${MESSES.length} messes with 7-day menus`);
    console.log(`   🏛️  ${CLUBS_DATA.length} clubs`);
    console.log(`   📅 ${EVENTS_DATA.length} events`);
    console.log(`   📝 ${postIds.length} posts (with real images)`);
    console.log(`   📚 ${SG.length} study groups`);
    console.log(`   🔍 ${LF_ITEMS.length} lost & found items`);
    console.log(`   🛍️  ${MARKET_ITEMS.length} market listings`);
    console.log(`   🎓 12 senior mentors`);
    console.log('\n   Default login for testing:');
    console.log('   Email: melody.rose@paruluniversity.ac.in');
    console.log('   Password: password123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    console.error(err.stack);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(process.exit.bind(process, 1));
