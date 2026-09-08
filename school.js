/* The School of The Prophets — shared student-records code (Supabase) */
(function(){
  const URL='https://hcalagkylxllmiyrsyuj.supabase.co';
  const KEY='sb_publishable_oB3fMpXhFY5FXsomDn6w0A_NwfBmrvg';
  const sb = window.supabase.createClient(URL, KEY);
  const ADMIN_EMAIL='robertsmith.live4yeshua@outlook.com';

  const COURSES = {
    'scientific-evidence-of-god':{title:'Scientific Evidence of God', built:true},
    'full-gospel':{title:'The Full Gospel', built:true},
    'new-testament':{title:'The New Testament', built:false},
    'apologetics':{title:'Apologetics', built:false},
    'martyrship':{title:'Martyrship', built:false},
    'healing-and-miracles':{title:'Healing and Miracles', built:true},
    'roberts-rules-of-debate':{title:"Robert's Rules of Debate", built:false},
    'deliverance':{title:'Deliverance', built:true},
    'heaven-and-hell':{title:'Heaven and Hell', built:false},
    'old-testament':{title:'The Old Testament', built:false},
    'heresies':{title:'Heresies', built:false},
    'biblical-finances':{title:'Biblical Finances', built:false},
    'hearing-from-god':{title:'Hearing from God', built:true},
    'practical-training-level-one':{title:'Practical Training Level One', built:true, practical:'level-one'},
    'practical-training-level-two':{title:'Practical Training Level Two', built:true, practical:'level-two'},
    'practical-training-level-three':{title:'Practical Training Level Three', built:false, practical:'level-three'},
  };
  const DIPLOMAS = {
    Disciple:  {courses:['scientific-evidence-of-god','full-gospel','new-testament','apologetics','martyrship','healing-and-miracles'], practical:'level-one', requires:[]},
    Evangelist:{courses:['roberts-rules-of-debate','deliverance','heaven-and-hell'], practical:'level-two', requires:['Disciple']},
    Pastor:    {courses:['old-testament','heresies','biblical-finances'], practical:'level-two', requires:['Disciple']},
    Prophet:   {courses:['hearing-from-god'], practical:null, requires:['Pastor']},
    Bishop:    {courses:[], practical:'level-three', requires:['Evangelist','Pastor']},
  };
  const PRACTICAL_PAGE = {'level-one':'practical-training-level-one','level-two':'practical-training-level-two','level-three':'practical-training-level-three'};
  const PLANS = {english:{title:'The Beautiful Reading Plan', page:'the-beautiful-reading-plan.html', total:355}, japanese:{title:'日本語聖書研究 — Japanese Holy Bible Study', page:'japanese-bible-study.html', total:355}};

  // everything a diploma needs, including the diplomas it builds on
  function requirements(diploma){
    const seen=new Set(); const courses=[]; const practical=new Set(); const chain=[];
    (function walk(d){ if(!DIPLOMAS[d]||seen.has(d)) return; seen.add(d); DIPLOMAS[d].requires.forEach(walk); chain.push(d);
      DIPLOMAS[d].courses.forEach(c=>{ if(!courses.includes(c)) courses.push(c); }); if(DIPLOMAS[d].practical) practical.add(DIPLOMAS[d].practical); })(diploma);
    return {chain, courses, practical:[...practical]};
  }

  async function user(){ const {data}=await sb.auth.getSession(); return data.session?data.session.user:null; }
  function isAdminUser(u){ return !!u && (u.email||'').toLowerCase()===ADMIN_EMAIL; }
  async function profile(){ const u=await user(); if(!u) return null; const {data}=await sb.from('profiles').select('*').eq('id',u.id).maybeSingle(); return data; }

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

  window.School = { sb, COURSES, DIPLOMAS, PRACTICAL_PAGE, PLANS, ADMIN_EMAIL, requirements, user, profile, isAdminUser, mountWidget, escapeHtml, fmtDate };
  document.addEventListener('DOMContentLoaded', mountWidget);
})();
