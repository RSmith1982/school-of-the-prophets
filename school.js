/* The School of The Prophets — shared student-records code (Supabase) */
(function(){
  const URL='https://hcalagkylxllmiyrsyuj.supabase.co';
  const KEY='sb_publishable_oB3fMpXhFY5FXsomDn6w0A_NwfBmrvg';
  const sb = window.supabase.createClient(URL, KEY);
  const ADMIN_EMAIL='robertsmith.live4yeshua@outlook.com';

  const COURSES = {
    'scientific-evidence-of-god':{title:'Scientific Evidence of God', built:true},
    'full-gospel':{title:'The Full Gospel', built:true},
    'new-testament':{title:'The New Testament', built:true},
    'apologetics':{title:'Apologetics', built:true},
    'martyrship':{title:'Martyrship', built:true},
    'healing-and-miracles':{title:'Healing and Miracles', built:true},
    'roberts-rules-of-debate':{title:"Robert's Rules of Debate", built:true},
    'deliverance':{title:'Deliverance', built:true},
    'heaven-and-hell':{title:'Heaven and Hell', built:true},
    'old-testament':{title:'The Old Testament', built:true},
    'heresies':{title:'Heresies', built:true},
    'biblical-finances':{title:'Biblical Finances', built:true},
    'hearing-from-god':{title:'Hearing from God', built:true},
    'practical-training-level-one':{title:'Practical Training Level One', built:true, practical:'level-one'},
    'practical-training-level-two':{title:'Practical Training Level Two', built:true, practical:'level-two'},
    'practical-training-level-three':{title:'Practical Training Level Three', built:true, practical:'level-three'},
  };
  // mastery: the level of mastery (1–7, see MASTERY below) every activity of the diploma's practical training must reach
  const DIPLOMAS = {
    Disciple:  {courses:['scientific-evidence-of-god','full-gospel','new-testament','apologetics','martyrship','healing-and-miracles','practical-training-level-one'], practical:'level-one', mastery:4, requires:[]},
    Evangelist:{courses:['roberts-rules-of-debate','deliverance','heaven-and-hell','practical-training-level-two'], practical:'level-two', mastery:5, requires:['Disciple']},
    Pastor:    {courses:['old-testament','heresies','biblical-finances','practical-training-level-two'], practical:'level-two', mastery:7, requires:['Disciple']},
    Prophet:   {courses:['hearing-from-god'], practical:null, mastery:5, requires:['Pastor']},
    Bishop:    {courses:['practical-training-level-three'], practical:'level-three', mastery:7, requires:['Evangelist','Pastor']},
  };
  // The seven levels to mastery. Every activity of practical training is mastered level by level, in order,
  // and each level carries a title: Witness, then Disciple of the activity, then Minister of it, then Instructor of it.
  const MASTERY = {
    1:{title:'Witness',       stage:'Experiencing Receiving',                         short:'Receive it yourself',              tell:'Tell the Bishop when and where you received this ministry yourself, and from whom.'},
    2:{title:'Disciple of',   stage:'Training of Ministry',                           short:'Receive live training',            tell:'Tell the Bishop when, where, and from whom you received live training in this ministry.'},
    3:{title:'Disciple of',   stage:'Witnessing Ministry',                            short:'Witness it ministered',            tell:'Tell the Bishop when and where you witnessed this ministry, and which approved instructor ministered it.'},
    4:{title:'Disciple of',   stage:'Ministering with Instruction',                   short:'Minister under instruction',       tell:'Tell the Bishop when and where you ministered it under instruction, and who instructed you.'},
    5:{title:'Minister of',   stage:'Ministering with Witness to Confirm Competency', short:'Minister before a witness',        tell:'Tell the Bishop when and where you ministered it, and which approved witness confirmed your competency.'},
    6:{title:'Minister of',   stage:'Training with Instruction',                      short:'Train another under instruction',  tell:'Tell the Bishop whom you trained in this ministry, when and where, and who instructed you as you trained them.'},
    7:{title:'Instructor of', stage:'Training with Witness to Confirm Competency',    short:'Train another before a witness',   tell:'Tell the Bishop whom you trained in this ministry, when and where, and which approved witness confirmed your competency.'},
  };
  const MASTERY_MAX = 7;
  // Who the authorized person was for each level, as the student reports it (the first is the usual one)
  const ROLES = {
    1:['Minister — ministered it to me','Witness'],
    2:['Instructor — trained me'],
    3:['Instructor — I witnessed them minister it'],
    4:['Instructor — instructed me as I ministered it'],
    5:['Witness — confirmed my competency to minister it'],
    6:['Instructor — instructed me as I trained another'],
    7:['Witness — confirmed my competency to instruct'],
  };
  // kept for older pages: the description of each level
  const PRACTICAL_PARTS = {}; Object.keys(MASTERY).forEach(n=>{ PRACTICAL_PARTS[n]=MASTERY[n].title+' — '+MASTERY[n].stage; });
  const PRACTICAL_NAMES = {'level-one':'Level One','level-two':'Level Two','level-three':'Level Three'};
  // The activities of each level of practical training. Each activity is mastered through the seven levels above,
  // up to the level of mastery the diploma requires. An activity may name its own levels (e.g. water baptism).
  const PRACTICAL_ACTIVITIES = {
    'level-one': [ // Disciple — the works every believer is sent to do
      ['sharing-the-gospel','Sharing The Gospel'],
      ['street-evangelism','Street Evangelism'],
      ['healing-the-sick','Healing the Sick'],
      ['casting-out-demons','Casting Out Demons'],
      ['baptizing-in-water','Baptizing in Water',{levels:[1,2,3],note:'Be baptized in water yourself, or show proof of it, and tell the Bishop about it — that is level 1, Witness. Then receive training in it and witness a baptism.'}],
      ['baptizing-in-the-holy-spirit','Baptizing in The Holy Spirit'],
      ['baptizing-in-fire','Baptizing in Fire'],
      ['ushering','Ushering'],
      ['childrens-ministry',"Children's Ministry"],
    ],
    'level-two': [ // Evangelist and Pastor — proclaiming and defending the faith, and shepherding the flock
      ['baptizing-in-water','Baptizing in Water',{levels:[4,5,6,7],note:'Evangelists and Prophets perform water baptisms (Minister of Baptizing in Water); Pastors and Bishops also train others to perform them (Instructor of Baptizing in Water).'}],
      ['preaching','Preaching'],
      ['teaching','Teaching'],
      ['giving-a-prophetic-word','Giving a Prophetic Word'],
      ['ministerial-counseling','Ministerial Counseling'],
      ['leading-communion','Leading Communion'],
      ['giving-a-sermon-at-a-funeral','Giving a Sermon at a Funeral'],
      ['starting-a-small-group','Starting a Small Group'],
      ['arranging-an-event','Arranging an Event'],
      ['debating-an-atheist','Debating an Atheist'],
      ['debating-a-muslim','Debating a Muslim'],
      ['debating-a-hindu','Debating a Hindu'],
      ['debating-a-buddhist','Debating a Buddhist'],
      ['debating-a-satanist','Debating a Satanist'],
      ['debating-a-believer-with-a-heresy','Debating a Believer with a Heresy'],
    ],
    'level-three': [ // Bishop — the work of oversight
      ['setting-up-a-church','Setting up a Church'],
      ['holding-a-miracle-event','Holding a Miracle Event'],
      ['ministering-in-a-persecuted-region','Ministering in a Persecuted Region'],
    ],
  };
  const PRACTICAL_PAGE = {'level-one':'practical-training-level-one','level-two':'practical-training-level-two','level-three':'practical-training-level-three'};
  const PLANS = {english:{title:'The Beautiful Reading Plan', page:'the-beautiful-reading-plan.html', total:355}, japanese:{title:'日本語聖書研究 — Japanese Holy Bible Study', page:'japanese-bible-study.html', total:355}};

  // everything a diploma needs, including the diplomas it builds on
  // practical: [{level, mastery, parts:[1..mastery]}] — every activity of that level of training is mastered up to the
  // diploma's level of mastery: 4 (Disciple of) for the Disciple diploma, 5 (Minister of) for Evangelist, 7 (Instructor of) for Pastor and Bishop
  function requirements(diploma){
    const seen=new Set(); const courses=[]; const practical={}; const chain=[];
    (function walk(d){ if(!DIPLOMAS[d]||seen.has(d)) return; seen.add(d); DIPLOMAS[d].requires.forEach(walk); chain.push(d);
      DIPLOMAS[d].courses.forEach(c=>{ if(!courses.includes(c)) courses.push(c); });
      const lv=DIPLOMAS[d].practical; if(lv){ const m=DIPLOMAS[d].mastery||4; practical[lv]=practical[lv]||{level:lv,mastery:0,parts:[]}; if(m>practical[lv].mastery){ practical[lv].mastery=m; practical[lv].parts=[]; for(let n=1;n<=m;n++) practical[lv].parts.push(n); } } })(diploma);
    return {chain, courses, practical:Object.values(practical)};
  }
  // the levels of mastery required for one activity at one level of training (some activities name their own, e.g. water baptism)
  function activityParts(act, pr){
    const o=act[2]||{};
    if(o.levels) return o.levels.filter(n=>n<=pr.mastery);
    return pr.parts;
  }
  // the title a student holds in one activity, given the levels approved so far: the highest level reached in order
  function masteryTitle(name, approvedLevels, required){
    const req=(required||[1,2,3,4,5,6,7]).slice().sort((a,b)=>a-b); let reached=0;
    for(const n of req){ if(approvedLevels.includes(n)) reached=n; else break; }
    if(!reached) return {level:0,title:''};
    const m=MASTERY[reached]; return {level:reached, title: m.title==='Witness' ? 'Witness' : m.title+' '+name};
  }

  async function user(){ const {data}=await sb.auth.getSession(); return data.session?data.session.user:null; }
  function isAdminUser(u){ return !!u && (u.email||'').toLowerCase()===ADMIN_EMAIL; }
  async function profile(){ const u=await user(); if(!u) return null; const {data}=await sb.from('profiles').select('*').eq('id',u.id).maybeSingle(); return data; }
  // Competencies: the authorized people a student may send a report to, whether I am one, and the reports waiting for me
  async function authorizedPeople(){ const {data}=await sb.rpc('authorized_people'); return data||[]; }
  async function isAuthorized(){ const {data}=await sb.rpc('is_authorized'); return !!data; }
  async function pendingForMe(){ const u=await user(); if(!u) return []; const {data}=await sb.from('practical_requests').select('*').eq('verifier_id',u.id).eq('status','pending').order('requested_at'); return data||[]; }
  function activityName(level, slug){ const a=(PRACTICAL_ACTIVITIES[level]||[]).find(x=>x[0]===slug); return a?a[1]:slug; }

  // Small account widget for page headers: <span data-school-account></span>
  async function mountWidget(){
    const el=document.querySelector('[data-school-account]'); if(!el) return;
    const u=await user();
    if(!u){ el.innerHTML='<a href="account.html">Sign in</a>'; return; }
    const p=await profile(); const name=(p&&p.name)||u.email;
    el.innerHTML=`<a href="account.html">${escapeHtml(name)} — my progress</a>`+(isAdminUser(u)?' · <a href="admin.html">Administration</a>':'');
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function fmtDate(d){ return d? new Date(d).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}):''; }

  window.School = { sb, COURSES, DIPLOMAS, MASTERY, MASTERY_MAX, ROLES, PRACTICAL_PAGE, PRACTICAL_PARTS, PRACTICAL_NAMES, PRACTICAL_ACTIVITIES, PLANS, ADMIN_EMAIL, requirements, activityParts, masteryTitle, user, profile, authorizedPeople, isAuthorized, pendingForMe, activityName, isAdminUser, mountWidget, escapeHtml, fmtDate };
  document.addEventListener('DOMContentLoaded', mountWidget);
})();
