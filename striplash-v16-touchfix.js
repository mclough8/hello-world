(()=>{
  const canvas=document.getElementById('drawCanvas'),pane=document.getElementById('drawPane'),drawBtn=document.getElementById('drawMode');
  if(!canvas||!pane)return;
  const ctx=canvas.getContext('2d',{alpha:false});
  const stop=e=>{if(pane.classList.contains('hidden'))return;e.preventDefault();e.stopPropagation()};
  ['touchstart','touchmove','touchend','touchcancel'].forEach(type=>canvas.addEventListener(type,stop,{passive:false,capture:true}));
  canvas.addEventListener('gesturestart',stop,{passive:false});

  const style=document.createElement('style');
  style.textContent=`
    .artToolbar{margin:10px 0 2px;padding:10px;border-radius:14px;background:#ffffff0b;border:1px solid #ffffff18}
    .artLabel{font-size:11px;color:#c3b3cf;font-weight:800;letter-spacing:.5px;margin:2px 0 6px}
    .artColors,.artSizes,.artActions{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:9px}
    .artColor{width:38px!important;height:38px!important;min-height:38px!important;padding:0!important;border-radius:50%!important;border:3px solid #ffffff33!important;flex:0 0 38px!important}
    .artColor.active{outline:3px solid #ffd166;outline-offset:2px}
    .artSizes button,.artActions button{min-height:40px!important;padding:8px 10px!important;flex:1 1 75px}
    .artSizes button.active,.artActions button.active{outline:2px solid #ffd166;outline-offset:1px}
    .brushDot{display:inline-block;background:currentColor;border-radius:50%;vertical-align:middle;margin-right:6px}
  `;
  document.head.appendChild(style);

  const toolbar=document.createElement('div');
  toolbar.className='artToolbar';
  toolbar.innerHTML=`
    <div class="artLabel">COLOR</div>
    <div class="artColors">
      <button class="artColor active" data-color="#111111" aria-label="Black" style="background:#111111"></button>
      <button class="artColor" data-color="#e63946" aria-label="Red" style="background:#e63946"></button>
      <button class="artColor" data-color="#ff8c1a" aria-label="Orange" style="background:#ff8c1a"></button>
      <button class="artColor" data-color="#ffd60a" aria-label="Yellow" style="background:#ffd60a"></button>
      <button class="artColor" data-color="#2fb344" aria-label="Green" style="background:#2fb344"></button>
      <button class="artColor" data-color="#228be6" aria-label="Blue" style="background:#228be6"></button>
      <button class="artColor" data-color="#8b5cf6" aria-label="Purple" style="background:#8b5cf6"></button>
      <button class="artColor" data-color="#ff4fa3" aria-label="Pink" style="background:#ff4fa3"></button>
    </div>
    <div class="artLabel">BRUSH SIZE</div>
    <div class="artSizes">
      <button data-size="5" class="secondary"><span class="brushDot" style="width:5px;height:5px"></span>SMALL</button>
      <button data-size="12" class="secondary active"><span class="brushDot" style="width:10px;height:10px"></span>MEDIUM</button>
      <button data-size="28" class="secondary"><span class="brushDot" style="width:16px;height:16px"></span>LARGE</button>
    </div>
    <div class="artActions">
      <button id="eraserTool" class="secondary">ERASER</button>
    </div>`;
  const wrap=pane.querySelector('.canvasWrap');
  if(wrap)wrap.insertAdjacentElement('beforebegin',toolbar);

  let selectedColor='#111111',selectedSize=12,erasing=false;
  const applyTool=()=>{ctx.strokeStyle=erasing?'#ffffff':selectedColor;ctx.lineWidth=selectedSize;ctx.lineCap='round';ctx.lineJoin='round'};
  applyTool();

  toolbar.querySelectorAll('.artColor').forEach(b=>b.addEventListener('click',()=>{
    erasing=false;selectedColor=b.dataset.color;
    toolbar.querySelectorAll('.artColor').forEach(x=>x.classList.remove('active'));b.classList.add('active');
    document.getElementById('eraserTool')?.classList.remove('active');applyTool();
  }));
  toolbar.querySelectorAll('[data-size]').forEach(b=>b.addEventListener('click',()=>{
    selectedSize=Number(b.dataset.size);toolbar.querySelectorAll('[data-size]').forEach(x=>x.classList.remove('active'));b.classList.add('active');applyTool();
  }));
  document.getElementById('eraserTool')?.addEventListener('click',e=>{
    erasing=!erasing;e.currentTarget.classList.toggle('active',erasing);applyTool();
  });

  canvas.addEventListener('pointerdown',applyTool,{capture:true});
  canvas.addEventListener('touchstart',applyTool,{passive:true,capture:true});
  if(drawBtn)drawBtn.addEventListener('click',()=>setTimeout(()=>{canvas.scrollIntoView({block:'center',behavior:'smooth'});canvas.focus?.({preventScroll:true})},80));

  const pairScript=document.createElement('script');
  pairScript.src='./striplash-v16-pairfix.js?v=1';
  document.body.appendChild(pairScript);
})();