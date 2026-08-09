(()=>{
let pairPromptText='',pairPromptLoadKey='';
function pairKey(){return snap?.room?`${snap.room.round_no}-${snap.room.prompt_index}`:''}
async function loadPairPrompt(){
  if(!session||!snap?.room||snap.room.status!=='answering'||snap.room.round_no>2)return;
  const k=pairKey();
  if(pairPromptLoadKey===k&&pairPromptText)return;
  pairPromptLoadKey=k;pairPromptText='';
  $('prompt').textContent='Loading your prompt…';
  try{
    const p=await rpc('my_regular_prompt_snapshot',{p_room_id:session.room_id,p_player_id:session.player_id,p_player_token:session.player_token});
    if(pairKey()!==k)return;
    pairPromptText=p?.prompt||'No prompt assigned.';
    $('prompt').textContent=pairPromptText;
  }catch(e){pairPromptLoadKey='';toast(e.message)}
}

async function advanceSecondPrompts(){
  try{await rpc('next_prompt',{p_room_id:session.room_id,p_host_token:session.host_token});pairPromptLoadKey='';pairPromptText='';await refresh(true)}catch(e){toast(e.message)}
}

prepareVoting=async function(){
  try{await rpc('prepare_voting',{p_room_id:session.room_id,p_host_token:session.host_token});await refresh(true)}catch(e){toast(e.message)}
};

submitCurrent=async function(auto=false){
  if(!snap?.room)return;
  const key=currentKey();if(submittedKey===key)return;
  let typ=answerMode,ans=$('answerText').value.trim(),drawingData=null,a;
  const promptText=snap.room.status==='final_answering'?snap.room.prompt_text:pairPromptText;
  if(snap.room.status==='answering'&&!promptText){if(!auto)return toast('Your prompt is still loading.');}
  if(typ==='drawing'){
    if(drawingDirty){drawingData=canvasData();a=blankAnalysis({drawing:true})}
    else{typ='no_answer';a=blankAnalysis({no_answer:true})}
  }else if(!ans){
    if(!auto)return toast('Type an answer, draw something, or wait for the timer.');
    typ='no_answer';a=blankAnalysis({no_answer:true});
  }else a=analyze(ans,promptText||'');
  try{
    await rpc('submit_answer_v2',{p_room_id:session.room_id,p_player_id:session.player_id,p_player_token:session.player_token,p_answer_type:typ,p_answer:ans,p_drawing_data:drawingData,p_raunch:a.score||0,p_analysis:a});
    submittedKey=key;hydrateKey=key;$('answerText').disabled=true;$('submitBtn').disabled=true;canvas.dataset.locked='1';renderAnalysis(a,key,true);
    if(auto)toast(typ==='no_answer'?'TIME — no answer locked in.':'TIME — answer locked in.');
    await refresh(true);
  }catch(e){toast(e.message)}
};
$('submitBtn').onclick=()=>submitCurrent(false);

loadMatchup=async function(){
  try{
    const m=await rpc('active_matchup_snapshot',{p_code:session.code});
    if(!m){$('matchup').innerHTML='<div class="status">No active matchup.</div>';return}
    $('votePrompt').textContent=m.prompt_text||'Which answer wins?';
    const mine=session.player_id===m.a_player_id||session.player_id===m.b_player_id;
    const aMine=session.player_id===m.a_player_id,bMine=session.player_id===m.b_player_id;
    $('matchup').innerHTML=`<div class="answer">A: ${cardContent(m.a_type,m.a_answer,m.a_drawing)}${aMine?'<div class="small">YOUR ANSWER</div>':(!mine?`<button onclick="castVote('${m.matchup_id}','${m.a_id}')">VOTE A</button>`:'')}</div><div class="answer">B: ${cardContent(m.b_type,m.b_answer,m.b_drawing)}${bMine?'<div class="small">YOUR ANSWER</div>':(!mine?`<button onclick="castVote('${m.matchup_id}','${m.b_id}')">VOTE B</button>`:'')}</div>`;
    const v=+m.votes||0,e=+m.eligible_voters||0;
    if(mine){$('voteStatus').innerHTML=`Your answer is in this matchup — <b>you sit this vote out.</b>${session.isHost?`<br><span class="small">${v}/${e} eligible voters have voted.</span>`:''}`}
    else if(session.isHost){$('voteStatus').innerHTML=`<b>${v}/${e}</b> eligible voters have voted.${e&&v>=e?' <b style="color:var(--green)">EVERYONE ELIGIBLE HAS VOTED ✓</b>':''}`}
    else{$('voteStatus').textContent=votedMatch===m.matchup_id?'Vote locked in.':'Pick the funnier answer.'}
    $('scoreBtn').classList.toggle('hidden',!session.isHost);
    $('scoreBtn').disabled=session.isHost&&e>0&&v<e;
  }catch(e){toast(e.message)}
};

render=function(){
  const r=snap.room,players=snap.players||[],me=players.find(x=>x.id===session.player_id);
  $('roomCode').textContent=r.code;
  document.querySelectorAll('.restart').forEach(b=>b.classList.toggle('hidden',!session.isHost));
  $('players').innerHTML=players.map(p=>`<div class="player"><span>${esc(p.name)} ${p.id===session.player_id?'(you)':''}</span><span class="small">READY</span></div>`).join('');
  if(r.status==='lobby'){
    show('lobby');$('lobbyStatus').textContent=`${players.length} player${players.length===1?'':'s'} joined.`;$('startBtn').classList.toggle('hidden',!session.isHost);
  }else if(r.status==='answering'||r.status==='final_answering'){
    show('answer');if(me)nameReveal(me);prepPrompt(r);
    if(r.status==='final_answering'){
      $('roundLabel').innerHTML='<span class="finalTag">FINAL STRIPLASH · EVERYONE ANSWERS</span>';
      $('prompt').textContent=r.prompt_text;
    }else{
      $('roundLabel').textContent=`ROUND ${r.round_no} · PROMPT ${r.prompt_index}/2`;
      loadPairPrompt();
    }
    $('timer').textContent=formatTimer(remainMs());
    const locked=submittedKey===currentKey();
    $('answerText').disabled=locked;$('submitBtn').disabled=locked;canvas.dataset.locked=locked?'1':'0';
    $('answerStatus').textContent=locked?`LOCKED IN — waiting for these slow bastards… ${snap.submitted}/${players.length}`:`${snap.submitted}/${players.length} answers submitted.`;
    const ready=snap.submitted>=players.length||remainMs()<=0;
    if(r.status==='final_answering'){
      $('votingBtn').textContent='HOST: START FINAL VOTING';
      $('votingBtn').onclick=prepareVoting;
    }else if(r.prompt_index===1){
      $('votingBtn').textContent='HOST: START SECOND PROMPTS';
      $('votingBtn').onclick=advanceSecondPrompts;
    }else{
      $('votingBtn').textContent='HOST: START VOTING';
      $('votingBtn').onclick=prepareVoting;
    }
    $('votingBtn').classList.toggle('hidden',!(session.isHost&&ready));
    hydrateOwn();
  }else if(r.status==='voting'){
    show('vote');loadMatchup();
  }else if(r.status==='results'){
    show('results');$('nextMatchBtn').classList.toggle('hidden',!session.isHost);$('waitNext').classList.toggle('hidden',session.isHost);
  }else if(r.status==='scores'){
    show('scores');const sorted=[...players].sort((a,b)=>b.score-a.score);
    $('leaderboard').innerHTML=sorted.map((p,i)=>`<div class="player"><span>${i+1}. <b>${esc(p.name)}</b></span><span><b>${p.score}</b> pts</span></div>`).join('');
    const finalReady=r.round_no===2;
    $('nextPromptBtn').classList.toggle('hidden',!session.isHost||finalReady);
    $('startFinalBtn').classList.toggle('hidden',!session.isHost||!finalReady);
    $('scoreHeading').textContent=finalReady?'Round 2 Complete':'Round 1 Complete';
  }else if(r.status==='final_voting'){
    show('finalVote');loadFinal();
  }else if(r.status==='finished')showWinner(players);
};

$('nextPromptBtn').onclick=async()=>{try{pairPromptLoadKey='';pairPromptText='';await rpc('next_prompt',{p_room_id:session.room_id,p_host_token:session.host_token});await refresh(true)}catch(e){toast(e.message)}};
})();